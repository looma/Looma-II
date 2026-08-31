<?php
require_once('includes/looma-isloggedin.php');

// Admin-only, like the First Aid seed loader. Adds one "link card" per First Aid topic
// into the 'activities' collection, tagged to the grade-8 "Disease, Safety and First Aid"
// chapter (8H04). Each card is an ft='looma' activity whose url opens the matching topic
// page (looma-health-topic.php?id=<topic>) with its Emergency / Learn / Practice views.
//
// Idempotent: upserts keyed on the stable `falink` field ("8H04:<topic>"), so re-running
// refreshes in place without creating duplicates. Fully offline.
//
// NOTE: relies on two small fixes shipped alongside this file:
//   - looma-activities.php  (looma case passes $url into the data-url slot)
//   - js/looma-utilities.js (looma click handler no longer encodeURIComponent's the URL)

$loggedin = loggedIn();
$level = isset($_COOKIE['login-level']) ? $_COOKIE['login-level'] : null;
if (!$loggedin) { header('Location: looma-login.php'); exit; }
if ($level !== 'admin' && $level !== 'exec') { header('Location: looma-home.php'); exit; }

$page_title = 'Looma First Aid — Link Cards Seeder';
include ('includes/header.php');   // pulls in mongo-connect ($activities_collection)
?>
    <link rel="stylesheet" href="css/looma-health.css?v=<?php echo @filemtime(__DIR__.'/css/looma-health.css'); ?>">
</head>
<body>
<div id="main-container-horizontal" class="scroll" style="padding:3vh 3vw;">
    <h1 class="title">First Aid — Link Cards Seeder</h1>
<?php
global $activities_collection;

// Which chapter(s) to attach the cards to: the first-aid chapter in each grade.
// Grades 6-8 use "H04" (Disease, Safety and First Aid); grade 5 differs — its
// first-aid chapter is 5H05 "Safety and First Aid" (5H04 is a different topic).
$CHAPTERS = array('5H05', '6H04', '7H04', '8H04');

// The 12 First Aid topics (id + bilingual title), mirroring firstaid-seed.json.
$TOPICS = array(
    array('snakebite',           'Snakebite',            'सर्पदंश'),
    array('severe-bleeding',     'Severe bleeding',      'गम्भीर रक्तस्राव'),
    array('burns',               'Burns and scalds',     'पोलाइ र डढाइ'),
    array('choking',             'Choking',              'घाँटीमा अड्किनु'),
    array('drowning',            'Drowning',             'डुब्नु'),
    array('fractures',           'Fractures and falls',  'हड्डी भाँचिनु र लड्नु'),
    array('head-injury',         'Head injury',          'टाउकोको चोट'),
    array('spinal-injury',       'Neck and back injury', 'घाँटी र ढाडको चोट'),
    array('road-traffic-injury', 'Road traffic injury',  'सडक दुर्घटनाको चोट'),
    array('poisoning',           'Poisoning',            'विषाक्तता'),
    array('heatstroke',          'Heatstroke',           'लू लाग्नु'),
    array('hypothermia',         'Hypothermia',          'हाइपोथर्मिया'),
);

// Optional custom thumbnail; falls back to the Looma logo if the file is missing.
$thumb = is_file(__DIR__ . '/images/health.svg') ? 'images/health.svg' : '';

$count = 0;
echo "<ul>";
foreach ($CHAPTERS as $chapter) {
    foreach ($TOPICS as $t) {
        list($id, $en, $np) = $t;
        $falink = $chapter . ':' . $id;              // stable idempotency key
        $doc = array(
            'ft'     => 'looma',
            'dn'     => 'First Aid: ' . $en,
            'ndn'    => 'प्राथमिक उपचार: ' . $np,
            'url'    => 'looma-health-topic.php?id=' . $id . '&view=learn',
            'ch_id'  => array($chapter),
            'lang'   => 'both',   // bilingual card; also avoids the test-level lang filter in looma-activities.php
            'key1'   => 'Science',
            'key2'   => 'Medicine',
            'key3'   => 'Disease & Injury',
            'key4'   => 'First Aid',
            'falink' => $falink,
        );
        if ($thumb !== '') $doc['thumb'] = $thumb;

        mongoUpsert($activities_collection, array('falink' => $falink), $doc);
        echo "<li>Upserted <strong>" . htmlspecialchars($doc['dn']) . "</strong> &rarr; "
           . "<code>" . htmlspecialchars($doc['url']) . "</code> on <code>"
           . htmlspecialchars($chapter) . "</code></li>";
        $count++;
    }
}
echo "</ul>";
echo "<p>Done. Upserted <strong>$count</strong> link card(s) into the <code>activities</code> collection.</p>";
echo "<p>Open the grade-8 <em>Disease, Safety and First Aid</em> chapter (8H04) to see them. "
   . "To remove them later: <code>db.activities.deleteMany({falink:{\$regex:'^8H04:'}})</code>.</p>";
?>
</div>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
</body>
</html>
