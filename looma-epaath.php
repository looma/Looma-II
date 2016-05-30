<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: xxxx.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma';
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
	<div id="main-container">
		<div id="main-container-horizontal">
			<div id="fullscreen">
				<?php echo "<iframe src='$filepath$filename' allowfullscreen></iframe>"; ?>
				<button  id="fullscreen-control"></button><br>
			</div>
		</div>
	</div>

   	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?> 
  	<script src="js/looma-screenfull.js"></script>	
   	<script src="js/looma-epaath.js"></script>	
