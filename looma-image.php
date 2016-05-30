<!doctype html>

<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: video.php
Description: Video viewer page for Looma 2
-->

<?php $page_title = 'Looma Image Player';
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
	<div id="main-container-horizontal">
		<div class="viewer" id="fullscreen">
			<?php echo	'<img src="' . $filepath . $filename . '">' ?>
			<button  id="fullscreen-control"></button><br>
		</div>
	</div>
	
   	<?php include ('includes/toolbar.php'); ?>   	   		
  	<?php include ('includes/js-includes.php'); ?>  
  	<script src="js/looma-screenfull.js"></script>	
    <script src="js/looma-image.js"></script>