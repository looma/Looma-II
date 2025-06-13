<!DOCTYPE html>
<!--
Name: Skip

Date: MAR 2025
Revision: Looma 4.0.0
File: looma-teacher-aids.php
Description:  displays a list of teacher aids for a chapter
-->


<?php $page_title = 'Looma Teacher Aids';
require_once ('includes/header.php');

require_once ('includes/mongo-connect.php');

require_once('includes/looma-utilities.php');
//use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id,
//                       $mongo_id, $ole_id, $url, $pg, $zoom, $grade,
//                       $epversion, $nfn, $npg, $prefix,$lang)
?>
<link rel="stylesheet" href="css/looma-teacher-aids.css">
</head>
<body>
<?php

function nextButton() {
    global $buttons, $maxButtons;
    $buttons++;
    if ($buttons > $maxButtons) { $buttons = 1; echo "</tr><tr>";}
}

function chapterthumbnail($ch_id) {
    return "";
}

function makeButton($activity) {
    //depending on the filetype of the activity, display the appropriate button
    global $buttons, $maxButtons, $ch_id, $foundActivity, $shown, $lang ;

    $id = $activity['_id'];

    // check for no FT
    if (!isset($activity['ft'])) return;

        $ft = strtolower($activity['ft']);
        //   $dn = (isset($activity['dn']) ? $activity['dn'] : (isset($activity['ndn']) ? $activity['ndn'] : ""));
        //$ndn = (isset($activity['ndn']) ? $activity['ndn'] : "");
        $fp = (isset($activity['fp']) ? $activity['fp'] : "");

        if (isset($activity['lang']) && $activity['lang'] === 'np')
            $displayname = (isset($activity['ndn'])? $activity['ndn']:(isset($activity['dn']) ? $activity['dn'] : ""));
        else
            $displayname = (isset($activity['dn'])? $activity['dn']:(isset($activity['ndn']) ? $activity['ndn'] : ""));

        if ($lang === 'np') $fp = (isset($activity['nfp'])? $activity['nfp']:(isset($activity['fp']) ? $activity['fp'] : ""));
        else                $fp = (isset($activity['fp']) ? $activity['fp'] : "");

        if ($lang === 'np') $fn = (isset($activity['nfn'])? $activity['nfn']:(isset($activity['fn']) ? $activity['fn'] : ""));
        else                $fn = (isset($activity['fn']) ? $activity['fn'] : "");

        $thumb = (isset($activity['thumb']) ? $activity['thumb'] : "");

        $id = (isset($activity['mongoID']) ? $activity['mongoID'] : "");
        $prefix = (isset($activity['prefix']) ? $activity['prefix'] : "");
        $oleID = (isset($activity['oleID']) ? $activity['oleID'] : "");
        $mongoID = (isset($activity['mongoID']) ? $activity['mongoID'] : "");
        $epversion = (isset($activity['version']) ? $activity['version'] : "");
        $grade = (isset($activity['grade']) ? $activity['grade'] : "");
        $url = (isset($activity['url']) ? $activity['url'] : "");

        if (isset($activity['thumb'])) $thumb = $activity['thumb'];
        else if (isset($activity['fn']) && isset($activity['fp']))
            $thumb = thumbnail($activity['fn'],$activity['fp'],$activity['ft']);
        else if ($ft === 'game') $thumb = 'images/games.png';
        else $thumb = null;

        //$thumb = str_replace('.JPG', '.jpg', $thumb);

        if ( $ft !== 'text' ) {
            echo "<td>";

            if ($ft === 'slideshow' ||  $ft === 'map' || $ft === 'evi' )
                $id = mongoId ($activity['mongoID']);

            switch ($ft) {
                case "video":
                case "mp4":
                case "mov":
                case "m4v":
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "", "", "", "",null,null, null,$lang);
                    break;
                case "slideshow":
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, $id, "", "", "", "", "", "", "",null,null,$lang);
                    break;
                case "lesson":
                    $thumb = "images/lesson.png";
                    makeActivityButton($ft, $fp, "", $dn, "", $thumb, "", $id, "", "", "", "", "", "",null,null,null,$lang);
                    break;
                case "evi":      //edited videos
                    makeActivityButton($ft, $fp, $fn . ".mp4", $dn, "", $thumb, $ch_id, $id, "", "", "", "", "", "",null,null,null,null);
                    break;
                case "voc":     //vocabulary reviews
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
                    if (isset($activity['type']) && $activity['type'] === "TG") {
                        makeActivityButton($ft, $fp, $fn, "(TG) " . $displayname, "", $thumb, $ch_id, "", "", $activity['len'], $activity['pn'], "auto", "", "", null, null, null, $lang);
                    } else
                        makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "1", "auto", "", "",null,null,null,$lang);
                    break;
                case "game":
                case "history":
                    makeActivityButton($ft, null, null, $dn, "", $thumb, $ch_id, $id, "", "", "1", "auto", $grade, "",null,null,null,null);
                    break;
                case "text":
                    //NOTE: dont show individual text files in Activities page for a chapter
                    //makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, $id, "", "", "", "", "", "",null,null,null,null);
                    break;
                case "map";
                    //   makeActivityButton($ft, $fp, $fn, $dn, "", "/" . $fn . "_thumb.png", $ch_id, $mongoID, "", "", "", "", "", "",null,null,null,null);
                    makeMapButton($mongoID, $thumb, $dn);
                    break;
                case "looma";  //open a Looma page (e.g. calculator or paint)
                    makeActivityButton($ft, $url, "", $dn, "", "", $ch_id, "", "", "", "", "", "", "",null,null,null,null);
                    break;
                case "ep":
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
                    makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, "", "", "", "", "", "", "",null,null, $prefix,$lang);
                    break;
                default:
                    //  echo "unknown filetype \"" . $ft . "\" in activities.php";
                    break;
            }  //end SWITCH
            echo "</td>";
            $foundActivity = true;
            nextButton();
        }
} //end makeButton()

/////////////////////////////////////////////////
/////////////  MAIN CODE ////////////////////////

// NOTE: should validate these parameters, esp. using "isset"

$grade = (isset($_GET['grade'])) ? trim($_GET['grade']) : '';
$gradenumber = ucfirst((isset($_GET['grade'])) ? str_replace("Grade ", "", $grade) : '');
$subject = (isset($_GET['subject'])) ? trim($_GET['subject']) : '';
$lang = (isset($_GET['lang'])) ? trim($_GET['lang']) : 'en';
$ch_id = trim($_GET['ch_id']);

$ch_dn =  (isset($_GET['chdn'])) ? trim($_GET['chdn']) : "";
$ch_ndn =  (isset($_GET['chndn'])) ? trim($_GET['chndn']) : $ch_dn;

$foundActivity = false;

echo "<div id='main-container-horizontal' class='scroll'>";
echo "<br>";

if ($subject === "social studies") {
    $caps = "Social Studies";
    $subject = "SocialStudies";
}
else if ($subject === 'math')      {
    $caps = "Maths";
    $subject = "Math";
}
else {
    $caps = ucfirst($subject);
    $subject = ucfirst($subject);
}
$grade = str_replace("class", "Grade ", $grade);
echo "<h2 class='title'>";
echo keyword('Teacher Aids'); echo ': ';
echo keyword(ucfirst($grade)); echo ' ';
echo keyword($caps) . "<br>\"";
//echo $ch_dn;
echo '<span class="english-keyword">' . ' ' . $ch_dn .  '</span>';
echo '<span class="native-keyword">'  . ' ' . $ch_ndn . '</span>';
echo "\"</h2>";

echo "<div>";

$maxButtons = 3;

// the user has just pressed a TEACHER AIDS button on a CHAPTERS page
// First: get MongoDB ObjectId for the chapter whose Resources button was pressed
//$ch_id = decodeURIComponent($ch_id);

echo "<br><table><tr>";
$buttons = 1;
// create a button to the Teacher Guide for this chapter if it exists

// look up ch_id in collection "teacher_guides" and add a button
if ($lang === 'en') $query = array('ch_id' => $ch_id);
else                $query = array('ch_id' => $ch_id);   // ??? should use nch_id  ?????

// make button for TEACHER GUIDE
$teacher_guide = mongoFindOne($TG_collection, $query);
if ($teacher_guide) {
    makeButton($teacher_guide);
    $foundActivity = true;
}

//if ($thumbSrc) echo '<img alt="" loading="lazy" draggable="false" src="' . $thumbSrc . '">';


// make buttons for TEACHER AIDS if present
$aids = ['summary','outline','plan','keywords','quiz','objectives'];
$aidnames = ['Summary','Outline','Plan','Keywords','Quizzes','Objectives'];
for ($i=0; $i<sizeof($aids); $i++)  {
    $aid = $aids[$i];

   //echo ("LOOKING FOR ../content/chapters/Class$gradenumber/$subject/$lang/$ch_id.$aid");

    if (file_exists("../content/chapters/Class$gradenumber/$subject/$lang/$ch_id.$aid")) {
        echo "<td><a href='looma-play-teacher-aid.php?dn=$aid&type=$aid&ch_id=$ch_id'>";
        echo "<button class='activity  img' >";
        echo "<span class='name'>Chapter " . $aidnames[$i] . "</span>";
        // echo "img src='" . chapterthumbnail($ch_id) . "'";
       // echo $ch_id;
        echo "</button></a></td>";
        $foundActivity = true;
        nextButton();
    }
}

echo "</tr></table>";

if (!$foundActivity) echo "<h2>No Teacher Aids for this chapter</h2>"
?>
</div></div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-activities.js"></script>
<script src="js/looma-play-teacher-aid.js"></script>
</body>

