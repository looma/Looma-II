<!doctype html>

<!--
Name: Skip
Email: skip@stritter.com
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
	  include ('includes/header.php');
?>
    <!-- NOTE: audio.php shares media controls styling with video.php -->
    <link rel="stylesheet" type="text/css" href="css/looma-media-controls.css">
	</head>

	<body>
	<?php
		$filename = $_REQUEST['fn'];
        $filepath = $_REQUEST['fp'];
        $displayname = $_REQUEST['dn'];
	?>
		<div>
		<div id="audio-viewer" class="viewer">
			<br><br><br><br>
			<h2>Looma Audio Player ( <?php echo $displayname; ?> )</h2>
			<br><br><br><br>
			 <audio id="audio">
			 	 <?php echo	'<source src="' . $filepath . $filename . '" type="audio/mpeg">' ?>
				Your browser does not support the audio element.
			</audio>

		</div>

	     <div id="media-controls">

         <div id="time" class="title">0:00</div>

              <br><button type="button" class="media play-pause"><?php keyword('Play') ?></button>
              <input type="range"       class="video seek-bar" value="0" style="display:inline-block">
              <br><br>
              <button type="button" class="media mute">    <?php keyword('Volume') ?></button>
              <input type="range"       class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block">
 <!--         <br><button type="button"     class="media" id="mute">      <?php keyword('Mute') ?></button>
 -->
         </div>
	<!--
	  <div id="audio-controls">
   		  <button type="button" class="media" id="play-pause">Play</button>
  		  <input type="range" id="seek-bar" value="0">
		  <button type="button" class="media" id="mute">Mute</button>
    	  <input type="range" id="volume-bar" min="0" max="1" step="0.1" value="1">
 	 </div>
 	-->
 	</div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
     <script src="js/looma-media-controls.js"></script>          <!-- Looma Javascript -->
     <script src="js/looma-audio.js"></script>          <!-- Looma Javascript -->
