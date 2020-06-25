<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10, 2019 02
Revision: Looma 4.0.0
File: looma-activities.php
Description:  displays a list of activities for a chapter (class/subject/chapter) for Looma 2
-->


<?php $page_title = 'Looma Resources';
	require ('includes/header.php');
	require ('includes/mongo-connect.php');

//use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom, $grade, $epversion, $nfn, $npg, $prefix,$lang)
    require('includes/looma-utilities.php');
	?>
</head>

<body>

<?php

$shown = array();
$foundActivity;

    function makeButton($activity) {
        //depending on the filetype of the activity, display the appropriate button
        global $buttons, $maxButtons, $ch_id, $foundActivity, $shown ;

        $id = $activity['_id'];

        if ( ! in_array($id, $shown)) {  //check if this Activity has already been shown
            array_push($shown,$id);  //add to 'shown' array, so it wont be shown again

            $ft = $activity['ft'];
            $dn =  $activity['dn'];
            $ndn = (isset($activity['ndn']) ? $activity['ndn'] : "");
            $fp = (isset($activity['fp']) ? $activity['fp'] : "");
            $fn = (isset($activity['fn']) ? $activity['fn'] : "");
            $fn = urlencode($fn);
            $thumb = (isset($activity['thumb']) ? $activity['thumb'] : "");
            $id = (isset($activity['mongoID']) ? $activity['mongoID'] : "");
            $prefix = (isset($activity['prefix']) ? $activity['prefix'] : "");
            $oleID = (isset($activity['oleID']) ? $activity['oleID'] : "");
            $epversion = (isset($activity['version']) ? $activity['version'] : "");
            $grade = (isset($activity['grade']) ? $activity['grade'] : "");
            $url = (isset($activity['url']) ? $activity['url'] : "");

            if (isset($activity['thumb'])) $thumb = $activity['thumb'];
            else if (isset($activity['fn']) && isset($activity['fp']))
                $thumb = $activity['fp'] . thumbnail($activity['fn']);
            else $thumb = null;

            //$thumb = (isset($activity['thumb']) ? $activity['thumb'] : thumbnail($fn));

            //DEBUG print_r($activity);

            if ( ! ( $ft == 'text' )) {

                echo "<td>";

                if ($ft == 'slideshow' ||  $ft == 'evi') $id = new MongoID($activity['mongoID']);

                //if ($ft != 'looma') $thumb = thumbnail($fn);

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
                        makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "", "", "", "",null,null,null,null);
                        break;

                    case "pdf":
                        makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "1", "auto", "", "",null,null,null,null);
                        break;

                    case "text":
                        //NOTE: dont show indivudual text files in Activities page for a chapter
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
                        makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", $oleID, "", "", "", $grade, $epversion,null,null,null,null);
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
		echo "<div id='main-container-horizontal' class='scroll'>";

		echo "<br>";

		if ($subject === "social studies") $caps = "Social Studies"; else $caps = ucfirst($subject);
		$grade = str_replace("class", "Grade ", $grade);
		echo "<h2 class='title'>";
		echo keyword('Resources');
		echo " for " . ucfirst($grade) . " " . $caps . ": \"" . $ch_dn . "\"</h2>";

	    echo "<div>";

		$maxButtons = 3;
		$foundActivity = false;

		// the user has just pressed an ACTIVITIES button on a CHAPTERS page
		// First: get MongoDB ObjectId for the chapter whose Activities button was pressed
		//$ch_id = decodeURIComponent($ch_id);
		// Then: retrieve the chapter record from mongoDB for this chapter

		//echo "<br>DEBUG: ch_id is ";
		//print_r($ch_id);
        echo "<br><table><tr>";
        $buttons = 1;


        //create a vocab review button if there are any words from this chapter in the dictionary
        $query = array('ch_id' => $ch_id);
        $words = $dictionary_collection -> find($query);
        if ($lang === 'en' & $words -> count() > 0) {
            echo "<td>";
            //make a button with <a href="looma-vocab-flashcard.php?ch_id=CH_ID">

            echo "<a href='looma-vocab-flashcard.php?ch_id=" . $ch_id . "'>";
            echo "  <button class='activity play img'>";
            echo "    <img src='images/dictionary.png'>";
            echo "    <span>Vocabulary</span>";
            echo "  </button>";
            echo "</a>";

            echo "</td>";
            $foundActivity = true;
            $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";}
        }


//get all the activities registered for this chapter
        if ($lang === 'en') $query = array('ch_id' => $ch_id);
        else                $query = array('nch_id' => $ch_id);

		$activities = $activities_collection -> find($query);
		foreach ($activities as $activity)  makeButton($activity);

        // REMOVED this keyword matching code JAN 2020. it puts too many activities, esp. in lower grades, that dont match the expertise
        // RE-INSTATED this keyword matching code FEB 2020. adding a check for cl_lo <= grade <= cl_hi

        //get all the activities that match this chapter's keywords
        $query = array('_id' => $ch_id);

        $chapter = $chapters_collection -> findOne($query);

        if ($chapter && isset($chapter['key4'])) {
            $query = array('key1' => $chapter['key1'],
                           'key2' => $chapter['key2'],
                           'key3' => $chapter['key3'],
                           'key4' => $chapter['key4']);
        } else if ($chapter && isset($chapter['key3'])) {
            $query = array('key1' => $chapter['key1'],
                           'key2' => $chapter['key2'],
                           'key3' => $chapter['key3']);
        }

        $activities = $activities_collection->find($query);

        foreach ($activities as $activity) if(isset($activity['cl_lo']) &&
                                              isset($activity['cl_hi']) &&
                                             ($activity['cl_lo'] <= $gradenumber) &&
                                             ($gradenumber <= $activity['cl_hi']))
                                           makeButton($activity);

        echo "</tr></table>";

        if (!$foundActivity) echo "<h2>No activities for this chapter</h2>"
	?>
	</div></div>

   	<?php include ('includes/toolbar.php'); ?>
	<?php include ('includes/js-includes.php'); ?>
   	<script src="js/looma-activities.js"></script>          <!-- Looma Javascript -->
</body>
