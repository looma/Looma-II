<!doctype html>
<!--
Filename: looma-health-topic.php
Description: First Aid TOPIC page. One template for every topic. Emergency/Learn toggle
             (defaults to Emergency). Emergency = scrollable steps + Never block + Get-care.
             Learn = stepped cards (Next/Back, keyboard arrows) ending in a short quiz.
             Content from MongoDB 'firstaid' collection; get-care numbers from the single
             'firstaid-config' document. Part of the temporary "Health" tab.
Owner: VillageTech Solutions (villagetechsolutions.org)
-->
<?php $page_title = 'Looma First Aid — Topic';
    include ('includes/header.php');   // pulls in mongo-connect + logPageHit
    logPageHit('health');

    if (!function_exists('bilingualFA')) {
        function bilingualFA($en, $np) {
            $en = (string) $en;
            $np = ($np === null || $np === '') ? $en : (string) $np;
            return "<span class='english'>" . htmlspecialchars($en) . "</span>"
                 . "<span class='native'>"  . htmlspecialchars($np) . "</span>";
        }
    }
    // Illustration slot. If $key is given and images/health/<key>.<ext> exists, show
    // that image; otherwise fall back to the caption placeholder (PRD §8). This lets
    // AI-generated art be dropped in per step/card without touching the DB.
    function faIllus($desc, $key = '') {
        $key = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)$key));
        if ($key !== '') {
            foreach (array('png', 'webp', 'jpg', 'jpeg') as $ext) {
                $rel = "images/health/$key.$ext";
                if (is_file(__DIR__ . '/' . $rel)) {
                    $src = htmlspecialchars($rel . '?v=' . @filemtime(__DIR__ . '/' . $rel));
                    return "<div class='fa-illus-slot fa-illus-photo'>"
                         . "<img src='$src' alt='' loading='lazy'></div>";
                }
            }
        }
        $desc = htmlspecialchars((string)$desc);
        return "<div class='fa-illus-slot'>"
             . "<span class='fa-illus-desc'>$desc</span></div>";
    }

    // split a sentence into (first sentence, remainder) on the earliest '. ' or Nepali '। '
    function faSplit($s) {
        $s = trim((string)$s); $best = -1; $len = 0;
        foreach (array('। ', '. ') as $sep) {
            $p = mb_strpos($s, $sep);
            if ($p !== false && ($best === -1 || $p < $best)) { $best = $p; $len = mb_strlen($sep); }
        }
        if ($best === -1) return array($s, '');
        return array(trim(mb_substr($s, 0, $best + $len)), trim(mb_substr($s, $best + $len)));
    }
    // bold first sentence + muted supporting clause, per language
    function faAction($en, $np) {
        $np = ($np === null || $np === '') ? $en : $np;
        list($e1, $e2) = faSplit($en);
        list($n1, $n2) = faSplit($np);
        $one = function ($lang, $a, $b) {
            $h = "<span class='$lang'><strong>" . htmlspecialchars($a) . "</strong>";
            if ($b !== '') $h .= " <span class='fa-step-sub'>" . htmlspecialchars($b) . "</span>";
            return $h . "</span>";
        };
        return $one('english', $e1, $e2) . $one('native', $n1, $n2);
    }

    // small inline SVG icons (decorative -> aria-hidden). Inherit color via currentColor.
    function faIcon($name) {
        $o = "<svg class='fa-ic' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>";
        switch ($name) {
            case 'alert':    $p = "<path d='M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>"; break;
            case 'book':     $p = "<path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/>"; break;
            case 'ban':      $p = "<circle cx='12' cy='12' r='9'/><line x1='5.6' y1='5.6' x2='18.4' y2='18.4'/>"; break;
            case 'hospital': $p = "<rect x='3' y='3' width='18' height='18' rx='2'/><line x1='12' y1='8' x2='12' y2='16'/><line x1='8' y1='12' x2='16' y2='12'/>"; break;
            case 'phone':    $p = "<path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z'/>"; break;
            case 'help':     $p = "<circle cx='12' cy='12' r='10'/><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/><line x1='12' y1='17' x2='12.01' y2='17'/>"; break;
            case 'bulb':     $p = "<line x1='9' y1='18' x2='15' y2='18'/><line x1='10' y1='22' x2='14' y2='22'/><path d='M12 2a7 7 0 0 0-4 12.7c.5.4.8 1 .9 1.6l.1.7h6l.1-.7c.1-.6.4-1.2.9-1.6A7 7 0 0 0 12 2z'/>"; break;
            default:         $p = "";
        }
        return $o . $p . "</svg>";
    }
?>
    <link href='css/looma-health.css?v=<?php echo @filemtime(__DIR__.'/css/looma-health.css'); ?>' rel='stylesheet' type='text/css'>
    <style>
      /* Practice (branching game) view + its toggle segment */
      .fa-toggle-game[aria-selected="true"] { background:#1c8a3b; }   /* green active — Practice */
      .fa-game-frame { width:100%; height:78vh; border:none; border-radius:18px; background:transparent; display:block; }
    </style>
</head>

<body>
<div id="main-container-horizontal" class="scroll fa-page">
<?php
    global $firstaid_collection;
    $id  = isset($_REQUEST['id']) ? $_REQUEST['id'] : '';
    $doc = $id ? mongoFindOne($firstaid_collection, array('id' => $id, 'ft' => 'firstaid')) : null;
    $cfg = mongoFindOne($firstaid_collection, array('id' => 'firstaid-config'));

    if (!$doc) {
        echo "<p class='fa-empty'>Topic not found. <a href='looma-health.php'>Return to First Aid</a>.</p>";
        echo "</div>";
        include ('includes/toolbar.php');
        include ('includes/js-includes.php');
        echo "</body></html>";
        exit;
    }

    // topics that have a branching-scenario game get a "Practice" view next to Emergency/Learn.
    // Each id here must have a matching scenario key in js/looma-branching-sample.js (BRANCHING_SAMPLES).
    $branchingTopics = array(
        'snakebite', 'severe-bleeding', 'burns', 'choking', 'drowning', 'fractures',
        'head-injury', 'spinal-injury', 'road-traffic-injury', 'poisoning', 'heatstroke', 'hypothermia'
    );
    $hasGame    = in_array($id, $branchingTopics, true);
    $gameSample = $id;   // branching sample key matches the topic id
?>
    <h1 class="fa-topic-title"><?php echo bilingualFA($doc['title_en'], $doc['title_np']); ?></h1>

    <!-- Emergency / Learn segmented toggle (defaults to Emergency) -->
    <div class="fa-toggle" role="tablist" aria-label="View mode">
        <button class="fa-toggle-em" role="tab" aria-selected="true"  data-view="emergency">
            <?php echo faIcon('alert'); ?><span class="english">Emergency</span><span class="native">आपतकालीन</span>
        </button>
        <button class="fa-toggle-learn" role="tab" aria-selected="false" data-view="learn">
            <?php echo faIcon('book'); ?><span class="english">Learn</span><span class="native">सिक्नुहोस्</span>
        </button>
<?php if ($hasGame) { ?>
        <button class="fa-toggle-game" role="tab" aria-selected="false" data-view="game">
            <?php echo faIcon('help'); ?><span class="english">Practice</span><span class="native">अभ्यास</span>
        </button>
<?php } ?>
    </div>

    <!-- ===================== EMERGENCY VIEW ===================== -->
    <section id="fa-view-emergency" class="fa-view fa-view-active" role="tabpanel">
        <h2 class="fa-emergency-heading"><?php echo bilingualFA(
            isset($doc['emergency_heading_en']) ? $doc['emergency_heading_en'] : 'What to do now',
            isset($doc['emergency_heading_np']) ? $doc['emergency_heading_np'] : 'अहिले के गर्ने'); ?></h2>

        <ol class="fa-steps">
<?php $sIdx = 0; foreach (($doc['emergency'] ?? array()) as $step) { $sIdx++;
      $hasImg = isset($step['illustration']) && $step['illustration'] !== ''; ?>
            <li class="fa-step">
                <div class="fa-step-num" aria-hidden="true"></div>
                <div class="fa-step-body">
                    <p class="fa-step-action"><?php echo faAction(
                        isset($step['action_en']) ? $step['action_en'] : '',
                        isset($step['action_np']) ? $step['action_np'] : ''); ?></p>
<?php if ($hasImg) { ?>
                    <button type="button" class="fa-step-expand" aria-expanded="false" aria-controls="fa-step-detail-<?php echo $sIdx; ?>">
                        <span class="english">Show picture</span><span class="native">तस्बिर हेर्नुहोस्</span>
                    </button>
                    <div class="fa-step-detail" id="fa-step-detail-<?php echo $sIdx; ?>" hidden>
                        <?php echo faIllus($step['illustration'], "$id-emergency-$sIdx"); ?>
                    </div>
<?php } ?>
                </div>
            </li>
<?php } ?>
        </ol>

        <!-- calm support panels (two-column, collapses on narrow) -->
        <div class="fa-support-row">
<?php if (!empty($doc['never'])) { ?>
            <div class="fa-never">
                <div class="fa-never-title"><?php echo faIcon('ban'); ?>
                    <span class="english">Never do these</span><span class="native">यी कहिल्यै नगर्नुहोस्</span>
                </div>
                <ul>
<?php foreach ($doc['never'] as $n) { ?>
                    <li><?php echo bilingualFA(
                        isset($n['text_en']) ? $n['text_en'] : '',
                        isset($n['text_np']) ? $n['text_np'] : ''); ?></li>
<?php } ?>
                </ul>
            </div>
<?php } ?>

            <div class="fa-getcare">
                <div class="fa-getcare-title"><?php echo faIcon('hospital'); ?>
                    <span class="english">Get care</span><span class="native">उपचार खोज्नुहोस्</span>
                </div>
                <p class="fa-getcare-primary"><?php echo bilingualFA(
                    isset($cfg['get_care_message_en']) ? $cfg['get_care_message_en'] : 'Get to a hospital as fast as possible. This matters most.',
                    isset($cfg['get_care_message_np']) ? $cfg['get_care_message_np'] : ''); ?></p>
<?php
    // $cfg['numbers'] is a Mongo BSONArray (not a PHP array) — build a real indexed array so array_slice works
    $numbers = array();
    if (isset($cfg['numbers'])) foreach ($cfg['numbers'] as $nn) $numbers[] = $nn;
    $telPill = function ($num) {
        $tel = preg_replace('/[^0-9+]/', '', isset($num['number']) ? $num['number'] : '');
        $numtxt = htmlspecialchars(isset($num['number']) ? $num['number'] : '');
        $aria = 'Call ' . (isset($num['label_en']) ? $num['label_en'] : '') . ' ' . $numtxt;
        return "<a class='fa-call-pill' href='tel:" . htmlspecialchars($tel) . "' aria-label='" . htmlspecialchars($aria) . "'>"
             . faIcon('phone')
             . "<span class='fa-call-label'>" . bilingualFA(isset($num['label_en']) ? $num['label_en'] : '', isset($num['label_np']) ? $num['label_np'] : '') . "</span>"
             . "<span class='fa-call-num'>" . $numtxt . "</span></a>";
    };
?>
                <div class="fa-call-pills">
<?php foreach (array_slice($numbers, 0, 2) as $num) echo $telPill($num); ?>
                </div>
<?php $rest = array_slice($numbers, 2); if (count($rest)) { ?>
                <details class="fa-more-contacts">
                    <summary><span class="english">More contacts</span><span class="native">थप सम्पर्क</span></summary>
                    <div class="fa-call-pills fa-call-pills-more">
<?php foreach ($rest as $num) echo $telPill($num); ?>
                    </div>
                </details>
<?php } ?>
            </div>
        </div><!-- /fa-support-row -->
    </section>

    <!-- ===================== LEARN VIEW ===================== -->
    <section id="fa-view-learn" class="fa-view" role="tabpanel">
        <div class="fa-learn-stage">
            <div class="fa-lp">
                <div class="fa-lp-top">
                    <span class="fa-lp-count" id="fa-lp-count" aria-live="polite"></span>
                    <span class="fa-lp-title" id="fa-lp-title"></span>
                </div>
                <div class="fa-lp-track" id="fa-lp-track" aria-hidden="true"></div>
            </div>

<?php
    $learn = $doc['learn'] ?? array();
    $total = count($learn) + (!empty($doc['quiz']) ? 1 : 0);
    $i = 0;
    foreach ($learn as $card) { ?>
            <div class="fa-learn-card" data-learn-index="<?php echo $i; ?>" <?php echo $i === 0 ? '' : 'hidden'; ?>>
                <h2 class="fa-learn-action"><?php echo bilingualFA(
                    isset($card['action_en']) ? $card['action_en'] : '',
                    isset($card['action_np']) ? $card['action_np'] : ''); ?></h2>
                <?php echo faIllus(isset($card['illustration']) ? $card['illustration'] : '', "$id-learn-" . ($i + 1)); ?>
                <div class="fa-why">
                    <div class="fa-why-label"><span class="english">Why it matters</span><span class="native">किन महत्त्वपूर्ण</span></div>
                    <p class="fa-why-text"><?php echo bilingualFA(
                        isset($card['why_en']) ? $card['why_en'] : '',
                        isset($card['why_np']) ? $card['why_np'] : ''); ?></p>
                </div>
                <div class="fa-remember">
                    <?php echo faIcon('bulb'); ?>
                    <p class="fa-remember-text"><strong><span class="english">Remember:</span><span class="native">सम्झनुहोस्:</span></strong>
                        <?php echo bilingualFA(
                        isset($card['tip_en']) ? $card['tip_en'] : '',
                        isset($card['tip_np']) ? $card['tip_np'] : ''); ?></p>
                </div>
            </div>
<?php $i++; } ?>

<?php if (!empty($doc['quiz'])) { $qCount = count($doc['quiz']); ?>
            <div class="fa-learn-card fa-quiz-card" data-learn-index="<?php echo $i; ?>" hidden>
                <h2 class="fa-learn-action"><span class="english">Quick check</span><span class="native">छिटो जाँच</span></h2>
                <div class="fa-quiz-progress" id="fa-quiz-progress" aria-live="polite"></div>
<?php $q = 0; foreach ($doc['quiz'] as $quiz) { ?>
                <div class="fa-quiz-q-block" data-quiz-index="<?php echo $q; ?>" <?php echo $q === 0 ? '' : 'hidden'; ?>>
                    <p class="fa-quiz-q"><?php echo bilingualFA(
                        isset($quiz['question_en']) ? $quiz['question_en'] : '',
                        isset($quiz['question_np']) ? $quiz['question_np'] : ''); ?></p>
                    <div class="fa-quiz-options">
<?php foreach (($quiz['options'] ?? array()) as $opt) { ?>
                        <button class="fa-quiz-option" data-correct="<?php echo !empty($opt['isCorrect']) ? '1' : '0'; ?>">
                            <?php echo bilingualFA(
                                isset($opt['text_en']) ? $opt['text_en'] : '',
                                isset($opt['text_np']) ? $opt['text_np'] : ''); ?>
                        </button>
<?php } ?>
                    </div>
                    <div class="fa-quiz-feedback"><?php echo bilingualFA(
                        isset($quiz['feedback_en']) ? $quiz['feedback_en'] : '',
                        isset($quiz['feedback_np']) ? $quiz['feedback_np'] : ''); ?></div>
                    <div class="fa-quiz-nav">
<?php if ($q > 0) { ?>
                        <button class="fa-nav-btn fa-nav-secondary fa-quiz-back" type="button">
                            <span class="english">&larr; Back</span><span class="native">&larr; पछाडि</span>
                        </button>
<?php } else { ?>
                        <span></span>
<?php } ?>
                        <button class="fa-nav-btn fa-quiz-next" hidden>
<?php if ($q === $qCount - 1) { ?>
                            <span class="english">Done</span><span class="native">सम्पन्न</span>
<?php } else { ?>
                            <span class="english">Next question &rarr;</span><span class="native">अर्को प्रश्न &rarr;</span>
<?php } ?>
                        </button>
                    </div>
                </div>
<?php $q++; } ?>
                <div class="fa-quiz-done" hidden>
                    <div class="fa-done-check" aria-hidden="true">&#10003;</div>
                    <p class="fa-done-msg"><span class="english">Nice work — you've reviewed the key steps for this topic.</span><span class="native">राम्रो काम — तपाईंले यस विषयका मुख्य चरणहरू हेर्नुभयो।</span></p>
                    <button class="fa-nav-btn fa-done-review" type="button"><span class="english">See the quick steps</span><span class="native">छिटो चरणहरू हेर्नुहोस्</span></button>
                </div>
            </div>
<?php } ?>

            <div class="fa-learn-nav">
                <button class="fa-nav-btn" id="fa-learn-back" disabled>
                    <span class="english">&larr; Back</span><span class="native">&larr; पछाडि</span>
                </button>
                <button class="fa-nav-btn" id="fa-learn-next">
                    <span class="english">Next &rarr;</span><span class="native">अर्को &rarr;</span>
                </button>
            </div>
        </div>
    </section>

<?php if ($hasGame) { ?>
    <!-- ===================== PRACTICE (branching game) VIEW ===================== -->
    <section id="fa-view-game" class="fa-view" role="tabpanel">
        <iframe id="fa-game-frame" class="fa-game-frame" title="Practice scenario" scrolling="no"
                data-src="looma-game.php?type=branching&sample=<?php echo urlencode($gameSample); ?>&embed=1"></iframe>
    </section>
<?php } ?>

</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-health-topic.js?v=<?php echo @filemtime(__DIR__.'/js/looma-health-topic.js'); ?>"></script>
</body>
</html>
