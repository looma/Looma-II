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

//use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom, $grade, $epversion, $nfn, $npg, $prefix,$lang)
require_once('includes/looma-utilities.php');
?>
</head>

<body>

<?php

$shown = array();
$foundActivity;

function makeButton($activity) {
    //depending on the filetype of the activity, display the appropriate button
    global $buttons, $maxButtons, $ch_id, $foundActivity, $shown, $lang ;

    $id = $activity['_id'];

    if ( ! in_array($id, $shown)) {  //check if this Activity has already been shown
        array_push($shown,$id);  //add to 'shown' array, so it wont be shown again

        $ft = $activity['ft'];
        $dn =  $activity['dn'];
        $ndn = (isset($activity['ndn']) ? $activity['ndn'] : "");
        $fp = (isset($activity['fp']) ? $activity['fp'] : "");
        $fn = (isset($activity['fn']) ? $activity['fn'] : "");
        //$fn = urlencode($fn);
        $thumb = (isset($activity['thumb']) ? $activity['thumb'] : "");
        $id = (isset($activity['mongoID']) ? $activity['mongoID'] : "");
        $prefix = (isset($activity['prefix']) ? $activity['prefix'] : "");
        $oleID = (isset($activity['oleID']) ? $activity['oleID'] : "");
        $epversion = (isset($activity['version']) ? $activity['version'] : "");
        $grade = (isset($activity['grade']) ? $activity['grade'] : "");
        $url = (isset($activity['url']) ? $activity['url'] : "");

        if (isset($activity['thumb'])) $thumb = $activity['thumb'];
        else if (isset($activity['fn']) && isset($activity['fp']))
            $thumb = $activity['fp'] . thumbnail($fn,$fp,$ft);
        else if ($ft === 'game') $thumb = 'images/games.png';
        else $thumb = null;

        //$thumb = (isset($activity['thumb']) ? $activity['thumb'] : thumbnail($fn));

        //DEBUG print_r($activity);

        if ( ! ( $ft == 'text' )) {

            echo "<td>";

            if ($ft == 'slideshow' ||  $ft == 'evi') $id = new MongoID($activity['mongoID']);

            switch ($ft) {
                case "video":
                case "mp4":
                case "mov":
                case "m4v":
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "", "", "", "",null,null, null,null);
                    break;

                case "slideshow":
                    // in mongodb [for now] 'fn' contains the filename AND the mongoID (concatenated, separated by a space)
                    // 'fn' => 1,      // format: "path/to/image.png mongoid"
                    //      'dn' => 1, // format: "Slideshow Name"
                    //$split = explode(" ", $fn);
                    //$imagesrc = $split[0];
                    //$mongoid  = $split[1];
                    //$fp = urlencode('../content/slideshows/');
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, $id, "", "", "", "", "", "", "",null,null,null);
                    break;

                case "lesson":
                    $thumb = "images/lesson.png";
                    makeActivityButton($ft, $fp, "", $dn, "", $thumb, "", $id, "", "", "", "", "", "",null,null,null,null);
                    break;

                case "evi":      //edited videos
                    makeActivityButton($ft, $fp, $fn . ".mp4", $dn, "", $thumb, $ch_id, $id, "", "", "", "", "", "",null,null,null,null);
                    break;

                case "VOC":     //vocabulary reviews
                    break;

                case "LP";      //lesson plan
                    break;

                case "image":
                case "jpg":
                case "jpeg":
                case "png":
                case "gif":
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "", "", "", "",null,null,null,null);
                    break;

                case "audio":
                case "mp3":
                case "m4a":
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "", "", "", "",null,null,null,null);
                    break;

                case "pdf":
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "1", "auto", "", "",null,null,null,null);
                    break;

                case "game":
                    makeActivityButton($ft, null, null, $dn, "", $thumb, $ch_id, $id, "", "", "1", "auto", $grade, "",null,null,null,null);
                    break;

                case "text":
                    //NOTE: dont show individual text files in Activities page for a chapter
                    //makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, $id, "", "", "", "", "", "",null,null,null,null);
                    break;

                case "map";
                    makeActivityButton($ft, $fp, $fn, $dn, "", "/" . $fn . "_thumb.png", $ch_id, "", "", "", "", "", "", "",null,null,null,null);
                    break;

                case "looma";  //open a Looma page (e.g. calculator or paint)
                    makeActivityButton($ft, $url, "", $dn, "", "", $ch_id, "", "", "", "", "", "", "",null,null,null,null);
                    break;

                case "EP":
                case "epaath":
                    if ($epversion === 2015) $thumb = $fp . $fn . "/thumbnail.jpg";
                    if ( substr($oleID, 0, 3) === 'nep') $lang = 'np';
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", $oleID, "", "", "", $grade, $epversion,null,null,null,$lang);
                    break;

                case "html":
                case "HTML":
                    // make a HTML button
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "", "", "", "",null,null, null,null);
                    break;

                case "book":
                    // make a book button
                    makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, "", "", "", "", "", "", "",null,null, $prefix,null);
                    break;

                default:
                    echo "unknown filetype \"" . $ft . "\" in activities.php";
                    break;

            }  //end SWITCH
            echo "</td>";
            $foundActivity = true;
            $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";}

        }
    }
} //end makeButton()

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
foreach ($activities as $activity)  makeButton($activity);

echo "</tr></table>";
if (!$foundActivity) echo "<h2>No activities for this chapter</h2>"
?>
</div></div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-activities.js"></script>          <!-- Looma Javascript -->
</body>
