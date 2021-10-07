<!doctype html>

<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: video.php
Description: Video viewer page for Looma 2
-->

<?php $page_title = 'Looma Image Player';
	  include ('includes/header.php');
    require_once ('includes/looma-utilities.php');
logFiletypeHit('image');

?>
	<link rel="stylesheet" href="css/looma-image.css">
    </head>

	<body>
	<?php
		$filename = $_REQUEST['fn'];
		$filepath = $_REQUEST['fp'];
	?>
	<div id="main-container-horizontal">
		<div class="viewer" id="fullscreen">
			<?php echo	'<img draggable="false" src="' . $filepath . $filename . '">' ?>
            <div id="fullscreen-buttons">
                <?php include ('includes/looma-control-buttons.php');?>
                <?php downloadButton($filepath,$filename); ?>
            </div>
        </div>
	</div>

   	<?php include ('includes/toolbar.php'); ?>
  	<?php include ('includes/js-includes.php'); ?>
   <!-- nothing in looma-image.js for now
        <script src="js/looma-image.js"></script>
    -->
