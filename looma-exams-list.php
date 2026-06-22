<?php
/*
 * looma-exams-list.php
 *
 * Lists previously generated AI exams for a given grade + subject. Reads the
 * exam metadata from the looma-ai service's /list_exams endpoint (which scans
 * the shared /content/exams/ folder). Each entry is a button that opens the
 * saved exam HTML via looma-play-exam.php?file=<basename>.
 *
 * Query params:
 *   grade     — class number (digit, e.g. "5") — optional but recommended
 *   subject   — subject slug (e.g. "math")     — optional but recommended
 *   language  — "en" or "np"                   — defaults to "en"
 */

$page_title = 'Exams';
require_once 'includes/header.php';
require_once 'includes/looma-utilities.php';

looma_trace_page('exams-list', [
    'grade'    => $_GET['grade']    ?? null,
    'subject'  => $_GET['subject']  ?? null,
    'language' => $_GET['language'] ?? null,
]);

$grade    = isset($_GET['grade'])    ? trim($_GET['grade'])    : '';
$subject  = isset($_GET['subject'])  ? trim($_GET['subject'])  : '';
$prefix   = isset($_GET['prefix'])   ? trim($_GET['prefix'])   : '';
$language = isset($_GET['language']) ? trim($_GET['language']) : 'en';
if (!in_array($language, ['en', 'np'], true)) $language = 'en';

// Build the JSON payload of saved exams server-side so the page renders
// immediately and works even if the user's network blocks port 8089 from
// the browser. We talk to looma-ai over the internal docker network.
$ai_base = rtrim(getenv('LOOMA_AI_URL') ?: 'http://looma-ai:8089', '/');
$ai_qs = http_build_query(array_filter([
    'grade'    => $grade,
    'subject'  => $subject,
    'prefix'   => $prefix,
    'language' => $language,
], static function ($v) { return $v !== ''; }));
$exam_url = $ai_base . '/list_exams' . ($ai_qs ? ('?' . $ai_qs) : '');

// "Generate Exam" calls looma-play-exam.php with the same scope params plus
// a fresh seed so each click yields a different question pool. The exam is
// then saved to /content/exams/ and shows up in the list below on the next
// reload.
$gen_qs = http_build_query(array_filter([
    'grade'    => $grade,
    'subject'  => $subject,
    'prefix'   => $prefix,
    'language' => $language,
], static function ($v) { return $v !== ''; }));

$exams = [];
$ai_error = '';
try {
    $ctx = stream_context_create(['http' => ['timeout' => 5]]);
    $raw = @file_get_contents($exam_url, false, $ctx);
    if ($raw === false) {
        $ai_error = 'Could not reach looma-ai at ' . $exam_url;
    } else {
        $decoded = json_decode($raw, true);
        if (is_array($decoded) && isset($decoded['exams']) && is_array($decoded['exams'])) {
            $exams = $decoded['exams'];
        } elseif (is_array($decoded) && isset($decoded['error'])) {
            $ai_error = (string) $decoded['error'];
        }
    }
} catch (Throwable $e) {
    $ai_error = $e->getMessage();
}
?>
<link rel="stylesheet" href="css/looma-chapters.css">
<style>
  .exams-wrap { padding: 20px; }
  .exams-heading { margin: 0 0 14px 0; }
  .exam-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
               gap: 12px; padding: 0; list-style: none; }
  .exam-item a { display: block; padding: 14px 16px; border: 2px solid #091F48;
                 border-radius: 12px; background: #fff; color: #091F48;
                 text-decoration: none; font-weight: 600; transition: background-color .12s ease; }
  .exam-item a:hover { background: #fff8d4; }
  .exam-item .when     { font-weight: 700; font-size: 0.95rem; }
  .exam-item .meta-row { font-size: 0.82rem; opacity: 0.75; margin-top: 4px; }
  .exam-empty { color: #555; font-style: italic; padding: 8px 0; }
  .exam-error { color: #b00020; font-size: 0.9rem; padding: 6px 0; }
  .exam-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 14px; margin: 0 0 18px 0; flex-wrap: wrap; }
  .exam-toolbar .generate-exam-btn {
      padding: 10px 18px; background: var(--looma-toolbar); color: var(--looma-blue); border: none;
      border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer;
      transition: background-color .12s ease, transform .05s ease;
  }
  .exam-toolbar .generate-exam-btn:hover  { background: #fff26a; color: var(--looma-blue); }
  .exam-toolbar .generate-exam-btn:active { transform: translateY(1px); }
</style>
</head>
<body>

<div class="exams-wrap">
  <h1 class="title exams-heading">
    <?php echo keyword('Exams'); ?>
    <?php if ($grade   !== '') echo ' — ' . keyword('Grade') . ' ' . htmlspecialchars($grade,   ENT_QUOTES); ?>
    <?php if ($subject !== '') echo ' ' .   keyword(ucfirst($subject)); ?>
  </h1>

  <div class="exam-toolbar">
    <button id="generate-exam-btn"
            type="button"
            class="generate-exam-btn"
            data-exam-url="looma-play-exam.php?<?php echo htmlspecialchars($gen_qs, ENT_QUOTES); ?>"
            onclick="(function(b){
                var s = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
                window.location = b.dataset.examUrl + '&seed=' + encodeURIComponent(s);
            })(this);">
      <?php echo $language === 'np' ? 'परीक्षा सिर्जना गर्नुहोस्' : 'Generate Exam'; ?>
    </button>
  </div>

  <?php if ($ai_error): ?>
    <p class="exam-error"><?php echo htmlspecialchars($ai_error, ENT_QUOTES); ?></p>
  <?php endif; ?>

  <?php if (empty($exams)): ?>
    <p class="exam-empty">
      <?php echo $language === 'np'
            ? 'अहिलेसम्म कुनै पनि परीक्षा सिर्जना भएको छैन। माथिको "Generate Exam" क्लिक गर्नुहोस्।'
            : 'No exams have been generated yet. Click "Generate Exam" above to create one.'; ?>
    </p>
  <?php else: ?>
    <ul class="exam-list">
      <?php $exam_num = 1; foreach ($exams as $exam):
          $file       = isset($exam['file'])       ? (string) $exam['file']       : '';
          $created_at = isset($exam['created_at']) ? (string) $exam['created_at'] : '';
          $g_meta     = isset($exam['grade'])      ? (string) $exam['grade']      : '';
          $s_meta     = isset($exam['subject'])    ? (string) $exam['subject']    : '';
          $l_meta     = isset($exam['language'])   ? (string) $exam['language']   : 'en';
          $qcount     = isset($exam['questions']) ? (int)    $exam['questions']  : 0;
          // Skip rows without a usable filename (defensive).
          if ($file === '' || !preg_match('/^[A-Za-z0-9._-]+\.html$/', $file)) continue;

          // Human-readable timestamp from the ISO string.
          $when_label = $created_at;
          try {
              $dt = new DateTime($created_at);
              $when_label = $dt->format('Y-m-d H:i');
          } catch (Throwable $e) { /* fall back to the raw string */ }

          $href_qs = http_build_query(array_filter([
              'file'     => $file,
              'grade'    => $g_meta,
              'subject'  => $s_meta,
              'language' => $l_meta,
          ], static function ($v) { return $v !== ''; }));
      ?>
        <li class="exam-item">
          <a href="looma-play-exam.php?<?php echo htmlspecialchars($href_qs, ENT_QUOTES); ?>">
            <span class="when"><?php echo 'Exam Example ' . $exam_num; ?></span>
            <div class="meta-row">
              <?php
                $bits = [];
                if ($when_label !== '') $bits[] = htmlspecialchars($when_label, ENT_QUOTES);
                if ($g_meta !== '') $bits[] = 'Grade ' . htmlspecialchars($g_meta, ENT_QUOTES);
                if ($s_meta !== '') $bits[] = htmlspecialchars(ucfirst($s_meta), ENT_QUOTES);
                if ($qcount > 0)    $bits[] = $qcount . ' questions';
                echo implode(' · ', $bits);
              ?>
            </div>
          </a>
        </li>
      <?php $exam_num++; endforeach; ?>
    </ul>
  <?php endif; ?>
</div>

<?php include 'includes/toolbar.php'; ?>
<?php include 'includes/js-includes.php'; ?>
</body>
</html>
