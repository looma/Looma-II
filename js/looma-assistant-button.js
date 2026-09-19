(function () {
  'use strict';

  /*
   * looma-assistant-button.js
   * Drives the floating LOOMA Assistant button and its chat modal
   * (includes/looma-assistant-modal.php) on every page.
   *
   * The assistant is a RAG client: it sends the question to the looma-ai
   * service (POST /rag_query, ZVEC semantic search over Looma's ingested
   * content) and renders the service's own-words answer plus the source
   * passages as cards, mirroring the Looma search results page.
   */

  // looma-ai service base URL. looma-ai.js (only on the AI page) publishes the
  // resolved value as window.LOOMAAI_BASE; everywhere else we derive it the
  // same way — same host as the web app, fixed port 8089. Note: hostname has
  // NO port, so we never end up with the broken "host:48080:8089" form.
  var AI_BASE = (function () {
    if (window.LOOMAAI_BASE) return String(window.LOOMAAI_BASE);
    try {
      return window.location.protocol + '//' + window.location.hostname + ':8089';
    } catch (e) {
      return 'http://127.0.0.1:8089';
    }
  })();

  // Rolling conversation history sent to the RAG so follow-up questions keep
  // context. Each turn is { role, content }; the service reads `content`.
  var chatHistory = [];

  /* ---------- localisation (English / Nepali) ----------
   * The assistant communicates in the language the student selected in Looma.
   * The RAG answer is translated server-side (the `language` field sent to
   * /rag_query); these strings localise the assistant's own UI text. */
  function loomaLang() {
    try {
      return (LOOMA.readStore('language', 'cookie') === 'native') ? 'ne' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  var STRINGS = {
    en: {
      title:       'LOOMA Assistant',
      clear:       'Clear chat',
      placeholder: 'Ask me about anything…',
      send:        'Send',
      thinking:    'Thinking…',
      sources:     'Sources from Looma content',
      noAnswer:    '(no answer)',
      reference:   'Reference: ',
      error:       'Sorry — I could not reach the Looma AI service. ',
      emptyHint:   "Ask a question below — the assistant searches Looma's content and answers in its own words."
    },
    ne: {
      title:       'LOOMA सहायक',
      clear:       'कुराकानी खाली गर',
      placeholder: 'मलाई जे पनि सोध्नुहोस्…',
      send:        'पठाउनुहोस्',
      thinking:    'सोच्दै…',
      sources:     'Looma सामग्रीका स्रोतहरू',
      noAnswer:    '(उत्तर छैन)',
      reference:   'सन्दर्भ: ',
      error:       'माफ गर्नुहोस् — Looma AI सेवामा पुग्न सकिएन। ',
      emptyHint:   'तल प्रश्न सोध्नुहोस् — सहायकले Looma सामग्री खोजी आफ्नै शब्दमा उत्तर दिन्छ।'
    }
  };

  function t(key) {
    var lang = STRINGS[loomaLang()] || STRINGS.en;
    return (key in lang) ? lang[key] : STRINGS.en[key];
  }

  // Localise the modal's static labels to the current Looma language.
  function applyAssistantLanguage() {
    $('#looma-assistant-modal-title').text(t('title'));
    $('#looma-assistant-rag-clear').text(t('clear'));
    $('#looma-assistant-rag-run').text(t('send'));
    $('#looma-assistant-rag-question').attr('placeholder', t('placeholder'));
    // The empty-chat hint is a CSS ::before that reads data-empty-hint.
    $('#looma-assistant-rag-chat').attr('data-empty-hint', t('emptyHint'));
  }

  function openModal() {
    // Reflect the current Looma language each time the assistant opens.
    applyAssistantLanguage();
    // Surface the on-screen keyboard so a teacher with only the projector
    // pointer can type into the chat box.
    $('button.show-keyboard').css({ display: 'inline-block', zIndex: 2147483647 });
    // Re-parent the OSK panel INTO the modal so that, when the user pops it
    // up, it stacks ABOVE the modal scrim and card. At body level the modal's
    // max z-index would otherwise bury the panel (z:9999); inside the modal
    // the panel sits in the modal's own stacking context and renders on top.
    var $kbPanel = $('#looma-keyboard-container');
    if ($kbPanel.length) $kbPanel.appendTo('#looma-assistant-modal');
    // display:flex so the .ai-modal centering (looma-assistant.css) applies.
    $('#looma-assistant-modal').css('display', 'flex');
    setTimeout(function () {
      // Focus AND fire a click on the textarea so looma-keyboard.js sets its
      // `destination` to the chat box — focus alone does not trigger its
      // handler, so without the click the OSK would not know where to type.
      $('#looma-assistant-rag-question').focus().trigger('click');
    }, 60);
  }

  function closeModal() {
    $('#looma-assistant-modal').css('display', 'none');
    // Restore the keyboard button to whatever the page CSS says (hidden by
    // default; explicitly shown on pages that opt it in). Setting display:''
    // drops the inline override so the stylesheet wins again.
    $('button.show-keyboard').css({ display: '', zIndex: '' });
    // Tuck the OSK panel away and put it back at the body level so other
    // pages (dictionary, search, ...) keep using it as before.
    var $kbPanel = $('#looma-keyboard-container');
    if ($kbPanel.length) {
      $kbPanel.css('display', 'none').appendTo(document.body);
    }
  }

  // The assistant now lives in the main toolbar (a normal .toolbar-button,
  // laid out by CSS like Home/Library/…), not as a floating control-button —
  // so it no longer needs JS to park itself above the speak/lookup/keyboard
  // stack. The keyboard's `right` still needs to track the speak button's
  // column on pages that shift it off the 5vw default (e.g. the clock page
  // uses 7vw), so that half of the old positionAssistantButton() stays.
  function alignKeyboardWithSpeak() {
    var speakBtn = document.querySelector('button.speak');
    if (!speakBtn) return;
    var speakRight = window.getComputedStyle(speakBtn).right;
    if (speakRight && speakRight !== 'auto') {
      $('button.show-keyboard').css('right', speakRight);
    }
  }

  /* ---------- rendering helpers ---------- */

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Minimal, XSS-safe markdown: escape first, then re-apply **bold** and lists.
  function renderAnswerHtml(text) {
    var lines = String(text || '').split(/\r?\n/);
    var html = '';
    var inList = false;
    lines.forEach(function (raw) {
      var line = escapeHtml(raw).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      var trimmed = raw.trim();
      if (/^[-•*]\s+/.test(trimmed)) {
        if (!inList) { html += '<ul class="ai-answer-list">'; inList = true; }
        html += '<li>' + line.replace(/^\s*[-•*]\s+/, '') + '</li>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        if (trimmed) html += '<p>' + line + '</p>';
      }
    });
    if (inList) html += '</ul>';
    return html || '<p>(no answer)</p>';
  }

  function chatBox() { return $('#looma-assistant-rag-chat'); }

  function scrollChatToEnd() {
    var box = chatBox();
    if (box.length) box.scrollTop(box[0].scrollHeight);
  }

  function appendUserMessage(text) {
    chatBox().append($('<div class="ai-chat-entry user">').text(text));
    scrollChatToEnd();
  }

  function appendErrorMessage(text) {
    chatBox().append(
      $('<div class="ai-chat-entry assistant ai-chat-error">').text(text)
    );
    scrollChatToEnd();
  }

  // Renders one assistant turn: the own-words answer, then the source cards,
  // then any references the service attached.
  function appendAssistantMessage(data) {
    var entry = $('<div class="ai-chat-entry assistant">');
    entry.append($('<div class="ai-answer">').html(renderAnswerHtml(data.answer || t('noAnswer'))));

    var contexts = (data.contexts || []).filter(function (c) {
      return c && (c.dn || c.ndn || c.fn);
    });
    if (contexts.length) {
      entry.append($('<div class="ai-result-heading">').text(t('sources')));
      // Render each source with the SAME builder the search results page uses
      // (LOOMA.makeActivityButton) so the cards are byte-for-byte identical to
      // search-result cards. The grid CSS lays them out as 2 rows of 3.
      var grid = $('<div class="ai-result-grid">');
      entry.append(grid);
      contexts.forEach(function (c) {
        try {
          LOOMA.makeActivityButton(c, c._id, c.db || 'looma', c.mongoID || null, grid);
        } catch (e) {
          /* skip a malformed context rather than break the whole answer */
        }
      });
    }

    // References the service attached alongside the answer. The only one it can
    // still produce is the Looma dictionary: the assistant answers from this
    // box's own content, so there is no Wikipedia (or any other online) source
    // to render, and nothing here may carry an off-box link a class cannot open.
    var refs = data.external_refs || [];
    if (refs.length) {
      var refWrap = $('<div class="ai-ext-refs">');
      refs.forEach(function (r) {
        if (r && r.type === 'dictionary') {
          refWrap.append(
            $('<div class="ai-ext-ref">')
              .text(t('reference'))
              .append($('<span>').text('Dictionary — ' + (r.word || r.en || '')))
          );
        }
      });
      if (refWrap.children().length) entry.append(refWrap);
    }

    chatBox().append(entry);
    scrollChatToEnd();
  }

  /* ---------- talking to the RAG service ---------- */

  function askAssistant(question) {
    var $status = $('#looma-assistant-rag-status');
    var $send = $('#looma-assistant-rag-run');

    appendUserMessage(question);
    $('#looma-assistant-rag-question').val('');
    $status.text(t('thinking'));
    $send.prop('disabled', true);

    // ZVEC semantic search, fixed top-k of 6 — the user does not tune these.
    // `language` makes the service answer in Nepali when Nepali is selected.
    var payload = {
      question: question,
      mode: 'semantic',
      topk: 6,
      language: loomaLang(),
      history: chatHistory.slice(-10)
    };

    fetch(AI_BASE + '/rag_query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (resp) {
      return resp.json().then(function (data) {
        if (!resp.ok || !data || data.ok === false) {
          throw new Error((data && data.error) || ('Service error (HTTP ' + resp.status + ')'));
        }
        return data;
      });
    }).then(function (data) {
      $status.text('');
      appendAssistantMessage(data);
      chatHistory.push({ role: 'user', content: question });
      chatHistory.push({ role: 'assistant', content: data.answer || '' });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
    }).catch(function (err) {
      $status.text('');
      appendErrorMessage(t('error') + (err && err.message ? err.message : err));
    }).then(function () {
      $send.prop('disabled', false);
      $('#looma-assistant-rag-question').focus();
    });
  }

  function submitQuestion() {
    var q = $('#looma-assistant-rag-question').val().trim();
    if (q) askAssistant(q);
  }

  /* ---------- wiring ---------- */

  function initAssistantButton() {
    // The assistant IS looma-ai, which only exists on a box installed with the
    // zvec stack. Where it was left out, hide the button instead of offering a
    // chat that can never answer. (No flag at all = an older box that has the
    // stack; see includes/looma-features.php.)
    var features = (typeof window !== 'undefined' && window.LOOMA_FEATURES) || {};
    if (features.assistant === false) {
      $('button.looma-assistant').css('display', 'none');
      return;
    }

    // The assistant is a normal toolbar button (see includes/toolbar.php /
    // toolbar-vertical.php) and reachable on every page that shows the main
    // toolbar. It only exists in the DOM on pages that include one of those,
    // so an empty jQuery set elsewhere is a harmless no-op.
    $('button.looma-assistant').css('display', '');

    alignKeyboardWithSpeak();
    $(window).on('resize', alignKeyboardWithSpeak);
    document.addEventListener('fullscreenchange', alignKeyboardWithSpeak);
    document.addEventListener('webkitfullscreenchange', alignKeyboardWithSpeak);

    // Show modal when assistant button clicked
    $(document).on('click', '.looma-assistant, button.looma-assistant', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });

    // Close handlers
    $(document).on('click', '#looma-assistant-modal-close', function (e) {
      e.preventDefault();
      closeModal();
    });

    // Close on click outside the modal card
    $(document).on('click', '#looma-assistant-modal', function (e) {
      if (e.target === this) closeModal();
    });

    // Close on Escape
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && $('#looma-assistant-modal').css('display') !== 'none') {
        closeModal();
      }
    });

    // Clear chat
    $(document).on('click', '#looma-assistant-rag-clear', function (e) {
      e.preventDefault();
      $('#looma-assistant-rag-chat').empty();
      $('#looma-assistant-rag-status').text('');
      chatHistory = [];
    });

    // Send / run
    $(document).on('click', '#looma-assistant-rag-run', function (e) {
      e.preventDefault();
      submitQuestion();
    });

    // Enter sends the question; Shift+Enter inserts a newline.
    $(document).on('keydown', '#looma-assistant-rag-question', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitQuestion();
      }
    });

    // Localise the static labels to the language Looma is currently set to.
    applyAssistantLanguage();
  }

  $(document).ready(function () { initAssistantButton(); });
})();
