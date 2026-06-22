<?php
/*
 * looma-play-exercise.php
 *
 * AI exercise player — one question at a time, four answer options, score is
 * revealed only at the end. Quiz data is fetched from looma-ai's /quiz_data.
 * Layout follows the standard Looma page chrome (header + toolbar + fullscreen)
 * so navigation and font match the rest of the project.
 *
 * Query params: ch_id (required) | mongoID | grade | subject | language | n
 */

$page_title = 'AI Exercises';
require_once 'includes/header.php';
require_once 'includes/looma-utilities.php';
looma_trace_page('exercise', [
    'ch_id'    => $_GET['ch_id']    ?? null,
    'mongoID'  => $_GET['mongoID']  ?? null,
    'grade'    => $_GET['grade']    ?? null,
    'subject'  => $_GET['subject']  ?? null,
    'language' => $_GET['language'] ?? null,
]);

$ch_id    = isset($_GET['ch_id'])    ? trim($_GET['ch_id'])    : '';
$mongoID  = isset($_GET['mongoID'])  ? trim($_GET['mongoID'])  : '';
$grade    = isset($_GET['grade'])    ? trim($_GET['grade'])    : '';
$subject  = isset($_GET['subject'])  ? trim($_GET['subject'])  : '';
$language = isset($_GET['language']) ? trim($_GET['language']) : '';
$n_qs     = isset($_GET['n'])        ? trim($_GET['n'])        : '';

if ($ch_id === '' && $mongoID !== '' && preg_match('/^gen_quiz[_-]([A-Za-z0-9.]+?)(?:[_-]v\d.*)?$/', $mongoID, $m)) {
    $ch_id = $m[1];
}

if ($ch_id === '') {
    http_response_code(400);
    echo '<h1>Missing chapter id</h1>';
    exit;
}
?>
<link rel="stylesheet" href="css/looma-play-exercise.css">
</head>
<body>
<div id="main-container-horizontal" class="scroll">
    <h1 class="title"><?php keyword('AI Exercises'); ?></h1>
    <div id="fullscreen">
        <?php include 'includes/looma-control-buttons.php'; ?>

        <div id="exercise-host"
             data-chapter-id="<?php echo htmlspecialchars($ch_id, ENT_QUOTES); ?>"
             data-grade="<?php echo htmlspecialchars($grade, ENT_QUOTES); ?>"
             data-subject="<?php echo htmlspecialchars($subject, ENT_QUOTES); ?>"
             data-language="<?php echo htmlspecialchars($language, ENT_QUOTES); ?>"
             data-n="<?php echo htmlspecialchars($n_qs, ENT_QUOTES); ?>">

            <div id="ex-loading" class="ex-card">
                <p><?php keyword('Loading exercise...'); ?></p>
            </div>

            <section id="ex-question-card" class="ex-card" style="display:none;">
                <div id="ex-progress" class="ex-progress"></div>
                <div id="ex-source-tag" class="ex-source-tag" style="display:none;"></div>
                <div id="ex-q-prompt" class="ex-prompt"></div>
                <div id="ex-q-options" class="ex-options"></div>
                <div class="ex-controls">
                    <span id="ex-validation" class="ex-validation"></span>
                    <button id="ex-next" type="button" class="ex-primary"><?php keyword('Next'); ?></button>
                </div>
            </section>

            <section id="ex-result-card" class="ex-card" style="display:none;">
                <h2 class="ex-result-title"><?php keyword('Your result'); ?></h2>
                <div id="ex-result-score" class="ex-score"></div>
                <div id="ex-result-detail" class="ex-detail"></div>
                <div id="ex-result-recos" class="ex-recos"></div>
                <div class="ex-controls" style="justify-content:center;gap:12px;">
                    <button id="ex-retry"          type="button" class="ex-secondary"><?php keyword('Try again'); ?></button>
                    <button id="ex-back-resources" type="button" class="ex-secondary"><?php keyword('Back to Resources'); ?></button>
                </div>
            </section>

            <section id="ex-empty-card" class="ex-card" style="display:none;">
                <h2><?php keyword('No exercise available'); ?></h2>
                <p><?php keyword('This chapter has no published exercises yet, and no content was found to generate them on demand.'); ?></p>
                <p><?php keyword('Open the AI page, select this chapter, and click Generate.'); ?></p>
            </section>
        </div>
    </div>
</div>

<?php include 'includes/toolbar.php'; ?>
<?php include 'includes/js-includes.php'; ?>
<script src="js/looma-play-exercise.js?v=<?php echo @filemtime('js/looma-play-exercise.js') ?: time(); ?>"></script>
</body>
</html>
