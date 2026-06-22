<?php
/*
 * looma-play-exam.php
 *
 * Renders an AI-generated exam (all chapters of a grade+subject) as a
 * fullscreen iframe.
 *
 * Two modes:
 *   • LIVE generation — pass grade+subject+prefix (+optional seed/per_chapter)
 *     and the iframe loads /generate_exam on the looma-ai service. Each click
 *     should pass a fresh `seed` so a new exam is built every time. The result
 *     is also persisted to /looma/content/exams/ so it can be revisited later.
 *   • SAVED exam — pass `file=<basename>.html` to load a previously generated
 *     exam from /content/exams/. This is what the Exams section of Resources
 *     hands to this page.
 */

$page_title = 'Exam';
require_once 'includes/header.php';
looma_trace_page('exam', [
    'grade'    => $_GET['grade']    ?? null,
    'subject'  => $_GET['subject']  ?? null,
    'prefix'   => $_GET['prefix']   ?? null,
    'language' => $_GET['language'] ?? null,
    'seed'     => $_GET['seed']     ?? null,
    'file'     => $_GET['file']     ?? null,
]);

$grade    = isset($_GET['grade'])    ? trim($_GET['grade'])    : '';
$subject  = isset($_GET['subject'])  ? trim($_GET['subject'])  : '';
$prefix   = isset($_GET['prefix'])   ? trim($_GET['prefix'])   : '';
$language = isset($_GET['language']) ? trim($_GET['language']) : 'en';
$seed     = isset($_GET['seed'])     ? trim($_GET['seed'])     : '';

// SAVED-exam mode — load the HTML file straight from /content/exams/.
// Reject anything other than a simple basename to avoid path traversal.
$saved_file = '';
if (isset($_GET['file'])) {
    $candidate = trim($_GET['file']);
    if (preg_match('/^[A-Za-z0-9._-]+\.html$/', $candidate)) {
        $saved_file = $candidate;
    }
}

if ($saved_file === '' && $prefix === '' && ($grade === '' || $subject === '')) {
    http_response_code(400);
    echo "<h1>Missing prefix or grade+subject</h1>";
    exit;
}

$qs = http_build_query(array_filter([
    'grade'       => $grade,
    'subject'     => $subject,
    'prefix'      => $prefix,
    'language'    => $language,
    'per_chapter' => isset($_GET['per_chapter']) ? trim($_GET['per_chapter']) : '3',
    'seed'        => $seed,
], static function ($v) { return $v !== ''; }));
?>
<style>
  #main-container-vertical {
    background: #162A51;
    overflow: hidden;
  }
  #fullscreen {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  #exam-frame {
    border: 0;
    display: block;
    height: 100%;
    width: 100%;
    background: #fff;
  }
  #exam-loading {
    position: fixed;
    inset: 0;
    background: #162A51;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: opacity 0.25s ease;
  }
  #exam-loading.hidden {
    opacity: 0;
    pointer-events: none;
  }
  #exam-loading img.logo {
    width: 220px;
    max-width: 60vw;
    height: auto;
    margin-bottom: 32px;
    user-select: none;
    -webkit-user-drag: none;
  }
  #exam-loading .exam-loading-spinner {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 0.42em solid rgba(255, 255, 0, 0.3);
    border-top-color: rgba(255, 212, 0, 1);
    border-right-color: rgba(255, 212, 0, 0.85);
    box-sizing: border-box;
    animation: examLoadingSpin 0.8s linear infinite;
  }
  @keyframes examLoadingSpin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#162A51;">

<div id="exam-loading" role="status" aria-label="Loading exam">
  <img class="logo" src="images/LoomaLogo.png" alt="Looma">
  <div class="exam-loading-spinner" aria-hidden="true"></div>
</div>

<div id="main-container-vertical">
  <div id="fullscreen">
    <iframe id="exam-frame"
            src=""
            scrolling="auto"
            title="Final Exam"></iframe>
  </div>
</div>

<script>
(function () {
  var aiBase     = (window.LOOMAAI_BASE) || (window.location.protocol + '//' + window.location.hostname + ':8089');
  var qs         = <?php echo json_encode($qs, JSON_UNESCAPED_SLASHES); ?>;
  var savedFile  = <?php echo json_encode($saved_file, JSON_UNESCAPED_SLASHES); ?>;
  var frame      = document.getElementById('exam-frame');
  var overlay    = document.getElementById('exam-loading');

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    // Remove from the layer once the fade-out finishes so it cannot
    // intercept clicks on the exam content beneath it.
    setTimeout(function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 350);
  }

  // Iframe `load` fires once the exam HTML has been received and parsed —
  // that is the moment the exam is ready to read.
  frame.addEventListener('load', hideOverlay);

  if (savedFile) {
    // Saved-exam mode: open the previously generated HTML straight from
    // the shared /content/exams/ folder. No /generate_exam round-trip.
    frame.src = 'content/exams/' + encodeURIComponent(savedFile);
  } else {
    // Live-generation mode: ask looma-ai to build a fresh exam now.
    frame.src = aiBase + '/generate_exam?' + (qs || '');
  }
})();
</script>

<?php include 'includes/toolbar-vertical.php'; ?>
<?php include 'includes/js-includes.php'; ?>
</body>
</html>
