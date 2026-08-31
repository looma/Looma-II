<?php
require_once('includes/looma-isloggedin.php');

// admin-only, like the History editor. Loads firstaid-seed.json into the
// 'firstaid' MongoDB collection. Idempotent: upserts keyed on `id`, so running
// it again refreshes the seed without creating duplicates. Fully offline.
$loggedin = loggedIn();
$level = isset($_COOKIE['login-level']) ? $_COOKIE['login-level'] : null;
if (!$loggedin) { header('Location: looma-login.php'); exit; }
if ($level !== 'admin' && $level !== 'exec') { header('Location: looma-home.php'); exit; }

$page_title = 'Looma First Aid — Seed Loader';
include ('includes/header.php');   // pulls in mongo-connect ($firstaid_collection)
?>
    <link rel="stylesheet" href="css/looma-health.css?v=<?php echo @filemtime(__DIR__.'/css/looma-health.css'); ?>">
</head>
<body>
<div id="main-container-horizontal" class="scroll" style="padding:3vh 3vw;">
    <h1 class="title">First Aid — Seed Loader</h1>
<?php
global $firstaid_collection;

$raw = @file_get_contents(__DIR__ . '/firstaid-seed.json');
if ($raw === false) {
    echo "<p style='color:#c00'>Could not read firstaid-seed.json.</p>";
} else {
    $data = json_decode($raw, true);
    if ($data === null) {
        echo "<p style='color:#c00'>firstaid-seed.json is not valid JSON.</p>";
    } else {
        $docs = array();
        if (isset($data['config'])) $docs[] = $data['config'];
        if (isset($data['topics']) && is_array($data['topics']))
            $docs = array_merge($docs, $data['topics']);

        $count = 0;
        echo "<ul>";
        foreach ($docs as $doc) {
            $id = isset($doc['id']) ? $doc['id'] : null;
            if (!$id) continue;
            // upsert keyed on the stable `id` field so re-running refreshes in place
            mongoUpsert($firstaid_collection, array('id' => $id), $doc);
            echo "<li>Loaded <strong>" . htmlspecialchars($id) . "</strong> ("
                 . htmlspecialchars(isset($doc['ft']) ? $doc['ft'] : '?') . ")</li>";
            $count++;
        }
        echo "</ul>";
        echo "<p>Done. Upserted <strong>$count</strong> document(s) into the <code>firstaid</code> collection.</p>";
        echo "<p><a href='looma-health.php'>Go to the Health page &rarr;</a></p>";
    }
}
?>
</div>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
</body>
</html>
