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
	include ('includes/header.php');
	include ('includes/mongo-connect.php');
	?>

	<!-- add CSS files for this page:  <link rel="stylesheet" href="css/filename.css"> -->
	</head>

	<body>

<?php	$class = trim($_GET['class']);
		$subject = trim($_GET['subject']) ;
		$ch_id = trim($_GET['ch']);
		$ch_dn = trim($_GET['chdn']);
		echo "<div id='main-container-horizontal' class='scroll'>";

		echo "<br><br>";

		echo "<h2 class='title'>Activities for " . ucfirst($class) . " " . ucfirst($subject) . ": \"" . $ch_dn . "\"";

?>

	<div>

	<?php

			$maxButtons = 3;

			function thumbnail ($fn) {
				//given a CONTENT filename, generate the corresponding THUMBNAIL filename
				//find the last '.' in the filename, insert '_thumb.jpg' after the dot
				//returns "" if no '.' found
				//example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
		 		$dot = strrpos($fn, ".");
				if ( ! ($dot === false)) { return substr_replace($fn, "_thumb.jpg", $dot, 10);}
				else return $fn . "_thumb.jpg";
			} //end function THUMBNAIL

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
								'dn' => 1,
								);

			$activities = $activities_collection -> find($query, $projection);

			//echo "<br>DEBUG: and ch is ";
			//print_r($ch);

			// 	echo "<pre>";
			//	echo "DEBUG:  ";
			//	print_r ($activities);
			//	echo "</pre>";

			//Now: for each activity in the chapter's activities list from mongoDB, display a button
			echo "<br><br><table><tr>";
			$buttons = 1;
			foreach ($activities as $activity) {
				//depending on the filetype of the activity, display the appropriate button
				echo "<td>";

				$ft = $activity['ft'];
				$dn = $activity['dn'];
				$fn = $activity['fn'];

				$thumb = thumbnail($ft);

				switch ($ft) {
					case "video":
					case "mp4":
					case "mov":
						// play VIDEO activity file
						$fp = '../content/videos/';
						echo "<button class='activity play img'
									  data-fn='" . $fn .
								   "' data-fp='" . $fp .
								   "' data-ft='" . $ft .
								   "' data-ch='" . $ch_id .
								   "'><img src='" . $fp . thumbnail($fn) . "'>" .
								   $dn . "</button>";
						break;
					case "image":
					case "jpg":
					case "png":
					case "gif":
						// display IMAGE activity file
						$fp = '../content/pictures/';
						echo "<button class='activity play img'
									  data-fn='" . $fn .
								   "' data-fp='" . $fp .
								   "' data-ft='" . $ft .
								   "' data-ch='" . $ch_id .
								   "'><img src='" . $fp . thumbnail($fn) . "'>" .
								   $dn . "</button>";
						break;
					case "audio":
					case "mp3":
						$fp = '../content/audio/';
						echo "<button class='activity play img'
									  data-fn='" . $fn .
								   "' data-fp='" . $fp .
								   "' data-ft='" . $ft .
								   "' data-ch='" . $ch_id .
								   "'><img src='" . $fp . thumbnail($fn) . "'>" .
								   $dn . "</button>";
						break;
					case "pdf":
						// display PDF activity file
						$fp = '../content/pdfs/';
						echo "<button class='activity play img'
									  data-fn='" . $fn .
								   "' data-fp='" . $fp .
								   "' data-pg='1'" .
								   "' data-ft='" . $ft .
								   "' data-ch='" . $ch_id .
								   "'><img src='" . $fp . thumbnail($fn) . "'>" .
								   $dn . "</button>";
						break;
					case "EP":
						// display ePaath activity file
						$fp = '../content/epaath/activities/';
						echo "<button class='activity play img'
									  data-fn='" . $fn .
								   "' data-fp='" . $fp .
								   "' data-ch='" . $ch_id .
								   "' data-ft='epaath'" .
								  "'><img src='" . $fp . $fn . "/thumbnail.jpg'>" .
								   $dn . "</button>";
						break;
					default:
						echo "unknown filetype " . $ft . "in activities.php";
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
