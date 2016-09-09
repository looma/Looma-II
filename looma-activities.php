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

    // load: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
    require ('includes/activity-button.php');
	?>

	<!-- add CSS files for this page:  <link rel="stylesheet" href="css/filename.css"> -->
	</head>

	<body>

<?php	$class = trim($_GET['class']);
		$subject = trim($_GET['subject']) ;
		$ch_id = trim($_GET['ch']);
		$ch_dn = trim($_GET['chdn']);
		echo "<div id='main-container-horizontal' class='scroll'>";

		echo "<br>";

		echo "<h2 class='title'>Activities for " . ucfirst($class) . " " . ucfirst($subject) . ": \"" . $ch_dn . "\"</h2>";

?>
	<div>

<?php

		$maxButtons = 3;

		// the user has just pressed an ACTIVITIES button on a CHAPTERS page
		// First: get MongoDB ObjectId for the chapter whose Activities button was pressed
		//$ch_id = decodeURIComponent($ch_id);
		// Then: retrieve the chapter record from mongoDB for this chapter

		//echo "<br>DEBUG: ch_id is ";
		//print_r($ch_id);

		//get all the activities for this chapter
		$query = array('ch_id' => $ch_id);
		//returns only these fields of the activity record
		$projection = array('_id' => 0,
							'ft' => 1,
							'fn' => 1,
							'fp' => 1,
							'dn' => 1,
							'mongoID' => 1
							);

		$activities = $activities_collection -> find($query, $projection);

		//Now: for each activity in the chapter's activities list from mongoDB, display a button
		echo "<br><table><tr>";
		$buttons = 1;
		foreach ($activities as $activity) {
			//depending on the filetype of the activity, display the appropriate button
			echo "<td>";

			$ft = $activity['ft'];
			$dn = $activity['dn'];
            $fp = (isset($activity['fp']) ? $activity['fp'] : "");
            $fn = (isset($activity['fn']) ? $activity['fn'] : "");
            //DEBUG print_r($activity);

            if ($ft == 'slideshow' || $ft == 'evi') $id = new MongoID($activity['mongoID']);

			$thumb = thumbnail($fn);

			switch ($ft) {
				case "video":
				case "mp4":
				case "mov":
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, "", $ch_id, "", "", "");
					break;

                case "slideshow":
                    // in mongodb [for now] 'fn' contains the filename AND the mongoID (concatenated, separated by a space)
                    // 'fn' => 1,      // format: "path/to/image.png mongoid"
                    //      'dn' => 1, // format: "Slideshow Name"
                    //$split = explode(" ", $fn);
                    //$imagesrc = $split[0];
                    //$mongoid  = $split[1];
                    //$fp = urlencode('../content/slideshows/');
                     // USE: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
                    makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $id, "", "");
                    break;

                case "evi":      //edited videos
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
                    //echo "making button: " . $fn . ".";
                    makeActivityButton($ft, $fp, $fn . ".mp4", $dn, "", $ch_id, $id, "", "");
                    break;

                case "VOC":     //vocabulary reviews
                    break;

                case "LP";      //lesson plan
                    break;

                case "image":
				case "jpg":
				case "png":
				case "gif":
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, "", $ch_id, "", "", "");
					break;

				case "audio":
				case "mp3":
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, "", $ch_id, "", "", "");
                    break;

				case "pdf":
                    // USE: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, "", $ch_id, "", "1", "auto");
					break;

				case "EP":
                case "epaath":
                    $thumb = $fn . "/thumbnail.jpg";
                   // USE: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
                    makeActivityButton($ft, "", $fn, $dn, $thumb, $ch_id, "", "", "");
					break;

                case "html":
                    // make a HTML button
                    makeActivityButton($ft, "", $fn, $dn, $thumb, $ch_id, "", "", "");
                    break;

				default:
					echo "unknown filetype " . $ft . "in activities.php";
                    break;

			};  //end SWITCH
		echo "</td>";
		$buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
		}; // end FOREACH
		echo "</tr></table>";

	?>
	</div></div>

   	<?php include ('includes/toolbar.php'); ?>
	<?php include ('includes/js-includes.php'); ?>
   	<script src="js/looma-activities.js"></script>          <!-- Looma Javascript -->
