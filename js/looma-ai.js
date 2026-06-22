'use strict';

window.__LOOMA_AI_JS_LOADED = true;

var AI_BASE = (function () {
  if (window.LOOMAAI_BASE) return String(window.LOOMAAI_BASE);
  try {
    return window.location.protocol + '//' + window.location.hostname + ':8089';
  } catch (e) {
    return 'http://127.0.0.1:8089';
  }
})();
// Expose the resolved base URL for other scripts (e.g. PDF editor) that want to
// call looma-ai endpoints without re-deriving the host/port.
try { window.LOOMAAI_BASE = AI_BASE; } catch (_) {}

function qs(sel) { return document.querySelector(sel); }
function qsv(id) { var el = qs(id); return el ? (el.value || '').trim() : ''; }

function safeDecodeURIComponent(value) {
  try { return decodeURIComponent(value); } catch (_) { return value; }
}

function loomaPdfViewerUrl(webPath, options) {
  if (!webPath) return null;
  var raw = String(webPath).replace(/\\/g, '/').split('#')[0].split('?')[0];
  if (!/\.pdf$/i.test(raw)) return webPath;

  var slash = raw.lastIndexOf('/');
  var fp = slash >= 0 ? raw.slice(0, slash + 1) : '';
  var fn = slash >= 0 ? raw.slice(slash + 1) : raw;
  var page = options && options.page ? options.page : 1;
  var zoom = options && options.zoom ? options.zoom : '2.3';

  return 'pdf?fn=' + encodeURIComponent(safeDecodeURIComponent(fn))
    + '&fp=' + encodeURIComponent(safeDecodeURIComponent(fp))
    + '&page=' + encodeURIComponent(page)
    + '&zoom=' + encodeURIComponent(zoom);
}

function setBaseUi() {
  try {
    var openHealth = qs('#ai-open-health');
    if (openHealth) openHealth.href = AI_BASE + '/health';
  } catch (_) {}
}

function setPageTitleByLanguage() {
  // The body title stays "Looma AI Tooling" regardless of the language
  // selector — the brand name should not be translated.
  var el = qs('#ai-page-title');
  if (!el) return;
  el.textContent = 'Looma AI Tooling';
}

// Save chapter selection state to localStorage
function saveChapterSelectionState() {
  try {
    var state = {
      grade: qsv('#ai-grade'),
      subject: qsv('#ai-subject'),
      language: qsv('#ai-language'),
      chapter: qsv('#ai-chapter')
    };
    localStorage.setItem('looma_ai_chapter_state', JSON.stringify(state));
  } catch (_) {}
}

// Restore chapter selection state from localStorage
function restoreChapterSelectionState() {
  try {
    var stored = localStorage.getItem('looma_ai_chapter_state');
    if (!stored) return false;
    var state = JSON.parse(stored);
    if (!state.grade || !state.subject) return false;
    
    var gradeSel = qs('#ai-grade');
    var subjectSel = qs('#ai-subject');
    var langSel = qs('#ai-language');
    
    if (gradeSel && state.grade) gradeSel.value = state.grade;
    if (langSel && state.language) langSel.value = state.language;
    
    // Store chapter to restore after chapters are loaded
    if (state.chapter) {
      aiPendingRestoreChapter = {
        chapter_id: state.chapter,
        grade: state.grade,
        subject: state.subject,
        language: state.language
      };
    }
    
    return true;
  } catch (_) {}
  return false;
}

function isBackForwardNavigation() {
  try {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'back_forward') return true;
  } catch (_) {}
  try {
    return !!(performance.navigation && performance.navigation.type === 2);
  } catch (_) {}
  return false;
}

function setConnection(ok, text) {
  var el = qs('#ai-connection');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#2b7' : '#c33';
}

function setActionStatus(text, isError) {
  var el = qs('#ai-action-status');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#c33' : '';
}

function setRagStatus(text, isError) {
  var el = qs('#ai-rag-status');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#c33' : '';
}

function setRagFeedbackStatus(text, isError) {
  var el = qs('#ai-rag-feedback-status');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#c33' : '';
}

function setPdfStatus(text, isError) {
  var el = qs('#ai-pdf-status');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#c33' : '';
}

var aiTaskStatus = Object.create(null);
var aiLastSummaryWebPath = null;
var aiLastRagPayload = null;
var aiLastRagMessageEl = null;
var aiChatHistory = []; // [{role:'user'|'assistant', content:'...'}]
var aiDeletePending = null; // { type: 'pdf'|'summary'|'keywords', chapterId, grade, subject, language }
var aiPendingRestoreChapter = null; // {chapter_id, grade, subject, language}

function deleteDisplayName(type) {
  type = String(type || '').toLowerCase();
  if (type === 'pdf') return 'PDF';
  if (type === 'summary') return 'Summary';
  if (type === 'keywords') return 'Keywords';
  return type || 'file';
}

function expectedFilename(type, chapterId) {
  type = String(type || '').toLowerCase();
  chapterId = String(chapterId || '').trim();
  if (!chapterId) return '';
  if (type === 'pdf') return chapterId + '.pdf';
  if (type === 'summary') return chapterId + '.summary';
  if (type === 'keywords') return chapterId + '.keywords';
  return chapterId;
}

function openDeleteConfirm(type) {
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');

  aiDeletePending = {
    type: String(type || '').toLowerCase(),
    chapterId: chapterId,
    grade: grade ? Number(grade) : null,
    subject: subject || null,
    language: language || 'en'
  };

  var body = qs('#ai-delete-modal-body');
  if (body) {
    var name = deleteDisplayName(aiDeletePending.type);
    var fn = expectedFilename(aiDeletePending.type, chapterId);
    body.innerHTML =
      'Are you sure you want to delete <strong>' + name + '</strong>'
      + (fn ? (' (<code>' + escHtml(fn) + '</code>)') : '')
      + ' for chapter <code>' + escHtml(chapterId) + '</code>?';
  }

  showModal('#ai-delete-modal', true);
}

async function confirmDeleteNow() {
  if (!aiDeletePending) return;

  var payload = {
    chapter_id: aiDeletePending.chapterId,
    grade: aiDeletePending.grade,
    subject: aiDeletePending.subject,
    language: aiDeletePending.language,
    type: aiDeletePending.type
  };

  setActionStatus('Deleting ' + deleteDisplayName(aiDeletePending.type) + '...', false);
  setTaskStatus('status', 'Deleting ' + deleteDisplayName(aiDeletePending.type) + '...', false);

  try {
    var out = await apiJson('/delete_resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 20000,
      body: JSON.stringify(payload)
    });
    if (out && out.ok === false) throw new Error(out.error || 'Delete failed');
    showModal('#ai-delete-modal', false);
    aiDeletePending = null;
    setActionStatus('Deleted.', false);
    await refreshStatus();
  } catch (e) {
    setActionStatus('Delete error: ' + e.message, true);
    setTaskStatus('status', 'Delete error: ' + e.message, true);
  }
}

function ragAppendMessage(role, text, opts) {
  opts = opts || {};
  var box = qs('#ai-rag-chat');
  if (!box) return null;

  var row = document.createElement('div');
  row.className = 'ai-chat-msg ' + (role === 'user' ? 'user' : 'bot');

  var bubble = document.createElement('div');
  bubble.className = 'ai-chat-bubble';

  var meta = document.createElement('div');
  meta.className = 'ai-chat-meta';

  var who = document.createElement('span');
  who.textContent = role === 'user' ? 'You' : 'LOOMA';

  var when = document.createElement('span');
  try {
    when.textContent = opts.meta || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (_) { when.textContent = opts.meta || ''; }

  meta.appendChild(who);
  meta.appendChild(when);

  var body = document.createElement('div');
  body.className = 'ai-chat-text';
  body.textContent = (text || '').trim();

  bubble.appendChild(meta);
  bubble.appendChild(body);
  row.appendChild(bubble);
  box.appendChild(row);

  try { box.scrollTop = box.scrollHeight; } catch (_) {}
  return { row: row, bubble: bubble, body: body };
}

function loomaTeacherAidUrl(type, chapterId) {
  if (!type || !chapterId) return null;
  return (
    'looma-play-teacher-aid.php'
    + '?dn=' + encodeURIComponent(type)
    + '&type=' + encodeURIComponent(type)
    + '&ch_id=' + encodeURIComponent(chapterId)
  );
}

function setTaskStatus(task, text, isError) {
  aiTaskStatus[String(task || 'status')] = {
    text: String(text || ''),
    isError: !!isError,
    ts: Date.now()
  };
  renderTaskStatus();
}

function renderTaskStatus() {
  var el = qs('#ai-action-log');
  if (!el) return;

  var keys = Object.keys(aiTaskStatus);
  if (!keys.length) {
    el.textContent = '';
    setActionStatus('', false);
    return;
  }

  var order = ['status', 'summary', 'keywords', 'quiz', 'teacher_guide', 'lessons', 'activities'];
  if (order.indexOf('vocab') === -1) order.splice(4, 0, 'vocab');
  keys.sort(function (a, b) {
    var ia = order.indexOf(a);
    var ib = order.indexOf(b);
    if (ia === -1) ia = 999;
    if (ib === -1) ib = 999;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });

  var lines = [];
  var summaryParts = [];
  keys.forEach(function (k) {
    var v = aiTaskStatus[k];
    if (!v) return;
    lines.push(k + ': ' + v.text);
    if (k !== 'status') summaryParts.push(k + ': ' + v.text);
  });
  el.textContent = lines.join('\n');

  // Compact, per-content status line right under the table.
  setActionStatus(summaryParts.join(' | '), summaryParts.some(function (p) { return /error:/i.test(p); }));
}

async function apiJson(path, opts) {
  opts = opts || {};
  var timeoutMs = (typeof opts.timeoutMs === 'number') ? opts.timeoutMs : 8000;
  var controller = (window.AbortController) ? new AbortController() : null;
  var timer = null;
  if (controller) {
    opts.signal = controller.signal;
    timer = setTimeout(function () { try { controller.abort(); } catch (_) {} }, timeoutMs);
  }
  var res;
  try {
    res = await fetch(AI_BASE + path, opts);
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (!res.ok) {
    var t = await res.text();
    throw new Error(res.status + ' ' + t);
  }
  return await res.json();
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdownLite(text) {
  // Safety: escape HTML first, then apply markdown transforms
  var lines = String(text || '').split('\n');
  var html = '';
  var inList = false;
  lines.forEach(function (raw) {
    var line = escHtml(raw);
    // Bold **text**
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Inline code `text`
    line = line.replace(/`([^`]+)`/g, '<code>$1</code>');
    if (/^[-•]\s/.test(raw.trim())) {
      if (!inList) { html += '<ul class="ai-md-list">'; inList = true; }
      html += '<li>' + line.replace(/^[-•]\s/, '') + '</li>';
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      var trimmed = line.trim();
      if (trimmed) html += '<p class="ai-md-p">' + trimmed + '</p>';
    }
  });
  if (inList) html += '</ul>';
  return html || ('<p>' + escHtml(text) + '</p>');
}

function renderRag(out) {
  aiLastRagPayload = out || null;
  setRagFeedbackStatus('', false);

  var answerText = (out && out.answer ? String(out.answer) : '').trim() || '(no answer)';

  // Fill pending assistant message (created in runRag), otherwise append.
  var msg = aiLastRagMessageEl;
  if (!msg || !msg.body) msg = ragAppendMessage('bot', '', {});
  if (msg && msg.body) {
    msg.body.innerHTML = renderMarkdownLite(answerText);
    try { msg.body.classList.remove('ai-typing'); } catch (_) {}
  }
  aiLastRagMessageEl = msg;

  if (!msg || !msg.bubble) return;

  // Clear previous action/source blocks inside the last assistant bubble.
  try {
    var old = msg.bubble.querySelectorAll('.ai-chat-actions, .ai-chat-sources');
    for (var i = 0; i < old.length; i++) old[i].remove();
  } catch (_) {}

  // Source / WH-kind tag — small visual hint about where the answer came from
  // and what shape of question it was. Helps the user understand that the chat
  // can answer who/what/when/where/why/how on any topic, falling back to
  // Wikipedia or the Looma dictionary when the curriculum doesn't cover it.
  try {
    var src = out && out.answer_source;
    var wh = out && out.wh_kind;
    if (src || wh) {
      var meta = document.createElement('div');
      meta.className = 'ai-chat-sources';
      var refs = (out && Array.isArray(out.external_refs)) ? out.external_refs : [];
      var refHtml = refs.map(function (r) {
        if (r && r.type === 'wikipedia' && r.url) {
          return ' <a href="' + r.url + '" target="_blank" rel="noopener">'
               + escHtml(r.title || 'Wikipedia') + '</a>';
        }
        if (r && r.type === 'dictionary') {
          return ' <span title="Looma dictionary">📖 ' + escHtml(r.word || '') + '</span>';
        }
        return '';
      }).join('');
      meta.innerHTML = '<span class="muted" style="font-size:12px;">'
        + (wh ? ('<b>' + escHtml(wh) + '</b>') : '')
        + (src ? ('  •  source: ' + escHtml(String(src))) : '')
        + refHtml
        + '</span>';
      msg.bubble.appendChild(meta);
    }
  } catch (_) {}

  // Feedback + copy actions.
  var actions = document.createElement('div');
  actions.className = 'ai-chat-actions';
  actions.innerHTML =
    "<button id='ai-rag-feedback-up' type='button' class='black-border' title='Helpful'>👍</button>"
    + "<button id='ai-rag-feedback-down' type='button' class='black-border' title='Not helpful'>👎</button>"
    + "<button id='ai-rag-copy' type='button' class='black-border ai-copy-btn' title='Copy answer'>Copy</button>"
    + "<span id='ai-rag-feedback-status' class='muted'></span>";
  msg.bubble.appendChild(actions);

  try {
    var up = actions.querySelector('#ai-rag-feedback-up');
    if (up) up.addEventListener('click', function (e) { e.preventDefault(); sendRagFeedback(true).catch(function () {}); });
    var down = actions.querySelector('#ai-rag-feedback-down');
    if (down) down.addEventListener('click', function (e) { e.preventDefault(); sendRagFeedback(false).catch(function () {}); });
    var copyBtn = actions.querySelector('#ai-rag-copy');
    if (copyBtn) copyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var text = answerText;
      function markCopied() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(markCopied).catch(function () {});
      } else {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;top:-9999px;left:0;';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          markCopied();
        } catch (_) {}
      }
    });
  } catch (_) {}

  // Sources / contexts (collapsible).
  var ctx = (out && Array.isArray(out.contexts)) ? out.contexts : [];
  if (!ctx.length) return;

  var details = document.createElement('details');
  details.className = 'ai-chat-sources';
  var sum = document.createElement('summary');
  sum.textContent = 'Sources (' + ctx.length + ')';
  details.appendChild(sum);

  var ctxBox = document.createElement('div');
  ctxBox.className = 'ai-rag-contexts';
  details.appendChild(ctxBox);
  msg.bubble.appendChild(details);

  ctx.forEach(function (c, idx) {
    if (!c || typeof c !== 'object') return;
    var card = document.createElement('div');
    card.className = 'ai-rag-context';

    var text = (c.rag_text || c.text || '').trim();
    var score = (typeof c.score === 'number') ? c.score : (typeof c.hybrid_score === 'number' ? c.hybrid_score : null);
    var scoreStr = (score === null) ? '' : ('score: ' + score.toFixed(4));

    // If the context is in Looma "search result" shape (ft/fp/fn), render it like search results.
    if (window.LOOMA && typeof window.LOOMA.makeActivityButton === 'function' && c.ft) {
      var holder = document.createElement('div');
      holder.className = 'ai-rag-holder';
      card.appendChild(holder);
      try { window.LOOMA.makeActivityButton(c, c._id || c.id || ('ctx' + idx), c.db || 'looma', c.mongoID, holder); } catch (_) {}
      if (scoreStr) {
        var s = document.createElement('div');
        s.className = 'muted';
        s.style.marginTop = '6px';
        s.textContent = scoreStr;
        card.appendChild(s);
      }
      var t = document.createElement('div');
      t.className = 'text';
      t.textContent = text || '(no text)';
      card.appendChild(t);
      ctxBox.appendChild(card);
      return;
    }

    // Fallback (should be rare now).
    var title = c.dn || c.file_name || ('Context ' + (idx + 1));
    var href = c.source_path || null;
    card.innerHTML =
      "<div class='meta'>"
      + "<div class='title'>" + escHtml(title) + "</div>"
      + "<div class='actions'>" + (href ? ("<a target='_blank' rel='noopener' href='" + escHtml(href) + "'>Open</a>") : '') + "</div>"
      + "</div>"
      + (scoreStr ? ("<div class='muted' style='margin-bottom:6px;'>" + escHtml(scoreStr) + "</div>") : '')
      + "<div class='text'>" + escHtml(text || '(no text)') + "</div>";
    ctxBox.appendChild(card);
  });

  // Navigation cards (when server detected a "find chapter" intent)
  var navItems = (out && Array.isArray(out.navigation)) ? out.navigation : [];
  if (navItems.length) {
    var navSec = document.createElement('div');
    navSec.className = 'ai-nav-cards';
    navSec.innerHTML = '<div class="ai-nav-label">Related chapters:</div>';
    navItems.forEach(function (n) {
      if (!n || !n.chapter_id) return;
      var nc = document.createElement('div');
      nc.className = 'ai-nav-card';
      var label = escHtml(n.title || n.chapter_id);
      var meta = [];
      if (n.grade) meta.push('Grade ' + escHtml(String(n.grade)));
      if (n.subject) meta.push(escHtml(n.subject));
      nc.innerHTML = '<div class="ai-nav-card-title">' + label + '</div>'
        + (meta.length ? '<div class="ai-nav-card-meta">' + meta.join(' · ') + '</div>' : '');
      navSec.appendChild(nc);
    });
    msg.bubble.appendChild(navSec);
  }
}

async function runRag() {
  var question = qsv('#ai-rag-question');
  if (!question) {
    setRagStatus('Missing question.', true);
    return;
  }

  var useFilters = !!(qs('#ai-rag-use-filters') && qs('#ai-rag-use-filters').checked);
  var chapterId = useFilters ? qsv('#ai-chapter') : '';
  var grade = useFilters ? qsv('#ai-grade') : '';
  var subject = useFilters ? qsv('#ai-subject') : '';
  var language = qsv('#ai-language');

  var engine = 'zvec';  // zvec is the only search engine
  var mode = qsv('#ai-rag-mode') || 'hybrid';
  var topk = 6;
  try { topk = Number(qsv('#ai-rag-topk') || '6'); } catch (_) { topk = 6; }

  ragAppendMessage('user', question, {});
  aiChatHistory.push({ role: 'user', content: question });
  aiLastRagMessageEl = ragAppendMessage('bot', '…', {});
  try { if (aiLastRagMessageEl && aiLastRagMessageEl.body) aiLastRagMessageEl.body.classList.add('ai-typing'); } catch (_) {}
  setRagStatus('Thinking…', false);
  try {
    var out = await apiJson('/rag_query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 90000,
      body: JSON.stringify({
        question: question,
        engine: engine,
        mode: mode,
        topk: topk,
        chapter_id: chapterId || null,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        include_contexts: true,
        history: aiChatHistory.slice(-10)
      })
    });
    if (!out || out.ok !== true) throw new Error(out && out.error ? out.error : 'RAG failed');
    if (out.warning) setRagStatus(String(out.warning), false);
    else setRagStatus('Done.', false);
    renderRag(out);
    // Record bot reply in history
    var botReply = (out && out.answer) ? String(out.answer) : '';
    if (botReply) aiChatHistory.push({ role: 'assistant', content: botReply });
    // Trim history to last 20 turns
    if (aiChatHistory.length > 20) aiChatHistory = aiChatHistory.slice(-20);
  } catch (e) {
    setRagStatus('Error: ' + e.message, true);
    try {
      if (aiLastRagMessageEl && aiLastRagMessageEl.body) {
        aiLastRagMessageEl.body.innerHTML = '<p class="ai-md-p" style="color:#c33;">Error: ' + escHtml(e.message) + '</p>';
        try { aiLastRagMessageEl.body.classList.remove('ai-typing'); } catch (_) {}
      }
    } catch (_) {}
  }
}

async function sendRagFeedback(helpful) {
  var out = aiLastRagPayload;
  if (!out || out.ok !== true) {
    setRagFeedbackStatus('No RAG result to rate yet.', true);
    return;
  }

  var chapterId = qsv('#ai-chapter');
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');

  var ctx = Array.isArray(out.contexts) ? out.contexts : [];
  var ctxIds = ctx
    .map(function (c) { return c && (c._id || c.id) ? String(c._id || c.id) : ''; })
    .filter(function (s) { return !!s; })
    .slice(0, 20);

  setRagFeedbackStatus('Saving…', false);
  try {
    var res = await apiJson('/rag_feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 15000,
      body: JSON.stringify({
        helpful: !!helpful,
        question: out.question || '',
        engine: out.engine || 'zvec',
        mode: out.mode || null,
        chapter_id: chapterId || null,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        contexts: ctxIds,
        answer: out.answer || ''
      })
    });
    if (!res || res.ok !== true) throw new Error(res && res.error ? res.error : 'Feedback failed');
    setRagFeedbackStatus('Saved.', false);
  } catch (e) {
    setRagFeedbackStatus('Error: ' + e.message, true);
  }
}

async function replaceChapterPdf() {
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) {
    setPdfStatus('Select a chapter first.', true);
    return;
  }

  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');

  var fileEl = qs('#ai-pdf-file');
  var file = fileEl && fileEl.files ? fileEl.files[0] : null;
  if (!file) {
    setPdfStatus('Pick a PDF file.', true);
    return;
  }
  if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name || '')) {
    setPdfStatus('That does not look like a PDF.', true);
    return;
  }

  setPdfStatus('Uploading...', false);
  try {
    var fd = new FormData();
    fd.append('chapter_id', chapterId);
    if (grade) fd.append('grade', grade);
    if (subject) fd.append('subject', subject);
    if (language) fd.append('language', language);
    fd.append('file', file, file.name || (chapterId + '.pdf'));

    var res = await fetch(AI_BASE + '/replace_pdf', { method: 'POST', body: fd });
    var txt = await res.text();
    if (!res.ok) throw new Error(res.status + ' ' + txt);
    var out = {};
    try { out = JSON.parse(txt || '{}'); } catch (_) { out = {}; }
    if (out && out.ok !== true) throw new Error(out && out.error ? out.error : 'Upload failed');
    var backup = out && out.paths ? out.paths.backup : null;
    setPdfStatus(backup ? ('Replaced. Backup: ' + backup) : 'Replaced.', false);
    try { if (fileEl) fileEl.value = ''; } catch (_) {}
    await refreshStatus();
  } catch (e) {
    setPdfStatus('Error: ' + e.message, true);
  }
}

function renderCards(status) {
  var box = qs('#ai-status-cards');
  if (!box) return;
  box.innerHTML = '';

  // If no chapter is selected, show "Select chapter" with warning icon for all contexts
  if (!status) {
    var warningCard = document.createElement('div');
    warningCard.style.cssText = 'padding:16px;background:rgba(255,168,0,0.08);border:1px solid rgba(255,168,0,0.3);border-radius:10px;display:flex;gap:6px;align-items:center;';
    
    var icon = document.createElement('div');
    icon.style.cssText = 'flex:0 0 auto;display:flex;width:28px;height:28px;background:rgba(255,168,0,0.8);border-radius:50%;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:14px;';
    icon.textContent = '⚠';
    
    var text = document.createElement('div');
    text.style.cssText = 'flex:1;font-size:14px;color:#ffa800;';
    text.textContent = 'Select a chapter to view content status.';
    
    warningCard.appendChild(icon);
    warningCard.appendChild(text);
    box.appendChild(warningCard);
    return;
  }

  function pill(ok, label) {
    var s = document.createElement('span');
    s.className = 'ai-pill ' + (ok ? 'ok' : 'missing');
    s.textContent = label;
    return s;
  }

  function makeCheckbox(id, checked, disabled) {
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.checked = !!checked;
    if (disabled) cb.disabled = true;
    return cb;
  }

  function makeButton(text, onClick, disabled) {
    var b = document.createElement('button');
    b.className = 'black-border';
    b.type = 'button';
    b.textContent = text;
    if (disabled) b.disabled = true;
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (b.disabled) return;

      b.disabled = true;
      b.classList.add('ai-pending');

      try {
        var out = onClick();
        if (out && typeof out.then === 'function') {
          out.then(
            function () {},
            function () {}
          ).then(function () {
            b.classList.remove('ai-pending');
            b.disabled = false;
          });
        } else {
          b.classList.remove('ai-pending');
          b.disabled = false;
        }
      } catch (_) {
        b.classList.remove('ai-pending');
        b.disabled = false;
      }
    });
    return b;
  }

  function makeIconButton(className, title, onClick, disabled) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'looma-control-button ai-inline-control ' + (className || '');
    b.title = title || '';
    b.setAttribute('aria-label', title || '');
    if (disabled) b.disabled = true;
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (b.disabled) return;
      try { onClick(); } catch (_) {}
    });
    return b;
  }

  function makeActionGroup(leftNode, rightNode) {
    if (!leftNode && !rightNode) return null;
    var wrap = document.createElement('div');
    wrap.className = 'ai-action-group';
    if (leftNode) wrap.appendChild(leftNode);
    if (rightNode) wrap.appendChild(rightNode);
    return wrap;
  }

  function addRow(table, title, valueNode, actionNode) {
    var tr = document.createElement('tr');
    var td1 = document.createElement('td');
    td1.className = 'ai-td-label';
    td1.textContent = title;
    var td2 = document.createElement('td');
    td2.className = 'ai-td-value';
    td2.appendChild(valueNode);
    var td3 = document.createElement('td');
    td3.className = 'ai-td-action';
    if (actionNode) td3.appendChild(actionNode);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    table.appendChild(tr);
  }

  // Section header that spans the table — used to fold rows into the
  // "Teacher Aids" and "Resources" folders the user requested. Optional
  // `actionNode` becomes a button on the right of the header (e.g. "Open
  // folder" for Resources).
  function addSectionHeader(table, title, actionNode) {
    var tr = document.createElement('tr');
    tr.className = 'ai-section-header';
    var td = document.createElement('td');
    td.colSpan = 2;
    td.className = 'ai-section-label';
    td.textContent = title;
    var td2 = document.createElement('td');
    td2.className = 'ai-td-action';
    if (actionNode) td2.appendChild(actionNode);
    tr.appendChild(td);
    tr.appendChild(td2);
    table.appendChild(tr);
  }

  var exists = status && status.exists ? status.exists : {};
  var wp = status && status.web_paths ? status.web_paths : {};
  aiLastSummaryWebPath = wp.summary || null;

  var tg = status && status.teacher_guides ? !!status.teacher_guides.present : false;

  var byFt = status && status.activities && status.activities.by_ft ? status.activities.by_ft : {};
  var lessonCount = (byFt.lesson || byFt.lessons || 0);
  var resourcesCount = 0;
  try {
    Object.keys(byFt).forEach(function (k) {
      if (k === 'lesson' || k === 'lessons') return;
      resourcesCount += Number(byFt[k] || 0);
    });
  } catch (_) {}

  var table = document.createElement('table');
  table.className = 'ai-table';

  // Header
  var thead = document.createElement('thead');
  var hr = document.createElement('tr');
  ['Item', 'Status', 'Action'].forEach(function (t, idx) {
    var th = document.createElement('th');
    th.textContent = t;
    if (idx === 0) th.className = 'ai-td-label';
    if (idx === 1) th.className = 'ai-td-value';
    if (idx === 2) th.className = 'ai-td-action';
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  var tbody = document.createElement('tbody');
  table.appendChild(tbody);

  var pdfWebPath = (status && status.web_paths && status.web_paths.pdf) || null;
  var pickPdf = function () {
    var fileEl = qs('#ai-pdf-file');
    if (!fileEl) return;
    try { fileEl.value = ''; } catch (_) {}
    fileEl.click();
  };
  var openPdfViewer = function () {
    if (!pdfWebPath) return;
    window.location = loomaPdfViewerUrl(pdfWebPath);
  };
  var openPdfEditor = function () {
    if (!pdfWebPath) return;
    if (!window.LoomaPdfEditor || typeof window.LoomaPdfEditor.open !== 'function') {
      setPdfStatus('PDF editor is not available on this page.', true);
      return;
    }
    var chapterId = qsv('#ai-chapter');
    var grade = qsv('#ai-grade');
    var subject = qsv('#ai-subject');
    var language = qsv('#ai-language');
    window.LoomaPdfEditor.open({
      chapterId: chapterId || null,
      grade: grade ? Number(grade) : null,
      subject: subject || null,
      language: language || null,
      sourceUrl: pdfWebPath
    });
  };
  // ─────────────────────────────────────────────────────────────────────
  // Top-level rows: PDF + Lesson
  // ─────────────────────────────────────────────────────────────────────

  // PDF — OPEN when present; UPLOAD when missing.
  var pdfActionNode;
  if (exists.pdf) {
    var openPdf = makeButton('Open', openPdfViewer, !pdfWebPath);
    var updatePdf = makeButton('Update', pickPdf, false);
    var editPdf   = makeButton('Edit',   openPdfEditor, !pdfWebPath);
    pdfActionNode = makeActionGroup(openPdf, makeActionGroup(updatePdf, editPdf));
  } else {
    pdfActionNode = makeButton('Upload', pickPdf, false);
  }
  addRow(tbody, 'PDF', pill(!!exists.pdf, exists.pdf ? 'Present' : 'Missing'), pdfActionNode);

  // Lesson — Generate when missing, Open + Replace when present.
  var hasLesson = !!(exists && exists.lesson);
  var lessonWebPath = (status && status.web_paths && status.web_paths.lesson) || null;
  var lessonInfo = (status && status.lesson) || null;
  var lessonStatusLabel = hasLesson
    ? (lessonInfo && lessonInfo.author === 'AI' ? 'AI lesson present' : 'Lesson linked')
    : (lessonCount > 0 ? (String(lessonCount) + ' linked') : 'Missing');
  var lessonActionNode;
  if (hasLesson) {
    var openLesson = lessonWebPath
      ? makeButton('Open', function () { window.open(lessonWebPath, '_blank', 'noopener'); }, false)
      : null;
    var replaceLesson = makeButton('Replace', function () {
      return generateLesson({ overwrite: true });
    }, false);
    lessonActionNode = openLesson ? makeActionGroup(openLesson, replaceLesson) : replaceLesson;
  } else {
    lessonActionNode = makeButton('Generate', function () {
      return generateLesson({ overwrite: false });
    }, false);
  }
  addRow(tbody, 'Lesson', pill(hasLesson || lessonCount > 0, lessonStatusLabel), lessonActionNode);

  // ─────────────────────────────────────────────────────────────────────
  // Section: Teacher Aids — header has an "Open folder" shortcut that
  // lands the teacher on looma-teacher-aids.php?ch_id=<chapter>.
  // ─────────────────────────────────────────────────────────────────────
  var openTeacherAidsFolder = makeButton('Open folder', function () {
    var chapterId = qsv('#ai-chapter');
    if (!chapterId) return;
    var grade = qsv('#ai-grade');
    var subject = qsv('#ai-subject');
    var language = qsv('#ai-language');
    var chSel = qs('#ai-chapter');
    var chDn = '';
    try {
      if (chSel && chSel.selectedOptions && chSel.selectedOptions[0]) {
        chDn = chSel.selectedOptions[0].textContent || '';
      }
    } catch (_) {}
    var url = 'looma-teacher-aids.php?ch_id=' + encodeURIComponent(chapterId);
    if (grade)    url += '&grade=' + encodeURIComponent(grade);
    if (subject)  url += '&subject=' + encodeURIComponent(subject);
    if (language) url += '&lang=' + encodeURIComponent(language);
    if (chDn)     url += '&chdn=' + encodeURIComponent(chDn);
    window.location = url;
  }, false);
  addSectionHeader(tbody, 'Teacher Aids', openTeacherAidsFolder);

  // Summary — Generate / (Open + Replace).
  var summaryActionNode;
  if (exists.summary) {
    var openSummary = makeButton('Open', function () {
      var chapterId = qsv('#ai-chapter');
      var href = loomaTeacherAidUrl('summary', chapterId);
      if (href) window.location = href;
    }, false);
    var replaceSummary = makeButton('Replace', function () {
      return publishResources({ types: ['summary'], overwrite: true });
    }, false);
    summaryActionNode = makeActionGroup(openSummary, replaceSummary);
  } else {
    summaryActionNode = makeButton('Generate', function () {
      return publishResources({ types: ['summary'], overwrite: false });
    }, false);
  }
  addRow(tbody, 'Summary', pill(!!exists.summary, exists.summary ? 'Present' : 'Missing'), summaryActionNode);

  // Chapter Objectives — Generate / (Open + Replace).
  var hasObjectives = !!(exists && (exists.objectives || exists.chapter_objectives));
  var objectivesActionNode;
  if (hasObjectives) {
    var openObjectives = makeButton('Open', function () {
      var chapterId = qsv('#ai-chapter');
      var href = loomaTeacherAidUrl('objectives', chapterId);
      if (href) window.location = href;
    }, false);
    var replaceObjectives = makeButton('Replace', function () {
      return generateObjectives({ overwrite: true, publish: true });
    }, false);
    objectivesActionNode = makeActionGroup(openObjectives, replaceObjectives);
  } else {
    objectivesActionNode = makeButton('Generate', function () {
      return generateObjectives({ overwrite: false, publish: true });
    }, false);
  }
  addRow(tbody, 'Chapter Objectives', pill(hasObjectives, hasObjectives ? 'Present' : 'Missing'), objectivesActionNode);

  // Keywords — Generate / (Open + Replace).
  var keywordsActionNode;
  if (exists.keywords) {
    var openKeywords = makeButton('Open', function () {
      var chapterId = qsv('#ai-chapter');
      var href = loomaTeacherAidUrl('keywords', chapterId);
      if (href) window.location = href;
    }, false);
    var replaceKeywords = makeButton('Replace', function () {
      return publishResources({ types: ['keywords'], overwrite: true });
    }, false);
    keywordsActionNode = makeActionGroup(openKeywords, replaceKeywords);
  } else {
    keywordsActionNode = makeButton('Generate', function () {
      return publishResources({ types: ['keywords'], overwrite: false });
    }, false);
  }
  addRow(tbody, 'Keywords', pill(!!exists.keywords, exists.keywords ? 'Present' : 'Missing'), keywordsActionNode);

  // ─────────────────────────────────────────────────────────────────────
  // Section: Resources (chapter folder) — header has an "Open folder"
  // shortcut that lands the teacher on looma-activities.php?ch=<chapter>.
  // ─────────────────────────────────────────────────────────────────────
  var openResourcesFolder = makeButton('Open folder', function () {
    var chapterId = qsv('#ai-chapter');
    if (!chapterId) return;
    window.location = 'activities?ch=' + encodeURIComponent(chapterId);
  }, false);
  addSectionHeader(tbody, 'Resources', openResourcesFolder);

  // Exercises (Quiz) — Generate when missing; Open + Generate More when
  // present. "Generate More" tells the AI service to append N new questions
  // (server keeps the existing ones and adds extras with a different seed).
  var hasQuiz = !!(exists && exists.quiz);
  var openQuizBtn = makeButton('Open', function () {
    var chapterId = qsv('#ai-chapter');
    if (!chapterId) {
      try { window.alert('Pick a chapter first.'); } catch (_) {}
      return;
    }
    openAIPage('quiz', chapterId);
  }, false);
  var quizActionNode;
  if (hasQuiz) {
    var generateMoreQuiz = makeButton('Generate More', function () {
      return generateQuiz({ overwrite: false, publish: true, append: true });
    }, false);
    quizActionNode = makeActionGroup(openQuizBtn, generateMoreQuiz);
  } else {
    quizActionNode = makeButton('Generate', function () {
      return generateQuiz({ overwrite: false, publish: true });
    }, false);
  }
  addRow(tbody, 'Exercises (Quiz)', pill(hasQuiz, hasQuiz ? 'Present' : 'Missing'), quizActionNode);

  // Games — Key Vocabulary game. The game itself reads dictionary entries
  // for the chapter (`LOOMA.wordlist`), so there's nothing to "publish" —
  // the page is always available; we just expose Open from here.
  var openVocabBtn = makeButton('Open', function () {
    var chapterId = qsv('#ai-chapter');
    if (!chapterId) {
      try { window.alert('Pick a chapter first.'); } catch (_) {}
      return;
    }
    openAIPage('vocab', chapterId);
  }, false);
  addRow(tbody, 'Games — Key Vocabulary', pill(true, 'Available'), openVocabBtn);

  box.appendChild(table);
}

function showModal(id, show) {
  var el = qs(id);
  if (!el) return;
  el.style.display = show ? 'flex' : 'none';
}

function openSummaryEditor() {
  var editor = qs('#ai-summary-editor');
  if (!editor) return;

  var preview = qs('#ai-preview-summary');
  var text = preview ? String(preview.textContent || '') : '';
  if (text.trim() === '(no summary file)') text = '';
  editor.value = text.trim();
  showModal('#ai-summary-modal', true);
  try { editor.focus(); } catch (_) {}
}

function openKeywordsEditor() {
  var editor = qs('#ai-keywords-editor');
  if (!editor) return;

  var preview = qs('#ai-preview-keywords');
  var text = preview ? String(preview.textContent || '') : '';
  if (text.trim() === '(no keywords file)') text = '';
  editor.value = text.trim();
  showModal('#ai-keywords-modal', true);
  try { editor.focus(); } catch (_) {}
}

async function saveSummaryEdit() {
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var editor = qs('#ai-summary-editor');
  if (!editor) return;

  var text = String(editor.value || '').trim();
  if (!text) {
    setTaskStatus('summary', 'Error: summary is empty.', true);
    return;
  }

  setTaskStatus('summary', 'Saving...', false);
  try {
    var out = await apiJson('/save_summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 20000,
      body: JSON.stringify({
        chapter_id: chapterId,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        summary_text: text
      })
    });
    if (out && out.ok === false) throw new Error(out.error || 'Save failed');
    setTaskStatus('summary', 'Saved.', false);
    showModal('#ai-summary-modal', false);
    await refreshStatus();
  } catch (e) {
    setTaskStatus('summary', 'Error: ' + e.message, true);
  }
}

async function saveKeywordsEdit() {
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var editor = qs('#ai-keywords-editor');
  if (!editor) return;

  var text = String(editor.value || '').trim();
  if (!text) {
    setTaskStatus('keywords', 'Error: keywords is empty.', true);
    return;
  }

  setTaskStatus('keywords', 'Saving...', false);
  try {
    var out = await apiJson('/save_keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 20000,
      body: JSON.stringify({
        chapter_id: chapterId,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        keywords_text: text
      })
    });
    if (out && out.ok === false) throw new Error(out.error || 'Save failed');
    setTaskStatus('keywords', 'Saved.', false);
    showModal('#ai-keywords-modal', false);
    await refreshStatus();
  } catch (e) {
    setTaskStatus('keywords', 'Error: ' + e.message, true);
  }
}

function setContentLinks(status) {
  function setLink(id, href) {
    var a = qs(id);
    if (!a) return;
    if (href) {
      a.href = href;
      a.style.display = 'inline';
    } else {
      a.href = '#';
      a.style.display = 'none';
    }
  }

  var wp = status && status.web_paths ? status.web_paths : {};
  setLink('#ai-link-pdf', loomaPdfViewerUrl(wp.pdf));

  var chapterId = qsv('#ai-chapter');
  var ex = status && status.exists ? status.exists : {};
  setLink('#ai-link-summary', ex.summary ? loomaTeacherAidUrl('summary', chapterId) : null);
  setLink('#ai-link-keywords', ex.keywords ? loomaTeacherAidUrl('keywords', chapterId) : null);
}

function setPreview(status) {
  var sum = qs('#ai-preview-summary');
  var kw = qs('#ai-preview-keywords');
  if (!sum || !kw) return;
  var p = status && status.previews ? status.previews : {};
  sum.textContent = (p.summary || '').trim() || '(no summary file)';
  kw.textContent = (p.keywords || '').trim() || '(no keywords file)';
}

async function refreshStatus() {
  var chapterId = qsv('#ai-chapter');
  // "Generate All Missing" only makes sense when a chapter is selected — hide
  // it otherwise, so it can never run against an empty target.
  var generateWrap = qs('.ai-generate-all-wrap');
  if (generateWrap) generateWrap.style.display = chapterId ? '' : 'none';
  var hint = qs('#ai-chapter-status-hint');
  if (!chapterId) {
    if (hint) hint.innerHTML = '<span style="display:flex;gap:6px;align-items:center;"><span style="display:inline-flex;width:18px;height:18px;background:rgba(255,168,0,0.8);border-radius:50%;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:12px;">!</span>Select a chapter.</span>';
    setTaskStatus('status', 'No chapter selected.', false);
    renderCards(null);
    setContentLinks(null);
    setPreview(null);
    updateContentPills(null);
    return;
  }

  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');

  if (hint) hint.textContent = 'Loading status for ' + chapterId + '...';
  setTaskStatus('status', 'Loading status for ' + chapterId + '...', false);
  try {
    var url = '/chapter_status?preview=1'
      + '&chapter_id=' + encodeURIComponent(chapterId)
      + '&grade=' + encodeURIComponent(grade)
      + '&subject=' + encodeURIComponent(subject)
      + '&language=' + encodeURIComponent(language);
    var out = await apiJson(url, { timeoutMs: 7000 });
    if (hint) hint.textContent = 'Status for ' + chapterId;
    setTaskStatus('status', 'Status loaded for ' + chapterId + '.', false);
    renderCards(out);
    setContentLinks(out);
    setPreview(out);
    updateContentPills(out);

    var addBtn = qs('#ai-add-content');
    if (addBtn) {
      var ex = out.exists || {};
      var needs = !(ex.summary && ex.keywords);
      addBtn.textContent = needs ? 'Add Content' : 'Update Content';
    }
  } catch (e) {
    if (hint) hint.textContent = 'Error loading status: ' + e.message;
    setTaskStatus('status', 'Error: ' + e.message, true);
    setActionStatus('', false);
  }
}

function clearSelect(sel, firstLabel) {
  while (sel.firstChild) sel.removeChild(sel.firstChild);
  var opt = document.createElement('option');
  opt.value = '';
  opt.textContent = firstLabel || '(select)';
  sel.appendChild(opt);
}

// English subject is English-only; Nepali subject is Nepali-only. Other
// subjects (math, science, ...) keep the full English/Nepali choice.
function applyLanguageBySubject() {
  var langSel = qs('#ai-language');
  if (!langSel) return false;
  var subj = (qsv('#ai-subject') || '').trim().toLowerCase();
  var force = null;
  if (subj === 'english') force = 'en';
  else if (subj === 'nepali') force = 'np';

  var prev = qsv('#ai-language') || 'en';
  var optsAll = [
    { value: 'en', label: 'English' },
    { value: 'np', label: 'Nepali' }
  ];
  var opts = force ? optsAll.filter(function (o) { return o.value === force; }) : optsAll;

  langSel.innerHTML = '';
  opts.forEach(function (o) {
    var el = document.createElement('option');
    el.value = o.value;
    el.textContent = o.label;
    langSel.appendChild(el);
  });

  var target = force || (opts.some(function (o) { return o.value === prev; }) ? prev : opts[0].value);
  langSel.value = target;
  return target !== prev;
}

function loadSubjects() {
  var grade = qsv('#ai-grade');
  var subjectSel = qs('#ai-subject');
  var chapterSel = qs('#ai-chapter');
  var hint = qs('#ai-filter-hint');
  if (!subjectSel || !chapterSel) return Promise.resolve(false);

  clearSelect(subjectSel, '(select)');
  clearSelect(chapterSel, '(select)');

  if (!grade) {
    if (hint) hint.textContent = 'Pick grade + subject to load chapters.';
    refreshStatus().catch(function () {});
    return Promise.resolve(false);
  }

  if (hint) hint.textContent = 'Loading subjects...';
  // Uses the same API as Looma search/home so the lists match.
  return new Promise(function (resolve) {
    jQuery.post(
      'looma-database-utilities.php',
      { cmd: 'textSubjectList', class: grade },
      function (responseHtml) {
        try {
          subjectSel.insertAdjacentHTML('beforeend', responseHtml);
          if (aiPendingRestoreChapter && aiPendingRestoreChapter.subject) {
            subjectSel.value = aiPendingRestoreChapter.subject;
          }
          if (hint) hint.textContent = 'Select a subject to load chapters.';
          resolve(true);
        } catch (e) {
          if (hint) hint.textContent = 'Error loading subjects.';
          resolve(false);
        }
      },
      'html'
    ).fail(function () {
      if (hint) hint.textContent = 'Error loading subjects.';
      resolve(false);
    });
  });
}

function loadChapters() {
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var chapterSel = qs('#ai-chapter');
  var hint = qs('#ai-filter-hint');
  if (!chapterSel) return Promise.resolve(false);

  clearSelect(chapterSel, '(select)');

  if (!grade || !subject) {
    if (hint) hint.textContent = 'Pick grade + subject to load chapters.';
    refreshStatus().catch(function () {});
    return Promise.resolve(false);
  }

  if (hint) hint.textContent = 'Loading chapters...';
  return new Promise(function (resolve) {
    jQuery.post(
      'looma-database-utilities.php',
      { cmd: 'textChapterList', class: grade, subject: subject, lang: language },
      function (responseHtml) {
        try {
          chapterSel.insertAdjacentHTML('beforeend', responseHtml);
          if (hint) hint.textContent = 'Chapters loaded.';

          // Restore previously selected chapter if available
          if (aiPendingRestoreChapter && aiPendingRestoreChapter.chapter_id) {
            chapterSel.value = aiPendingRestoreChapter.chapter_id;
            aiPendingRestoreChapter = null;
          }
          refreshStatus().catch(function () {});
          resolve(true);
        } catch (e) {
          if (hint) hint.textContent = 'Error loading chapters.';
          refreshStatus().catch(function () {});
          resolve(false);
        }
      },
      'html'
    ).fail(function () {
      if (hint) hint.textContent = 'Error loading chapters.';
      refreshStatus().catch(function () {});
      resolve(false);
    });
  });
}

async function publishResources(opts) {
  opts = opts || {};

  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var overwrite = (typeof opts.overwrite === 'boolean') ? opts.overwrite : !!(qs('#ai-overwrite') && qs('#ai-overwrite').checked);
  var types = Array.isArray(opts.types) ? opts.types : null;

  var typeList = (Array.isArray(types) && types.length) ? types.slice() : ['summary', 'keywords'];
  typeList.forEach(function (t) { setTaskStatus(t, 'Publishing...', false); });
  setActionStatus('Publishing ' + typeList.join(' + ') + '...', false);
  try {
    var out = await apiJson('/publish_resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 60000,
      body: JSON.stringify({
        chapter_id: chapterId,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        overwrite: overwrite,
        types: types
      })
    });
    if (out && out.ok === false) throw new Error(out.error || 'Publish failed');
    var msg = out && out.skipped ? 'Already present (no overwrite).' : 'Published.';
    typeList.forEach(function (t) { setTaskStatus(t, msg, false); });
    setActionStatus(msg, false);
    await refreshStatus();
  } catch (e) {
    typeList.forEach(function (t) { setTaskStatus(t, 'Error: ' + e.message, true); });
    setActionStatus('Publish error: ' + e.message, true);
  }
}

async function generateQuiz(opts) {
  opts = opts || {};
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var overwrite = (typeof opts.overwrite === 'boolean') ? opts.overwrite : !!(qs('#ai-overwrite') && qs('#ai-overwrite').checked);
  var publish = (typeof opts.publish === 'boolean') ? opts.publish : true;
  // append=true tells the server to keep the existing quiz and add N more
  // questions. Used by the "Generate More" button on the AI page.
  var append = !!opts.append;

  var n = 10;
  try { n = Number(qsv('#ai-quiz-questions') || '10'); } catch (_) { n = 10; }

  setTaskStatus('quiz', append ? 'Adding more questions...' : 'Generating...', false);
  setActionStatus(append ? 'Adding more exercises...' : 'Generating exercises (quiz)...', false);
  try {
    var out = await apiJson('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 90000,
      body: JSON.stringify({
        chapter_id: chapterId,
        quiz_questions: n,
        publish: publish,
        append: append,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        overwrite: overwrite,
        types: ['quiz']
      })
    });
    if (!out || out.ok !== true) throw new Error(out && out.error ? out.error : 'Generation failed');
    var label = append
      ? 'More questions added. (' + (out.generated_ids ? out.generated_ids.length : 0) + ' items)'
      : 'Generated. (' + (out.generated_ids ? out.generated_ids.length : 0) + ' items)';
    setTaskStatus('quiz', label, false);
    setActionStatus(label, false);
    await refreshStatus();
  } catch (e) {
    setTaskStatus('quiz', 'Error: ' + e.message, true);
    setActionStatus('Generation error: ' + e.message, true);
  }
}

async function generateVocabPractice(opts) {
  opts = opts || {};
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var overwrite = (typeof opts.overwrite === 'boolean') ? opts.overwrite : !!(qs('#ai-overwrite') && qs('#ai-overwrite').checked);
  var publish = (typeof opts.publish === 'boolean') ? opts.publish : false;

  var n = 10;
  try { n = Number(qsv('#ai-quiz-questions') || '10'); } catch (_) { n = 10; }

  setTaskStatus('vocab', 'Generating...', false);
  setActionStatus('Generating key vocabulary practice...', false);
  try {
    var out = await apiJson('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 90000,
      body: JSON.stringify({
        chapter_id: chapterId,
        quiz_questions: n,
        publish: publish,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        overwrite: overwrite,
        types: ['vocab']
      })
    });
    if (!out || out.ok !== true) throw new Error(out && out.error ? out.error : 'Generation failed');
    setTaskStatus('vocab', 'Generated. (' + (out.generated_ids ? out.generated_ids.length : 0) + ' items)', false);
    setActionStatus('Generated.', false);
    await refreshStatus();
  } catch (e) {
    setTaskStatus('vocab', 'Error: ' + e.message, true);
    setActionStatus('Generation error: ' + e.message, true);
  }
}

async function generateObjectives(opts) {
  opts = opts || {};
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var overwrite = (typeof opts.overwrite === 'boolean') ? opts.overwrite : !!(qs('#ai-overwrite') && qs('#ai-overwrite').checked);
  var publish = (typeof opts.publish === 'boolean') ? opts.publish : true;

  setTaskStatus('objectives', 'Generating...', false);
  setActionStatus('Generating chapter objectives...', false);
  try {
    var out = await apiJson('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 90000,
      body: JSON.stringify({
        chapter_id: chapterId,
        publish: publish,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        overwrite: overwrite,
        types: ['objectives']
      })
    });
    if (!out || out.ok !== true) throw new Error(out && out.error ? out.error : 'Generation failed');
    setTaskStatus('objectives', 'Generated. (' + (out.generated_ids ? out.generated_ids.length : 0) + ' items)', false);
    setActionStatus('Generated.', false);
    await refreshStatus();
  } catch (e) {
    setTaskStatus('objectives', 'Error: ' + e.message, true);
    setActionStatus('Generation error: ' + e.message, true);
  }
}

async function generateLesson(opts) {
  opts = opts || {};
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var overwrite = !!opts.overwrite;

  setTaskStatus('lesson', 'Generating...', false);
  setActionStatus('Generating lesson...', false);
  try {
    var out = await apiJson('/generate_lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 120000,
      body: JSON.stringify({
        chapter_id: chapterId,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        overwrite: overwrite,
        n_slides: 6
      })
    });
    if (!out || out.ok !== true) throw new Error(out && out.error ? out.error : 'Lesson generation failed');
    var msg = 'Generated. ' + (out.slide_count || 0) + ' slides, '
      + (out.video_count || 0) + ' video(s), ' + (out.image_count || 0) + ' image(s).';
    setTaskStatus('lesson', msg, false);
    setActionStatus('Lesson ' + msg.toLowerCase(), false);
    await refreshStatus();
  } catch (e) {
    setTaskStatus('lesson', 'Error: ' + e.message, true);
    setActionStatus('Lesson error: ' + e.message, true);
  }
}

async function generateTeacherGuide(opts) {
  opts = opts || {};
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) return;
  var grade = qsv('#ai-grade');
  var subject = qsv('#ai-subject');
  var language = qsv('#ai-language');

  var overwrite = !!opts.overwrite;

  setTaskStatus('teacher_guide', 'Generating...', false);
  setActionStatus('Generating teacher guide...', false);
  try {
    var out = await apiJson('/generate_teacher_guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 90000,
      body: JSON.stringify({
        chapter_id: chapterId,
        grade: grade ? Number(grade) : null,
        subject: subject || null,
        language: language || 'en',
        overwrite: overwrite
      })
    });
    if (out && out.ok === false) throw new Error(out.error || 'Teacher guide failed');
    var msg = out && out.skipped ? 'Already present (no overwrite).' : 'Generated.';
    setTaskStatus('teacher_guide', msg, false);
    setActionStatus('Teacher guide ' + msg, false);
    await refreshStatus();
  } catch (e) {
    setTaskStatus('teacher_guide', 'Error: ' + e.message, true);
    setActionStatus('Teacher guide error: ' + e.message, true);
  }
}

async function checkHealth() {
  setBaseUi();
  setConnection(true, 'Connecting to AI service... (' + AI_BASE + ')');
  try {
    var j = await apiJson('/health', { timeoutMs: 4000 });
    if (j && j.ok) {
      setConnection(true, 'AI online (' + AI_BASE + ')');
      return true;
    }
    setConnection(false, 'AI responded but is not ready (' + AI_BASE + ')');
    return false;
  } catch (e) {
    setConnection(false, 'AI offline: ' + e.message + ' (' + AI_BASE + ')');
    return false;
  }
}

function updateContentPills(status) {
  var box = qs('#ai-content-pills');
  if (!box) return;
  box.innerHTML = '';
  if (!status) return;

  var exists = status.exists || {};
  var tg = status.teacher_guides ? !!status.teacher_guides.present : false;
  var byFt = (status.activities && status.activities.by_ft) ? status.activities.by_ft : {};
  var lessonCount = Number(byFt.lesson || byFt.lessons || 0);

  var items = [
    { label: 'PDF', ok: !!exists.pdf },
    { label: 'Summary', ok: !!exists.summary },
    { label: 'Keywords', ok: !!exists.keywords },
    { label: 'Quiz', ok: !!exists.quiz },
    { label: 'Vocabulary', ok: !!exists.vocab },
    { label: 'Teacher guide', ok: tg },
    { label: 'Lesson', ok: !!exists.lesson || lessonCount > 0 }
  ];

  items.forEach(function (item) {
    var span = document.createElement('span');
    span.className = 'ai-pill ' + (item.ok ? 'ok' : 'missing');
    span.textContent = item.label;
    box.appendChild(span);
  });
}

async function generateAll() {
  var chapterId = qsv('#ai-chapter');
  if (!chapterId) {
    setActionStatus('Select a chapter first.', true);
    return;
  }
  setActionStatus('Generating all missing content…', false);
  await publishResources({ types: ['summary', 'keywords'], overwrite: false });
  await generateObjectives({ overwrite: false, publish: true });
  await generateQuiz({ overwrite: false, publish: true });
  await generateVocabPractice({ overwrite: false, publish: false });
  await generateTeacherGuide({ overwrite: false });
  await generateLesson({ overwrite: false });
  setActionStatus('Generate all: done.', false);
}

function clearChat() {
  var box = qs('#ai-rag-chat');
  if (!box) return;
  box.innerHTML = '';
  aiLastRagPayload = null;
  aiLastRagMessageEl = null;
  aiChatHistory = [];
  setRagStatus('', false);
  showWelcomeMessage();
}

function showWelcomeMessage() {
  var box = qs('#ai-rag-chat');
  if (!box) return;
  var msg = ragAppendMessage('bot', '', { meta: 'LOOMA' });
  if (msg && msg.body) {
    msg.body.innerHTML = renderMarkdownLite(
      'Hello! I am LOOMA, your virtual school assistant.\n'
      + 'I know all the content in this platform — chapters, lessons, key concepts and more.\n'
      + 'Ask me anything about the curriculum, or use the quick actions below to get started.'
    );
  }
}

// Open the chapter-bound exercise/vocab page from the AI panel.
//
//  - "quiz"  : publishes a fresh quiz with the current N (so the Resources
//    button + the player both have the same deterministic copy) and then
//    navigates to looma-play-exercise.php.
//  - "vocab" : skips publishing entirely. Goes straight to the legacy
//    "Key Vocabulary" game (looma-game.php?type=keywords) — the same
//    destination the Resources page uses, so the AI shortcut behaves
//    identically to clicking the button on the chapter Resources folder.
function openAIPage(type, chapterId) {
  if (!chapterId) return;
  var grade    = qsv('#ai-grade');
  var subject  = qsv('#ai-subject');
  var language = qsv('#ai-language');
  var n = 8;
  try { n = Number(qsv('#ai-quiz-questions') || '8'); } catch (_) { n = 8; }
  if (!isFinite(n) || n < 3) n = 3;
  if (n > 50) n = 50;

  if (type !== 'quiz') {
    // Mirror the Resources page link exactly:
    //   looma-game.php?type=keywords&class=Class<n>&subject=<s>&ch_id=<id>
    var vUrl = 'looma-game.php?type=keywords' +
      '&class='   + encodeURIComponent('Class ' + (grade || '')) +
      '&subject=' + encodeURIComponent(subject || '') +
      '&ch_id='   + encodeURIComponent(chapterId);
    window.location = vUrl;
    return;
  }

  // Quiz path — publish first (overwrite=true so the published copy reflects
  // the current N), then redirect.
  setActionStatus('Preparing exercises...', false);
  fetch(AI_BASE + '/publish_resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chapter_id: chapterId,
      grade: grade ? Number(grade) : null,
      subject: subject || null,
      language: language || null,
      quiz_questions: n,
      overwrite: true,
      types: ['quiz'],
    }),
  })
    .then(function (r) { return r.text(); })
    .catch(function () { return ''; })
    .then(function () {
      var url = 'looma-play-exercise.php' +
        '?ch_id='    + encodeURIComponent(chapterId) +
        '&grade='    + encodeURIComponent(grade || '') +
        '&subject='  + encodeURIComponent(subject || '') +
        '&language=' + encodeURIComponent(language || '') +
        '&n='        + encodeURIComponent(n);
      window.location = url;
    });
}

function showInlinePreview(type, chapterId) {
  if (!chapterId) return;
  var modal = qs('#ai-preview-modal');
  var title = qs('#ai-preview-modal-title');
  var content = qs('#ai-preview-modal-content');
  if (!modal || !content) return;

  // Pass the full chapter context so /quiz_html and /vocab_html can fall back
  // to on-demand generation from the chapter PDF when nothing has been
  // pre-published yet. Without grade+subject+language the server can't locate
  // the PDF and the iframe stays empty.
  var grade    = qsv('#ai-grade');
  var subject  = qsv('#ai-subject');
  var language = qsv('#ai-language');

  var endpoint = (type === 'quiz') ? '/quiz_html' : '/vocab_html';
  var qs_parts = ['chapter_id=' + encodeURIComponent(chapterId)];
  if (grade)    qs_parts.push('grade='    + encodeURIComponent(grade));
  if (subject)  qs_parts.push('subject='  + encodeURIComponent(subject));
  if (language) qs_parts.push('language=' + encodeURIComponent(language));
  var url = AI_BASE + endpoint + '?' + qs_parts.join('&');

  if (title) title.textContent = (type === 'quiz') ? 'Quiz Preview' : 'Vocabulary Practice Preview';

  // Cross-origin iframes break with `sandbox=allow-same-origin` because the
  // browser refuses the response when CORS doesn't quite match. Plain iframe
  // tag works fine since the AI service sets `frame-ancestors *`.
  var safeUrl = escHtml(url);
  content.innerHTML =
    '<div style="margin-bottom:8px;">'
    + '<a href="' + safeUrl + '" target="_blank" rel="noopener" class="black-border" '
    + 'style="display:inline-block;padding:6px 12px;background:#091f48;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;">'
    + 'Open in new tab</a>'
    + ' <span class="muted" style="margin-left:8px;font-size:12px;">'
    + 'Loads the live page directly from the AI service.</span>'
    + ' <span id="ai-preview-status" class="muted" style="margin-left:8px;font-size:12px;color:#888;">'
    + 'Loading…</span>'
    + '</div>'
    + '<iframe id="ai-preview-iframe" src="' + safeUrl + '" '
    + 'style="width:100%;height:68vh;border:1px solid rgba(0,0,0,0.15);border-radius:8px;background:#fff;display:block;" '
    + 'referrerpolicy="no-referrer-when-downgrade" '
    + 'loading="eager"></iframe>';
  showModal('#ai-preview-modal', true);

  // Quick diagnostic: fetch the same URL and report HTTP status / first error.
  // The iframe doesn't expose load errors cross-origin, so this helps the
  // user understand whether the AI service is reachable at all.
  try {
    var statusEl = qs('#ai-preview-status');
    fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (statusEl) {
          if (r.ok) statusEl.textContent = 'Loaded (HTTP ' + r.status + ').';
          else      statusEl.textContent = 'AI service replied HTTP ' + r.status + '.';
        }
      })
      .catch(function (e) {
        if (statusEl) statusEl.textContent = 'Cannot reach AI service: ' + (e && e.message ? e.message : 'network error') + '.';
      });
  } catch (_) {}
}

function init() {
  window.__LOOMA_AI_UI_INIT = true;

  checkHealth().catch(function () {});
  setPageTitleByLanguage();

  var gradeSel = qs('#ai-grade');
  var subjectSel = qs('#ai-subject');
  var langSel = qs('#ai-language');
  var chapterSel = qs('#ai-chapter');

  if (gradeSel) gradeSel.addEventListener('change', function () {
    saveChapterSelectionState();
    loadSubjects();
  });

  if (subjectSel) subjectSel.addEventListener('change', function () {
    saveChapterSelectionState();
    applyLanguageBySubject();
    setPageTitleByLanguage();
    loadChapters();
  });

  if (langSel) langSel.addEventListener('change', function () {
    saveChapterSelectionState();
    setPageTitleByLanguage();
    loadChapters();
  });

  if (chapterSel) chapterSel.addEventListener('change', function () {
    saveChapterSelectionState();
    refreshStatus().catch(function () {});
  });

  var ragBtn = qs('#ai-rag-run');
  if (ragBtn) ragBtn.addEventListener('click', function (e) {
    e.preventDefault();
    runRag().catch(function () {});
  });

  var ragQ = qs('#ai-rag-question');
  if (ragQ) ragQ.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runRag().catch(function () {});
    }
  });

  var refreshBtn = qs('#ai-refresh');
  if (refreshBtn) refreshBtn.addEventListener('click', function () {
    loadSubjects();
    applyLanguageBySubject();
    loadChapters();
    refreshStatus().catch(function () {});
  });

  var sumCancel = qs('#ai-summary-cancel');
  if (sumCancel) sumCancel.addEventListener('click', function () { showModal('#ai-summary-modal', false); });
  var sumCancelX = qs('#ai-summary-cancel-x');
  if (sumCancelX) sumCancelX.addEventListener('click', function () { showModal('#ai-summary-modal', false); });
  var sumSave = qs('#ai-summary-save');
  if (sumSave) sumSave.addEventListener('click', function () { saveSummaryEdit(); });

  var kwCancel = qs('#ai-keywords-cancel');
  if (kwCancel) kwCancel.addEventListener('click', function () { showModal('#ai-keywords-modal', false); });
  var kwCancelX = qs('#ai-keywords-cancel-x');
  if (kwCancelX) kwCancelX.addEventListener('click', function () { showModal('#ai-keywords-modal', false); });
  var kwSave = qs('#ai-keywords-save');
  if (kwSave) kwSave.addEventListener('click', function () { saveKeywordsEdit(); });

  var pdfFile = qs('#ai-pdf-file');
  if (pdfFile) pdfFile.addEventListener('change', function () {
    if (!pdfFile.files || !pdfFile.files[0]) return;
    replaceChapterPdf().catch(function () {});
  });

  var generateAllBtn = qs('#ai-generate-all');
  if (generateAllBtn) generateAllBtn.addEventListener('click', function () {
    generateAll().catch(function () {});
  });

  var ragClearBtn = qs('#ai-rag-clear');
  if (ragClearBtn) ragClearBtn.addEventListener('click', function () { clearChat(); });

  // Quick-action chips
  var chipsEl = qs('#ai-quick-chips');
  if (chipsEl) {
    chipsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.ai-quick-chip');
      if (!btn) return;
      var q = btn.getAttribute('data-q') || btn.textContent.trim();
      var ragQ = qs('#ai-rag-question');
      if (ragQ) ragQ.value = q;
      runRag().catch(function () {});
    });
  }

  var previewClose = qs('#ai-preview-modal-close');
  if (previewClose) previewClose.addEventListener('click', function () {
    showModal('#ai-preview-modal', false);
    var content = qs('#ai-preview-modal-content');
    if (content) content.innerHTML = '';
  });

  var delCancel = qs('#ai-delete-cancel');
  if (delCancel) delCancel.addEventListener('click', function () {
    aiDeletePending = null;
    showModal('#ai-delete-modal', false);
  });
  var delCancelX = qs('#ai-delete-cancel-x');
  if (delCancelX) delCancelX.addEventListener('click', function () {
    aiDeletePending = null;
    showModal('#ai-delete-modal', false);
  });
  var delConfirm = qs('#ai-delete-confirm');
  if (delConfirm) delConfirm.addEventListener('click', function () {
    confirmDeleteNow().catch(function () {});
  });

  // Restore filters only when returning via browser Back/Forward. A fresh
  // visit through the AI page button should start with empty filters.
  var shouldRestore = isBackForwardNavigation();
  if (shouldRestore) restoreChapterSelectionState();

  loadSubjects().then(function () {
    if (shouldRestore && qsv('#ai-subject')) {
      applyLanguageBySubject();
      setPageTitleByLanguage();
      return loadChapters();
    }
    refreshStatus().catch(function () {});
    return false;
  });

  showWelcomeMessage();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.addEventListener('pageshow', function (e) {
  if (e.persisted && qsv('#ai-chapter')) {
    refreshStatus().catch(function () {});
  }
});
