<!doctype html>

<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: audioplayer.php
Description: Audio player page for Looma 2

Usage: 	<button id="testaudio" data-fn="sounds.mp3"
						 data-fp="resources/audio/"
						 data-ft="audio">
			AUDIO TEST</button>
	And: $("button#testaudio").click(LOOMA.playMedia);
-->

<?php $page_title = 'Looma Audio Player';
      require_once('includes/header.php');
      require_once('includes/looma-utilities.php');
	  logFiletypeHit('audio');
?>
    <link rel="stylesheet" type="text/css" href="css/looma-audio.css">
	</head>

	<body>
	<?php
		$filename = $_REQUEST['fn'];
        $filepath = $_REQUEST['fp'];
        $displayname = $_REQUEST['dn'];
	?>
    <div id="main-container-horizontal">
        <?php downloadButton($filepath,$filename); ?>
        <div id="audio-viewer" class="viewer">
			<br><br><br><br>
			<h2>Looma Audio Player ( <?php echo $displayname; ?> )</h2>
			<br><br><br><br>
			 <audio id="audio">
			 	 <?php echo	'<source src="' . $filepath . $filename . '" type="audio/mpeg">' ?>
				Your browser does not support the audio element.
			</audio>
		</div>

        <?php require_once("includes/looma-media-controls.php");?>

     </div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-media-controls.js"></script>          <!-- Looma Javascript -->
    <script src="js/looma-play-audio.js"></script>          <!-- Looma Javascript -->
