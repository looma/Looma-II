<!doctype html>
<?php
$page_title = "Looma AI Tooling";
require_once('includes/header.php');
require_once('includes/looma-utilities.php');

logPageHit('ai');
looma_trace_page('ai');
?>
<link rel="stylesheet" href="css/looma-ai.css">
</head>

<body>
<div id="main-container-horizontal" class="scroll">

  <h1 id="ai-page-title" class="title">Looma AI Tooling</h1>

  <div id="ai-status" class="panel">
    <div class="row" style="justify-content:space-between;gap:10px;">
      <span id="ai-connection">Connecting to AI service...</span>
      <span class="muted" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <a id="ai-open-health" href="#" target="_blank" rel="noopener" style="color:#d4a300;text-decoration:underline;font-weight:600;">Check /health</a>
      </span>
    </div>
  </div>

  <div class="panel">
    <h2>Filters</h2>
    <div class="row">
      <label>Grade
        <select id="ai-grade" class="black-border">
          <option value="">(select)</option>
          <?php for($i=1;$i<=12;$i++) echo "<option value=\"$i\">$i</option>\n"; ?>
        </select>
      </label>

      <label>Subject
        <select id="ai-subject" class="black-border">
          <option value="">(select)</option>
        </select>
      </label>

      <label>Language
        <select id="ai-language" class="black-border">
          <option value="en">English</option>
          <option value="np">Nepali</option>
        </select>
      </label>

      <label>Chapter
        <select id="ai-chapter" class="black-border" style="min-width: 520px">
          <option value="">(select)</option>
        </select>
      </label>

      <button id="ai-refresh" class="black-border">Clear</button>
    </div>
    <div class="row">
      <span id="ai-filter-hint" class="muted">Pick grade + subject to load chapters.</span>
    </div>
  </div>

  <div class="panel">
    <h2>Chapter content</h2>
    <div class="row" style="justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
      <span id="ai-chapter-status-hint" class="muted">Select a chapter.</span>
      <span class="muted" style="display:none;">
        <a id="ai-link-pdf" href="#" target="_blank" rel="noopener" style="display:none;"></a>
        <a id="ai-link-summary" href="#" target="_blank" rel="noopener" style="display:none;"></a>
        <a id="ai-link-keywords" href="#" target="_blank" rel="noopener" style="display:none;"></a>
      </span>
    </div>
    <input id="ai-pdf-file" type="file" accept="application/pdf" style="display:none">
    <div class="row" style="justify-content:flex-end;gap:10px;align-items:center;flex-wrap:wrap;">
      <span id="ai-pdf-status" class="muted"></span>
    </div>
    <div id="ai-status-cards" class="results"></div>
    <div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px;border-top:1px solid rgba(0,0,0,0.08);padding-top:12px;">
      <label class="muted" style="gap:8px;">
        Quiz questions:
        <input id="ai-quiz-questions" type="number" value="10" min="3" max="50" class="black-border" style="width: 80px">
      </label>
      <!-- Hidden by default; revealed by looma-ai.js refreshStatus() only when
           a chapter is selected, so it cannot run without a target chapter. -->
      <div class="ai-generate-all-wrap" style="display:none;">
        <button id="ai-generate-all" class="black-border ai-btn-generate-all" type="button">Generate All Missing</button>
      </div>
    </div>
    <div class="row" style="width:100%;margin-top:8px;">
      <span id="ai-action-status" class="muted"></span>
    </div>
    <details style="width:100%;margin-top:6px;">
      <summary class="muted" style="cursor:pointer;font-size:0.9rem;user-select:none;">Task log</summary>
      <pre id="ai-action-log" class="ai-debug-log" style="width:100%;margin:4px 0 0 0;box-sizing:border-box;"></pre>
    </details>
  </div>

  <div class="panel">
    <h2>Generated content</h2>
    <div class="row" style="margin-bottom:4px;">
      <span class="muted">Generated files are written into the chapter folder and appear on the Home page.</span>
    </div>
    <div id="ai-content-pills" class="row" style="gap:8px;flex-wrap:wrap;min-height:28px;margin-bottom:8px;"></div>
    <div class="row" style="gap:18px;align-items:flex-start;">
      <div style="flex:1;min-width:280px;">
        <h3 style="margin:0 0 6px 0;">Summary</h3>
        <pre id="ai-preview-summary" class="ai-preview"></pre>
      </div>
      <div style="flex:1;min-width:280px;">
        <h3 style="margin:0 0 6px 0;">Keywords</h3>
        <pre id="ai-preview-keywords" class="ai-preview"></pre>
      </div>
    </div>
  </div>



</div>

<!-- Summary editor modal -->
<div id="ai-summary-modal" class="ai-modal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="ai-summary-modal-title">
  <div class="ai-modal-card">
    <div class="ai-modal-header">
      <h3 id="ai-summary-modal-title" style="margin:0;">Edit Summary</h3>
      <button id="ai-summary-cancel-x" type="button" class="black-border">Close</button>
    </div>
    <div style="padding:4px 0;">
      <textarea id="ai-summary-editor" class="black-border" style="width:100%;min-height:220px;resize:vertical;box-sizing:border-box;"></textarea>
      <div class="muted" style="margin-top:6px;">Write a clear, human-friendly paragraph explaining what the chapter teaches.</div>
    </div>
    <div class="ai-modal-footer">
      <button id="ai-summary-cancel" type="button" class="black-border">Cancel</button>
      <button id="ai-summary-save" type="button" class="black-border">Save</button>
    </div>
  </div>
</div>

<!-- Keywords editor modal -->
<div id="ai-keywords-modal" class="ai-modal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="ai-keywords-modal-title">
  <div class="ai-modal-card">
    <div class="ai-modal-header">
      <h3 id="ai-keywords-modal-title" style="margin:0;">Edit Keywords</h3>
      <button id="ai-keywords-cancel-x" type="button" class="black-border">Close</button>
    </div>
    <div style="padding:4px 0;">
      <textarea id="ai-keywords-editor" class="black-border" style="width:100%;min-height:220px;resize:vertical;box-sizing:border-box;"></textarea>
      <div class="muted" style="margin-top:6px;">One keyword/phrase per line (or paste text and adjust as needed).</div>
    </div>
    <div class="ai-modal-footer">
      <button id="ai-keywords-cancel" type="button" class="black-border">Cancel</button>
      <button id="ai-keywords-save" type="button" class="black-border">Save</button>
    </div>
  </div>
</div>

<!-- Inline content preview modal (quiz / vocab) -->
<div id="ai-preview-modal" class="ai-modal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="ai-preview-modal-title">
  <div class="ai-modal-card" style="width:min(1100px,96vw);">
    <div class="ai-modal-header">
      <h3 id="ai-preview-modal-title" style="margin:0;">Preview</h3>
      <button id="ai-preview-modal-close" type="button" class="black-border">Close</button>
    </div>
    <div style="padding-top:8px;">
      <div id="ai-preview-modal-content"></div>
    </div>
  </div>
</div>

<!-- PDF editor modal (annotate / redact / strikethrough / add text) -->
<div id="ai-pdf-editor-modal" class="ai-modal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="ai-pdf-editor-title">
  <div class="ai-modal-card" style="width:min(1200px,98vw); max-height:96vh; display:flex; flex-direction:column;">
    <div class="ai-modal-header">
      <h3 id="ai-pdf-editor-title" style="margin:0;">Edit PDF</h3>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <span id="ai-pdf-editor-info" class="muted" style="font-size:0.9rem;"></span>
        <button id="ai-pdf-editor-close" type="button" class="black-border">Close</button>
      </div>
    </div>
    <div id="ai-pdf-editor-toolbar" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.08);">
      <strong style="margin-right:6px;">Tool:</strong>
      <button type="button" class="ai-pdf-tool black-border" data-tool="select"      title="Click annotations to delete">Select</button>
      <button type="button" class="ai-pdf-tool black-border" data-tool="text"        title="Add a text box">+ Text</button>
      <button type="button" class="ai-pdf-tool black-border" data-tool="redact"      title="Cover an area with a white box">Redact</button>
      <button type="button" class="ai-pdf-tool black-border" data-tool="highlight"   title="Yellow highlight">Highlight</button>
      <button type="button" class="ai-pdf-tool black-border" data-tool="strike"      title="Strikethrough line">Strike</button>
      <span style="display:inline-flex; gap:6px; align-items:center; margin-left:14px;">
        <label style="gap:4px;">Color
          <input id="ai-pdf-color" type="color" value="#1a73e8" class="black-border" style="width:42px; height:30px; padding:0;">
        </label>
        <label style="gap:4px;">Size
          <input id="ai-pdf-size" type="number" min="6" max="72" value="14" class="black-border" style="width:60px;">
        </label>
      </span>
      <span style="display:inline-flex; gap:6px; align-items:center; margin-left:14px;">
        <button id="ai-pdf-prev" type="button" class="black-border">Prev</button>
        <span id="ai-pdf-page-info" class="muted">Page 0 / 0</span>
        <button id="ai-pdf-next" type="button" class="black-border">Next</button>
      </span>
      <span style="margin-left:auto; display:inline-flex; gap:6px;">
        <button id="ai-pdf-undo"  type="button" class="black-border">Undo</button>
        <button id="ai-pdf-clear" type="button" class="black-border">Clear page</button>
        <button id="ai-pdf-save"  type="button" class="black-border" style="font-weight:700;">Save PDF</button>
      </span>
    </div>
    <div id="ai-pdf-editor-status" class="muted" style="padding:6px 0; min-height:18px; font-size:0.9rem;"></div>
    <div id="ai-pdf-editor-stage"
         style="position:relative; flex:1 1 auto; overflow:auto; background:#3a3a3a; padding:18px; box-sizing:border-box;">
      <div id="ai-pdf-page-wrap" style="position:relative; margin:0 auto; box-shadow:0 6px 20px rgba(0,0,0,0.4); background:#fff;">
        <canvas id="ai-pdf-canvas" style="display:block;"></canvas>
        <div id="ai-pdf-overlay"
             style="position:absolute; left:0; top:0; right:0; bottom:0; cursor:crosshair;"></div>
      </div>
    </div>
  </div>
</div>

<!-- Delete confirmation modal -->
<div id="ai-delete-modal" class="ai-modal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="ai-delete-modal-title">
  <div class="ai-modal-card" style="width:min(720px,96vw);">
    <div class="ai-modal-header">
      <h3 id="ai-delete-modal-title" style="margin:0;">Delete file</h3>
      <button id="ai-delete-cancel-x" type="button" class="black-border">Close</button>
    </div>
    <div style="padding:4px 0;">
      <div id="ai-delete-modal-body" style="line-height:1.35;"></div>
      <div class="muted" style="margin-top:8px;">This action permanently removes the file from the chapter folder.</div>
    </div>
    <div class="ai-modal-footer">
      <button id="ai-delete-cancel" type="button" class="black-border">Cancel</button>
      <button id="ai-delete-confirm" type="button" class="black-border">Delete</button>
    </div>
  </div>
</div>

<?php include('includes/toolbar.php');
include('includes/js-includes.php'); ?>

<script>
  window.addEventListener('error', function (e) {
    try {
      var el = document.getElementById('ai-connection');
      if (el && e && e.message) {
        el.textContent = 'JS error: ' + e.message;
        el.style.color = '#c33';
      }
    } catch (_) {}
  });
</script>

<!-- PDF editor deps: PDF.js (render) + pdf-lib (re-encode edits). Both are
     local copies so the editor works in offline classrooms. -->
<script src="js/pdfjs/pdf.min.js"></script>
<script src="js/pdf-lib.min.js"></script>
<script src="js/looma-ai.js?v=<?php echo @filemtime('js/looma-ai.js') ?: time(); ?>"></script>
<script src="js/looma-ai-pdf-editor.js?v=<?php echo @filemtime('js/looma-ai-pdf-editor.js') ?: time(); ?>"></script>
</body>
