<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: video.php
Description: Video viewer page for Looma 2

Usage: 	<button id="testvideo" data-fn="galaxies.mp4"
						 data-fp="resources/videos/"
						 data-ft="video">
			VIDEO TEST</button>
	And: $("button#testvideo").click(LOOMA.playMedia);
-->

<?php $page_title = 'Looma Video Player';
	  include ('includes/header.php');

	  function thumbnail ($fn) {
				//given a CONTENT filename, generate the corresponding THUMBNAIL filename
				//find the last '.' in the filename, insert '_thumb.jpg' after the dot
				//returns "" if no '.' found
				//example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
		 		$dot = strrpos($fn, ".");
				if ( ! ($dot === false)) { return substr_replace($fn, "_thumb.jpg", $dot, 10);}
				else return "";
			} //end function THUMBNAIL

?>
	</head>

	<body>
	<?php
		$filename = $_REQUEST['fn'];
		$filepath = $_REQUEST['fp'];
	?>
	<div id="main-container-horizontal">
		<div height="95%">
			<div id="fullscreen" class="viewer">
				<video id="video"
				<?php echo 'poster="' . $filepath . thumbnail($filename) . '">'; ?>
				<?php echo '<source src="' . $filepath . $filename . '" type="video/mp4">' ?>
				</video>
				<button  id="fullscreen-control"></button><br>
			</div>
		</div>
	  <div id="video-controls">
   		  <br><button type="button" class="media" id="play-pause"><?php keyword('Play') ?></button>
  		  <input type="range"       class="video" id="seek-bar" value="0" style="display:inline-block">
   		  <br><button type="button" class="media" id="volume">    <?php keyword('Volume') ?></button>
    	  <input type="range"       class="video" id="volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block">
    	  <br><button type="button"     class="media" id="mute">      <?php keyword('Mute') ?></button>
 	 </div>
	</div>
   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
  	<script src="js/looma-screenfull.js"></script>
   	 <script src="js/looma-video.js"></script>