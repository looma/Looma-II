<!DOCTYPE html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10, 2019 02
Revision: Looma 4.0.0
File: looma-activities.php
Description:  displays a list of activities for a chapter (class/subject/chapter) for Looma 2
-->


<?php $page_title = 'Looma Resources';
require_once ('includes/header.php');

require_once ('includes/mongo-connect.php');

require_once('includes/looma-utilities.php');
//use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id,
//                       $mongo_id, $ole_id, $url, $pg, $zoom, $grade,
//                       $epversion, $nfn, $npg, $prefix,$lang)
?>
</head>
<body>
<?php
$shown = array();
$foundActivity;

function nextButton() {
    global $buttons, $maxButtons;
    $buttons++;
    if ($buttons > $maxButtons) { $buttons = 1; echo "</tr><tr>";}
}

function wordList ($ch_id, $picturesonly) { // borrowed code from looma-dictionary-utilities.php
    global $dictionary_collection;
    $maxCount = 50;
    $list = array();
    if (preg_match( '/\d+([a-zA-Z]+)\d/', $ch_id,$matches))
        $prefix = $matches[1];
    else $prefix = "";

    //echo ('ch_id is '. $ch_id . '  and prefix is '.$prefix);
    //print_r($matches);

    // $query = array("ch_id.$prefix" => mongoRegexOptions("^".$ch_id,'i'));
    $query = array("ch_id.$prefix" => $ch_id);

//NOTE: to find dictionary entries with a given ch_id:
//   db.dictionaryV2.find({ch_id:{'EN':'1EN01.01'}},{_id:0,en:1})
//NOTE: to find dictionary entries with a ch_id regex:
//	db.dictionaryV2.find({'ch_id.EN':{$regex:/1EN01/}},{_id:0,en:1})

    if (!$picturesonly) {
        $words = mongoFindRandom($dictionary_collection, $query, (int) $maxCount);
        $count = 0;
        foreach ($words as $newWord) {
            array_push($list, $newWord);
            $count++;
            if ($count >= $maxCount) break;
        }
    } else {
        $words = mongoFindRandom($dictionary_collection, $query, $maxCount * 100);
        $count = 0;
        foreach ($words as $newWord) {
            if (file_exists("../content/dictionary images/" . $newWord['en'] . ".jpg")) {
                array_push($list, $newWord);
                $count++;
                if ($count >= $maxCount) break;
            }
        }
    };
    return $list;
} // end wordList()

function makeButton($activity) {
    //depending on the filetype of the activity, display the appropriate button
    global $buttons, $maxButtons, $ch_id, $foundActivity, $shown, $lang ;

    $id = $activity['_id'];

    // check for no FT
    if (!isset($activity['ft'])) return;

    //check if this Activity has already been shown
    //add to 'shown' array, so it wont be shown again
    if ( ! in_array($id, $shown)) {
        array_push($shown,$id);

        $ft = strtolower($activity['ft']);
        //   $dn = (isset($activity['dn']) ? $activity['dn'] : (isset($activity['ndn']) ? $activity['ndn'] : ""));
        $ndn = (isset($activity['ndn']) ? $activity['ndn'] : "");
        $fp = (isset($activity['fp']) ? $activity['fp'] : "");

        if ($lang === 'np') $dn = (isset($activity['ndn'])? $activity['ndn']:(isset($activity['dn']) ? $activity['dn'] : ""));
        else                $dn = (isset($activity['dn']) ? $activity['dn'] : "");

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
                    if (isset($activity['type']) && $activity['type'] === "TG")
                        makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", $activity['len'], $activity['pn'], "auto", "", "",null,null,null,$lang);
                    else
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
    }
} //end makeButton()

/////////////////////////////////////////////////
/////////////  MAIN CODE ////////////////////////

// NOTE: should validate these parameters, esp. using "isset"

$grade = (isset($_GET['grade'])) ? trim($_GET['grade']) : '';
$gradenumber = (isset($_GET['grade'])) ? str_replace("class", "", $grade) : '';
$subject = (isset($_GET['subject'])) ? trim($_GET['subject']) : '';
$lang = (isset($_GET['lang'])) ? trim($_GET['lang']) : 'en';
$ch_id = trim($_GET['ch']);
$ch_dn = trim($_GET['chdn']);

$ch_ndn =  (isset($_GET['chndn'])) ? trim($_GET['chndn']) : $ch_dn;

echo "<div id='main-container-horizontal' class='scroll'>";
echo "<br>";

if ($subject === "social studies") $caps = "Social Studies";
else if ($subject === 'math')      $caps = "Maths";
else                               $caps = ucfirst($subject);

$grade = str_replace("class", "Grade ", $grade);
echo "<h2 class='title'>";
echo keyword('Resources'); echo ': ';
echo keyword(ucfirst($grade)); echo ' ';
echo keyword($caps) . " \"";

echo '<span class="english-keyword">' . ' ' . $ch_dn .  '</span>';
echo '<span class="native-keyword">'  . ' ' . $ch_ndn . '</span>';
echo "\"</h2>";

echo "<div>";

$maxButtons = 3;
$foundActivity = false;

// the user has just pressed a RESOURCES button on a CHAPTERS page
// First: get MongoDB ObjectId for the chapter whose Resources button was pressed
//$ch_id = decodeURIComponent($ch_id);
// Then: retrieve the chapter record from mongoDB for this chapter

echo "<br><table><tr>";
$buttons = 1;
// create a button to the Teacher Guide for this chapter if it exists

// look up ch_id in collection "teacher_guides" and add a button
if ($lang === 'en') $query = array('ch_id' => $ch_id);
else                $query = array('ch_id' => $ch_id);   // ??? should use nch_id  ?????

$teacher_guide = mongoFindOne($teacherguides_collection, $query);
if ($teacher_guide) {
    makeButton($teacher_guide);
    $foundActivity = true;
}

//create a vocab review button if there are any words from this chapter in the dictionary
$words = wordList($ch_id, false);

if ($lang === 'en' && count($words) >= 3) {
    echo "<td>";

    echo "<a href='looma-vocab-flashcard.php?ch_id=" . $ch_id . "'>";
    echo "  <button class='activity  img'>";
    echo "    <img src='images/dictionary.png'>";
    echo "    <span>Vocabulary</span>";
    echo "  </button>";
    echo "</a>";

    echo "</td>";
    $foundActivity = true;
    nextButton();

    if (intval($gradenumber) <= 4) { //button for vocabulary picture matching game
        echo "<td>";

        //echo "<a href='looma-game.php?type=picture&class=class" . $gradenumber . "&subject=" . $subject . "&ch_id=" . $ch_id . "'>";
        echo "  <button class='activity play img game' data-ft=game data-type='picture'";
        echo " data-class='" . $gradenumber . "'";
        echo " data-subject='" . $subject . "'";
        echo " data-ch_id='" . $ch_id . "'";
        echo ">";
        echo "    <img src='images/games.png'>";
        echo "    <span>Visual Vocabulary</span>";
        echo "  </button>";
        // echo "</a>";

        echo "</td>";
        $foundActivity = true;
        nextButton();
    } else {  // grade > 4

        echo "<td>";
        echo "<a href='looma-game.php?type=speak&class=" . $grade . "&subject=" . $subject . "&ch_id=" . $ch_id . "'>";
        echo "  <button class='activity play img'>";
        echo "    <img src='images/speech1.png'>";
        echo "    <span>Spoken Vocabulary</span>";
        echo "  </button>";
        echo "</a>";

        echo "</td>";
        $foundActivity = true;
        nextButton();

        echo "<td>";
        echo "<a href='looma-game.php?type=translate&class=" . $grade . "&subject=" . $subject . "&ch_id=" . $ch_id . "'>";
        echo "  <button class='activity play img'>";
        echo "    <img src='images/games.png'>";
        echo "    <span> Vocabulary Translation</span>";
        echo "  </button>";
        echo "</a>";

        echo "</td>";
        $foundActivity = true;
        nextButton();
    }
}

if ($subject === 'math') {
    echo "<td>";
    echo "<a href='looma-arith.php?type=arith&class=class" . $gradenumber . "&subject=" . $subject . "&ch_id=" . $ch_id . "'>";
    echo "  <button class='activity play img'>";
    echo "    <img src='images/games.png'>";
    echo "    <span>Mathematical Operations Practice</span>";
    echo "  </button>";
    echo "</a>";

    echo "</td>";
    $foundActivity = true;
    nextButton();
}  // end of special cases [vocab for english and arith for math]


////////////////////////////////////////////////////
//get all the resources registered for this chapter
////////////////////////////////////////////////////

//   if ($lang === 'en') $query = array('ch_id' => $ch_id);
//   else                $query = array('nch_id' => $ch_id);   // ??? should use nch_id  ?????

//$query = array('$or' => array('ch_id' => $ch_id,'nch_id' => $ch_id));

$query= array('$or' => array(
    array("ch_id" => $ch_id),
    array("nch_id" => $ch_id)
));

$activities = mongoFind($activities_collection, $query, null, null, null);
foreach ($activities as $activity)  {

    //echo $activity['dn'];

    makeButton($activity);
    $foundActivity = true;
}

// REMOVED this keyword matching code JAN 2020. it puts too many activities, esp. in lower grades, that dont match the expertise
// RE-INSTATED this keyword matching code FEB 2020. adding a check for cl_lo <= grade <= cl_hi
//
//      //get all the activities that match this chapters keywords
//      $query = array('_id' => $ch_id);

//      //$chapter = $chapters_collection -> findOne($query);
//      $chapter = mongoFindOne($chapters_collection, $query);

//      if ($chapter && isset($chapter['key4'])) {
//          $query = array('key1' => $chapter['key1'],
//                         'key2' => $chapter['key2'],
//                         'key3' => $chapter['key3'],
//                         'key4' => $chapter['key4']);
//      } else if ($chapter && isset($chapter['key3'])) {
//          $query = array('key1' => $chapter['key1'],
//                         'key2' => $chapter['key2'],
//                         'key3' => $chapter['key3']);
//        }

//$activities = $activities_collection->find($query);
//      $activities = mongoFind($activities_collection, $query, null, null, null);
//      foreach ($activities as $activity) if(isset($activity['cl_lo']) &&
//                                            isset($activity['cl_hi']) &&
//                                           ($activity['cl_lo'] <= $gradenumber) &&
//                                           ($gradenumber <= $activity['cl_hi']))
//                                         makeButton($activity);

echo "</tr></table>";

if (!$foundActivity) echo "<h2>No activities for this chapter</h2>"
?>
</div></div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-activities.js"></script>          <!-- Looma Javascript -->
</body>
