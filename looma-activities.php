<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10
Revision: Looma 2.0.0
File: looma-activities.php
Description:  displays a list of activities for a chapter (class/subject/chapter) for Looma 2
-->


<?php $page_title = 'Looma Activities';
	require ('includes/header.php');
	require ('includes/mongo-connect.php');

    // load: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
    require('includes/looma-utilities.php');
	?>
</head>

<body>

<?php


    function makeButton($activity) {
        //depending on the filetype of the activity, display the appropriate button
        global $buttons, $maxButtons, $ch_id, $foundActivity;


        $ft = $activity['ft'];
        $dn = $activity['dn'];
        $fp = (isset($activity['fp']) ? $activity['fp'] : "");
        $fn = (isset($activity['fn']) ? $activity['fn'] : "");
        $id = (isset($activity['mongoID']) ? $activity['mongoID'] : "");
        $url = (isset($activity['url']) ? $activity['url'] : "");

        if (isset($activity['thumb']))
            $thumb = $activity['thumb'];
        else if (isset($activity['fn']) && isset($activity['fp']))
            $thumb = $activity['fp'] . thumbnail($activity['fn']);
        else $thumb = null;

        //$thumb = (isset($activity['thumb']) ? $activity['thumb'] : thumbnail($fn));

        //DEBUG print_r($activity);

        if ( ! ( $ft == 'lesson' || $ft == 'text' )) {

            echo "<td>";

            if ($ft == 'slideshow' ||  $ft == 'evi') $id = new MongoID($activity['mongoID']);

            //if ($ft != 'looma') $thumb = thumbnail($fn);

            switch ($ft) {
                case "video":
                case "mp4":
                case "mov":
                case "m4v":
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "");
                    break;

                case "slideshow":
                    // in mongodb [for now] 'fn' contains the filename AND the mongoID (concatenated, separated by a space)
                    // 'fn' => 1,      // format: "path/to/image.png mongoid"
                    //      'dn' => 1, // format: "Slideshow Name"
                    //$split = explode(" ", $fn);
                    //$imagesrc = $split[0];
                    //$mongoid  = $split[1];
                    //$fp = urlencode('../content/slideshows/');
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, $id, "", "", "", "");
                    break;

                case "lesson":
                    $thumb = "images/lesson.png";
                    //makeActivityButton($ft, "", "", $dn, "", $thumb, "", $id, "", "", "");
                    break;

                case "evi":      //edited videos
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    //echo "making button: " . $fn . ".";
                    makeActivityButton($ft, $fp, $fn . ".mp4", $dn, "", $thumb, $ch_id, $id, "", "", "");
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
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, "", $thumb, $ch_id, "", "", "", "");
                    break;

                case "audio":
                case "mp3":
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, "", $thumb, $ch_id, "", "", "", "");
                    break;

                case "pdf":
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, "", $thumb, $ch_id, "", "", "1", "auto");
                    break;

                case "text":
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    //makeActivityButton($ft, "", $fn, $dn, "", $thumb, $ch_id, $id, "", "", "");
                    break;

                case "map";
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, $fp, $fn, $dn, "", "/" . $fn . "_thumb.png", $ch_id, "", "", "", "");
                    break;

                case "looma";  //open a Looma page (e.g. calculator or paint)
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, $url, "", $dn, "", "", $ch_id, "", "", "", "");
                    break;

                case "EP":
                case "epaath":
                    $thumb = $fn . "/thumbnail.jpg";
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, "", "", $ch_id, "", "", "", "");
                    break;

                case "html":
                case "HTML":
                    // make a HTML button
                    makeActivityButton($ft, $fp, $fn, $dn, "", $thumb, $ch_id, "", "", "", "");
                    break;

                default:
                    echo "unknown filetype " . $ft . "in activities.php";
                    break;

            };  //end SWITCH
            echo "</td>";
            $foundActivity = true;
            $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
        };
    }; //end makeButton()

    /*
     * NOTE: should validate these parameters, esp. using "isset"
     */
        $grade = trim($_GET['grade']);
		$subject = trim($_GET['subject']) ;
		$ch_id = trim($_GET['ch']);
		$ch_dn = trim($_GET['chdn']);
		echo "<div id='main-container-horizontal' class='scroll'>";

		echo "<br>";

		if ($subject === "social studies") $caps = "Social Studies"; else $caps = ucfirst($subject);
		$grade = str_replace("class", "Grade ", $grade);
		echo "<h2 class='title'>Activities for " . ucfirst($grade) . " " . $caps . ": \"" . $ch_dn . "\"</h2>";

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
        if ($words -> count() > 0) {
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
            $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
        };


        //get all the activities registered for this chapter
        $query = array('ch_id' => $ch_id);
		//returns only these fields of the activity record
		$projection = array('_id' => 0,
							'ft' => 1,
							'fn' => 1,
							'fp' => 1,
							'dn' => 1,
							'url' => 1,
							'thumb' => 1,
							'mongoID' => 1
							);

		$activities = $activities_collection -> find($query, $projection);
		foreach ($activities as $activity)  makeButton($activity);

        //get all the activities that match this chapter's keywords
        $query = array('_id' => $ch_id);
        $projection = array(
            '_id' => 0,
            'key1' => 1, 'key2' => 1, 'key3' => 1, 'key4' => 1);

        $chapter = $chapters_collection -> findOne($query, $projection);

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
        $projection = array('_id' => 0,
            'ft' => 1,
            'fn' => 1,
            'fp' => 1,
            'dn' => 1,
            'url' => 1,
            'thumb' => 1,
            'mongoID' => 1
            );
        $activities = $activities_collection->find($query, $projection);
        foreach ($activities as $activity) makeButton($activity);
        //};

        echo "</tr></table>";

        if (!$foundActivity) echo "<h2>No activities for this chapter</h2>"
	?>
	</div></div>

   	<?php include ('includes/toolbar.php'); ?>
	<?php include ('includes/js-includes.php'); ?>
   	<script src="js/looma-activities.js"></script>          <!-- Looma Javascript -->
