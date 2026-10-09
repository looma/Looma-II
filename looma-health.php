<!doctype html>
<!--
Filename: looma-health.php
Description: First Aid module HOME — a grid of topic cards. Tapping a card opens
             looma-health-topic.php, where each topic has Emergency / Learn / (Practice) views.
             Content comes from the MongoDB 'firstaid' collection (seeded by looma-firstaid-seed.php).
             Part of the temporary "Health" tab.
Owner: VillageTech Solutions (villagetechsolutions.org)
-->
<?php $page_title = 'Looma First Aid';
    include ('includes/header.php');   // pulls in mongo-connect ($firstaid_collection) + logPageHit
    logPageHit('health');

    // Bilingual content span: shows either .english or .native based on the language cookie,
    // toggled by the toolbar flag via LOOMA.translate(). Falls back to English when Nepali is empty.
    if (!function_exists('bilingualFA')) {
        function bilingualFA($en, $np) {
            $en = (string) $en;
            $np = ($np === null || $np === '') ? $en : (string) $np;
            return "<span class='english'>" . htmlspecialchars($en) . "</span>"
                 . "<span class='native'>"  . htmlspecialchars($np) . "</span>";
        }
    }

    // If an illustration file exists for this topic id (images/health/<id>.<ext>),
    // return its web path; otherwise ''. Lets us drop in AI-generated art per topic
    // without touching the DB — the caption text stays as the fallback until then.
    if (!function_exists('faTopicImg')) {
        function faTopicImg($id) {
            $id = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)$id));
            if ($id === '') return '';
            foreach (array('png', 'webp', 'jpg', 'jpeg') as $ext) {
                $rel = "images/health/$id.$ext";
                if (is_file(__DIR__ . '/' . $rel)) {
                    return $rel . '?v=' . @filemtime(__DIR__ . '/' . $rel);
                }
            }
            return '';
        }
    }
?>
    <link href='css/looma-health.css?v=<?php echo @filemtime(__DIR__.'/css/looma-health.css'); ?>' rel='stylesheet' type='text/css'>
</head>

<body>
<div id="main-container-horizontal" class="scroll fa-page">

    <h1 class="fa-title"><?php echo bilingualFA('First Aid', 'प्राथमिक उपचार'); ?></h1>
    <p class="fa-subtitle"><?php echo bilingualFA('Topics', 'विषयहरू'); ?></p>

    <div class="fa-grid">
<?php
    global $firstaid_collection;
    $topics = iterator_to_array(
        mongoFind($firstaid_collection, array('ft' => 'firstaid'), 'order', null, null), false);

    if (count($topics) === 0) {
        echo "<p class='fa-empty'>No first-aid topics loaded yet. An admin can load them from "
           . "<a href='looma-firstaid-seed.php'>looma-firstaid-seed.php</a>.</p>";
    } else {
        foreach ($topics as $t) {
            $id    = isset($t['id']) ? $t['id'] : '';
            $en    = isset($t['title_en']) ? $t['title_en'] : $id;
            $np    = isset($t['title_np']) ? $t['title_np'] : '';
            $illus = isset($t['illustration']) ? $t['illustration'] : '';
            ?>
            <?php $img = faTopicImg($id); ?>
            <a class="fa-card" href="looma-health-topic.php?id=<?php echo urlencode($id); ?>">
                <?php if ($img !== '') { ?>
                <div class="fa-card-illus fa-card-photo">
                    <img src="<?php echo htmlspecialchars($img); ?>" alt="<?php echo htmlspecialchars($en); ?>" loading="lazy">
                </div>
                <?php } else { ?>
                <div class="fa-card-illus fa-illus-slot">
                    <span class="fa-illus-desc"><?php echo htmlspecialchars($illus); ?></span>
                </div>
                <?php } ?>
                <div class="fa-card-title"><?php echo bilingualFA($en, $np); ?></div>
            </a>
            <?php
        }
    }
?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-health.js?v=<?php echo @filemtime(__DIR__.'/js/looma-health.js'); ?>"></script>
</body>
</html>
