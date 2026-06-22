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

  // Media-navigation buttons share the looma-control-button class but are a
  // separate group — they are excluded when finding the top of the utility set
  // (Fullscreen, Piper/TTS, Lookup, ...).
  var MEDIA_NAV_IDS = ['next-item', 'prev-item', 'fullscreen-playpause'];

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
      limit:       'Limit to selected chapter',
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
      limit:       'छानिएको अध्यायमा सीमित गर',
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
    $('#looma-assistant-limit-label').text(t('limit'));
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

  // Place the assistant ALWAYS at the top of the looma-control-button column,
  // regardless of which other buttons (speak, lookup, keyboard, …) the current
  // page happens to show. The keyboard is included in the topEdge calculation
  // now, so the assistant lands above it instead of underneath.
  function positionAssistantButton() {
    var $assistant = $('button.looma-assistant');
    if (!$assistant.length || $assistant.css('display') === 'none') return;

    var topEdge = 0;  // highest occupied point, px measured from viewport bottom
    $('button.looma-control-button').each(function () {
      if (this === $assistant[0]) return;
      if (MEDIA_NAV_IDS.indexOf(this.id) !== -1) return;
      var cs = window.getComputedStyle(this);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var bottom = parseFloat(cs.bottom);
      if (isNaN(bottom)) return;
      var height = parseFloat(cs.height);
      var edge = bottom + (isNaN(height) ? 0 : height);
      if (edge > topEdge) topEdge = edge;
    });

    // Share the Piper/TTS button's column so the assistant — and the keyboard
    // below it — line up vertically with the rest (some pages shift them off
    // 5vw, e.g. the clock page uses 7vw).
    var speakBtn = document.querySelector('button.speak');
    var alignRight = null;
    if (speakBtn) {
      var speakRight = window.getComputedStyle(speakBtn).right;
      if (speakRight && speakRight !== 'auto') alignRight = speakRight;
    }
    var gap = window.innerHeight * 0.01;  // ~1vh — matches the existing stack
    var update = { top: 'auto' };          // clear any stray `top` so `bottom` applies
    if (alignRight) update.right = alignRight;
    if (topEdge > 0) update.bottom = Math.round(topEdge + gap) + 'px';
    $assistant.css(update);

    // Keep the keyboard column-aligned with the assistant. Its vertical
    // position is owned by CSS (per page / global default) so it sits in the
    // contiguous stack just like speak and lookup; only its `right` is synced
    // here so the column doesn't drift on pages that move speak off 5vw.
    if (alignRight) {
      $('button.show-keyboard').css('right', alignRight);
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
  // then any external references (Wikipedia / dictionary).
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

    var refs = data.external_refs || [];
    if (refs.length) {
      var refWrap = $('<div class="ai-ext-refs">');
      refs.forEach(function (r) {
        var label = (r.type === 'wikipedia') ? ('Wikipedia — ' + (r.title || ''))
                  : (r.type === 'dictionary') ? ('Dictionary — ' + (r.word || r.en || ''))
                  : (r.type || 'Reference');
        var item = r.url
          ? $('<a target="_blank" rel="noopener">').attr('href', r.url).text(label)
          : $('<span>').text(label);
        refWrap.append($('<div class="ai-ext-ref">').text(t('reference')).append(item));
      });
      entry.append(refWrap);
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

    // "Limit to selected chapter": scope the search to the chapter/subject the
    // student currently has open (stored in session by the rest of Looma).
    if ($('#looma-assistant-rag-use-filters').prop('checked')) {
      try {
        var chapter = LOOMA.readStore('chapter', 'session');
        var subject = LOOMA.readStore('subject', 'session');
        var grade = parseInt(LOOMA.readStore('class', 'session'), 10);
        if (chapter) payload.chapter_id = chapter;
        if (subject) payload.subject = subject;
        if (!isNaN(grade)) payload.grade = grade;
      } catch (e) {}
    }

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
    // The assistant should be reachable on every page (not just those that
    // also show the Speak/TTS button) — students may want to ask questions on
    // the home, library, history, dictionary pages too. The button only exists
    // in the DOM on pages that include looma-control-buttons.php anyway, so an
    // empty jQuery set on other pages is a harmless no-op.
    $('button.looma-assistant').css('display', 'inline-block');

    // Park it at the top of the control-button set, and keep it there when the
    // viewport or fullscreen state changes the rest of the stack.
    positionAssistantButton();
    setTimeout(positionAssistantButton, 300);  // re-run once layout settles
    $(window).on('resize', positionAssistantButton);
    document.addEventListener('fullscreenchange', positionAssistantButton);
    document.addEventListener('webkitfullscreenchange', positionAssistantButton);

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
