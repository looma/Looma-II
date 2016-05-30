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
	<!-- add CSS files for this page:
		<link rel="stylesheet" href="css/filename.css"> -->
	</head>

	<body>
	<?php
		$filename = $_REQUEST['fn'];
		$filepath = $_REQUEST['fp'];
	?>
		<div>
		<div class="viewer">
			<br><br><br><br>
			<h2>Audio file: <?php echo $filename; ?></h2>
			<br><br><br><br>
			 <audio id="audio">
			 	 <?php echo	'<source src="' . $filepath . $filename . '" type="audio/mpeg">' ?>
				Your browser does not support the audio element.
			</audio> 
		</div>
		
		<div id="audio-controls">
   		  <br><button type="button" class="media" id="play-pause">Play</button>
  		  <input type="range"   class="video" id="seek-bar" value="0" style="display:inline-block">
  		  <button type="button" class="media" id="full-screen">- -</button><br>

   		  <br><button type="button" class="media" id="volume">Volume</button>
    	  <input type="range"   class="video" id="volume-bar" min="0" max="1" step="0.1" value="1" style="display:inline-block">
    	  <button type="button" class="media" id="mute">Mute</button>

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
   	 <script src="js/looma-audio.js"></script>          <!-- Looma Javascript -->	   		   		   		
