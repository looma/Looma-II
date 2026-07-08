<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10, 2019 02
Revision: Looma 4.0.0
File: looma-wiki.php
Description:  displays a list of activity buttons of wikipedia articles matching keywords of a chapter
-->


<?php $page_title = 'Looma Wikipedia';
require_once ('includes/header.php');

require_once('includes/looma-utilities.php');
?>
</head>

<body>

<?php

$shown = array();
$foundActivity;

function prepareButton($activity) {
    //depending on the filetype of the activity, display the appropriate button
    global $buttons, $maxButtons, $ch_id, $foundActivity, $shown, $lang ;

    $id = $activity['_id'];

    if ( ! in_array($id, $shown)) {  //check if this Activity has already been shown
        array_push($shown,$id);

        $ft = $activity['ft'];

        // skip types not shown on wiki page
        if ($ft === 'text' || $ft === 'VOC' || $ft === 'LP') return;

        // build the button descriptor array
        $b = array(
            'ft'       => $ft,
            'fp'       => isset($activity['fp']) ? $activity['fp'] : null,
            'fn'       => ($ft === 'evi' && isset($activity['fn'])) ? $activity['fn'] . ".mp4" : (isset($activity['fn']) ? $activity['fn'] : null),
            'dn'       => isset($activity['dn']) ? $activity['dn'] : null,
            'ndn'      => isset($activity['ndn']) ? $activity['ndn'] : null,
            'ch_id'    => $ch_id,
            'prefix'   => isset($activity['prefix']) ? $activity['prefix'] : null,
            'url'      => isset($activity['url']) ? $activity['url'] : null,
            'grade'    => isset($activity['grade']) ? $activity['grade'] : null,
        );

        // thumbnail
        if (isset($activity['thumb'])) $b['thumb'] = $activity['thumb'];

        // mongo_id for types that need it
        $mongoID = isset($activity['mongoID']) ? $activity['mongoID'] : null;
        if ($ft === 'slideshow' || $ft === 'evi')
            $b['mongo_id'] = $mongoID ? mongoId($mongoID) : null;
        else if ($ft === 'lesson' || $ft === 'game')
            $b['mongo_id'] = $mongoID;

        // PDF-specific
        if ($ft === 'pdf') {
            $b['pg'] = 1;
            $b['zoom'] = 'auto';
        }

        // epaath
        if ($ft === 'EP' || $ft === 'epaath') {
            $oleID = isset($activity['oleID']) ? $activity['oleID'] : null;
            $b['ole_id']    = $oleID;
            $b['epversion'] = isset($activity['version']) ? $activity['version'] : null;
            if ($oleID && substr($oleID, 0, 3) === 'nep') $b['lang'] = 'np';
        }

        // looma page: fp is the url
        if ($ft === 'looma') {
            $b['fp'] = isset($activity['url']) ? $activity['url'] : null;
            $b['fn'] = null;
        }

        // lesson: fixed thumbnail
        if ($ft === 'lesson') {
            $b['thumb'] = 'images/lesson.png';
        }

        echo "<td>";
        makeButton($b);
        echo "</td>";
        $foundActivity = true;
        $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";}
    }
} //end prepareButton()

/*
 * NOTE: should validate these parameters, esp. using "isset"
 */
$grade = trim($_GET['grade']);
$gradenumber = str_replace("class", "", $grade);
$subject = trim($_GET['subject']) ;
$lang = trim($_GET['lang']) ;
$ch_id = trim($_GET['ch']);
$ch_dn = trim($_GET['chdn']);

$key1 = trim($_GET['key1']);
$key2 = trim($_GET['key2']);
$key3 = trim($_GET['key3']);
$key4 = trim($_GET['key4']);


echo "<div id='main-container-horizontal' class='scroll'>";

echo "<br>";

if ($subject === "social studies") $caps = "Social Studies"; else $caps = ucfirst($subject);
$grade = str_replace("class", "Grade ", $grade);
echo "<h2 class='title'>";
echo keyword('Wikipedia Articles');
echo " for " . ucfirst($grade) . " " . $caps . ": \"" . $ch_dn . "\"</h2>";

echo "<div>";

$maxButtons = 3;
$foundActivity = false;

echo "<br><table><tr>";
$buttons = 1;


//create a vocab review button if there are any words from this chapter in the dictionary
$query = array('key1' => $key1, 'src' => 'wikipedia');
//$words = $dictionary_collection -> find($query);
$words = mongoFindOne($activities_collection, $query, null, null, null);

//$activities = $activities_collection -> find($query);
$activities = mongoFind($activities_collection, $query, null, null, null);
if ($activities) $foundActivity = true;
foreach ($activities as $activity)  prepareButton($activity);

echo "</tr></table>";
if (!$foundActivity) echo "<h2>No activities for this chapter</h2>"
?>
</div></div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-activities.js"></script>          <!-- Looma Javascript -->
</body>
