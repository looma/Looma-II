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

require_once('includes/looma-isloggedin.php');
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

    function wordsWithPicturesList($ch_id) {

            //$query = ['ch_id':$ch_id];
            $words = mongoFindRandom($dictionary_collection, $query, 100 * (int) $maxCount);

    		//print_r($words);

            $count = 0;
            foreach ($words as $newWord) {
                //echo "looking for " . "../content/dictionary images/" . $newWord['en'] . ".jpg";
                    if (file_exists("../content/dictionary images/" . $newWord['en'] . ".jpg")) {
                    array_push($list, $newWord);
                    $count++;
                    if ($count >= $maxCount) break;
                }
            }
    };  // end wordsWithPicturesList()

    function prepareButton($activity) {
        //depending on the filetype of the activity, display the appropriate button
        global $buttons, $maxButtons, $ch_id, $foundActivity, $shown, $chapter_lang, $lang ;

        $id = $activity['_id'];

        // check for no FT
        if (!isset($activity['ft'])) return;

        // filter: show only matching-lang resources for 'test' login level
        if (loggedIn() && loginLevel() === 'test' && $chapter_lang !== $activity['lang'] && $activity['lang'] !== "both") return;

        $ft = strtolower($activity['ft']);

        // skip text and quiz — not shown on activities page
        if ($ft === 'text' || $ft === 'quiz' || $ft === 'voc') return;

        // check if already shown; add to 'shown' array
        if (in_array($id, $shown)) return;
        array_push($shown, $id);

        // pick language-appropriate fields
        if ($chapter_lang === 'np') {
            $dn = isset($activity['ndn']) ? $activity['ndn'] : (isset($activity['dn']) ? $activity['dn'] : "");
            $fp = isset($activity['nfp']) ? $activity['nfp'] : (isset($activity['fp']) ? $activity['fp'] : "");
            $fn = isset($activity['nfn']) ? $activity['nfn'] : (isset($activity['fn']) ? $activity['fn'] : "");
        } else {
            $dn = isset($activity['dn']) ? $activity['dn'] : "";
            $fp = isset($activity['fp']) ? $activity['fp'] : "";
            $fn = isset($activity['fn']) ? $activity['fn'] : "";
        }

        // build the button descriptor array for makeButton()
        $b = array(
            'ft'       => $ft,
            'fp'       => $fp,
            'fn'       => ($ft === 'evi') ? $fn . ".mp4" : $fn,
            'dn'       => $dn,
            'ndn'      => isset($activity['ndn']) ? $activity['ndn'] : null,
            'ch_id'    => $ch_id,
            'lang'     => isset($activity['lang']) ? $activity['lang'] : $lang,
            'db'       => isset($activity['db']) ? $activity['db'] : null,
            'prefix'   => isset($activity['prefix']) ? $activity['prefix'] : null,
            'url'      => isset($activity['url']) ? $activity['url'] : null,
            'grade'    => isset($activity['grade']) ? $activity['grade'] : null,
        );

        // mongo_id: for slideshow/map/evi use mongoId object; otherwise use mongoID string
        $mongoID = isset($activity['mongoID']) ? $activity['mongoID'] : null;
        if ($ft === 'slideshow' || $ft === 'map' || $ft === 'evi')
            $b['mongo_id'] = $mongoID ? mongoId($mongoID) : null;
        else if ($ft === 'game' || $ft === 'history' || $ft === 'lesson')
            $b['mongo_id'] = $mongoID;

        // thumbnail
        if (isset($activity['thumb']))      $b['thumb'] = $activity['thumb'];

        // captions for video
        if (isset($activity['play-captions']) && !$activity['play-captions'])
            $b['captions'] = 'false';

        // PDF-specific
        if ($ft === 'pdf') {
            $b['zoom'] = isset($activity['zoom']) ? $activity['zoom'] : 'auto';
            if (isset($activity['type']) && $activity['type'] === 'TG') {
                $b['pg']  = isset($activity['pn']) ? $activity['pn'] : 1;
                $b['len'] = isset($activity['len']) ? $activity['len'] : null;
            } else {
                $b['pg'] = 1;
            }
        }

        // epaath
        if ($ft === 'ep' || $ft === 'epaath') {
            $oleID = isset($activity['oleID']) ? $activity['oleID'] : null;
            $b['ole_id']    = $oleID;
            $b['epversion'] = isset($activity['version']) ? $activity['version'] : null;
            if ($oleID && substr($oleID, 0, 3) === 'nep') $b['lang'] = 'np';
            else $b['lang'] = 'en';
        }

        // looma page: fp is the url
        if ($ft === 'looma') {
            $b['fp'] = isset($activity['url']) ? $activity['url'] : null;
            $b['fn'] = null;
        }

        // map: use makeMapButton (special case, not makeButton)
        if ($ft === 'map') {
            echo "<td>";
            makeMapButton($mongoID, isset($activity['thumb']) ? $activity['thumb'] : null, $dn);
            echo "</td>";
            $foundActivity = true;
            nextButton();
            return;
        }

        echo "<td>";
        makeButton($b);
        echo "</td>";
        $foundActivity = true;
        nextButton();
    } //end prepareButton()

    /////////////////////////////////////////////////
    /////////////  MAIN CODE ////////////////////////

        // NOTE: should validate these parameters, esp. using "isset"

        $grade = (isset($_GET['grade'])) ? trim($_GET['grade']) : '';
        $gradenumber = (isset($_GET['grade'])) ? str_replace("class", "", $grade) : '';
        $subject = (isset($_GET['subject'])) ? trim($_GET['subject']) : '';

        $lang = 'en';

        $chapter_lang = (isset($_GET['chapter_lang'])) ? trim($_GET['chapter_lang']) : 'en';
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
            echo keyword($caps);
        echo "</h2>";

        echo "<h2 class='title'>";
            echo  '<span class="english-keyword">' . ' ' . $ch_dn .  '</span>';
            echo '<span class="native-keyword">'  . ' ' . $ch_ndn . '</span>';
        echo "</h2>";

	    echo "<div>";

		$maxButtons = 3;
		$foundActivity = false;

		// the user has just pressed a RESOURCES button on a CHAPTERS page
		// First: get MongoDB ObjectId for the chapter whose Resources button was pressed
		//$ch_id = decodeURIComponent($ch_id);
		// Then: retrieve the chapter record from mongoDB for this chapter

        echo "<br><table><tr>";
        $buttons = 1;
/*
    // create a button to the Teacher Guide for this chapter if it exists

        // look up ch_id in collection "teacher_guides" and add a button
        if ($lang === 'en') $query = array('ch_id' => $ch_id);
        else                $query = array('ch_id' => $ch_id);   // ??? should use nch_id  ?????

        $teacher_guide = mongoFindOne($teacherguides_collection, $query);
        if ($teacher_guide) {
            prepareButton($teacher_guide);
            $foundActivity = true;
        }
*/
        // make a button for TEACHER AIDS

        echo "<td><a href='looma-teacher-aids.php?ch_id=$ch_id&chdn=$ch_dn&grade=$grade&subject=$subject'>";

        echo "<button class='activity play img' >";
      //  echo "img src='" . chapterthumbnail($ch_id) . "'";
        echo "Teacher Aids";
 //       echo ": " . keyword(ucfirst($grade)); echo ' ';
 //       echo keyword($caps) . " \"";
 //       echo $ch_dn . "\"";
 //       echo "<span class='tip yes-show big-show' >Chapter " . $ch_id . "</span>";
        echo "</button></a></td>";
        $foundActivity = true;
        nextButton();


    //echo "grade is " . $grade . ", subject is " . ucfirst($subject) . ", ch_id is " . $ch_id;
    $filename = "../content/chapters/Class$gradenumber/" . ucfirst($subject) . "/en/$ch_id.keywords";
    //echo "filename is " . $filename;
    if (file_exists($filename) && $subject !== "math" && substr($ch_id, -3) !== '.00') {


        echo "<td>";

        echo "<a href='looma-game.php?type=keywords&class=Class $gradenumber&subject=$subject&ch_id=" . $ch_id . "'>";
            echo "  <button class='activity  img'>";
            echo "    <img src='images/games.png'>";
            echo "    <span>Key Vocabulary</span>";
            echo "  </button>";
        echo "</a>";

        echo "</td>";
        $foundActivity = true;
        nextButton();
    } //else echo "keywords file not found";





    //create a vocab review button if there are any words from this chapter in the dictionary
    $words = wordList($ch_id, false);

    if ($chapter_lang === 'en' && count($words) >= 3 && $subject !== "math") {
        echo "<td>";

        echo "<a href='looma-vocab-flashcard.php?ch_id=" . $ch_id . "'>";
            echo "  <button class='activity  img'>";
            echo "    <img src='images/dictionary.png'>";
            echo "    <span>New Vocabulary</span>";
            echo "  </button>";
        echo "</a>";

        echo "</td>";
        $foundActivity = true;
        nextButton();
    }

    if ($subject !== "math") {
        if (intval($gradenumber) <= 4 ) { //button for vocabulary picture matching game

            // need to check here if this chapter has any words with pictures in dictionary

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

 /*
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
*/

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

//for "exec" level logins, also show activities with 'ai_ch_id' matching the chapter ObjectId


        if (loginLevel() === 'exec') $query['$or'][] = array("ai_ch_id" => $ch_id);


                $activities = mongoFind($activities_collection, $query, null, null, null);
                foreach ($activities as $activity)  {

                    //echo $activity['dn'];

                if (  ! ( $activity['ft'] === 'lesson' && isset($activity['ch_id']) && in_array($ch_id, iterator_to_array($activity['ch_id']) ) ) ){
                    prepareButton($activity);
                    $foundActivity = true;
                }
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
//                                         prepareButton($activity);

        echo "</tr></table>";

        if (!$foundActivity) echo "<h2>No activities for this chapter</h2>"
	?>
	</div></div>

   	<?php include ('includes/toolbar.php'); ?>
	<?php include ('includes/js-includes.php'); ?>
   	<script src="js/looma-activities.js"></script>          <!-- Looma Javascript -->
</body>
