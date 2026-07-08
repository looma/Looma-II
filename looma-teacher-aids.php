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
$tg = mongoFindOne($TG_collection, $query);
if ($tg) {
    $dn = ($lang === 'np' && isset($tg['ndn'])) ? $tg['ndn'] : (isset($tg['dn']) ? $tg['dn'] : "");
    echo "<td>";
    makeButton(array(
        'ft'   => 'pdf',
        'fp'   => isset($tg['fp']) ? $tg['fp'] : null,
        'fn'   => isset($tg['fn']) ? $tg['fn'] : null,
        'dn'   => "(TG) " . $dn,
        'ch_id'=> $ch_id,
        'lang' => $lang,
        'pg'   => isset($tg['pn']) ? $tg['pn'] : 1,
        'len'  => isset($tg['len']) ? $tg['len'] : null,
        'zoom' => 'auto',
        'thumb'=> isset($tg['thumb']) ? $tg['thumb'] : null,
    ));
    echo "</td>";
    $foundActivity = true;
    nextButton();
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

