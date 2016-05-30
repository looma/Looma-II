<!doctype html>
<!--
Author:
Email: skip@stritter.com
Filename: yyy.html
Date: x/x/2015
Description:
-->

	<?php  $page_title = 'Looma Web Page';
	include ('includes/header.php'); ?>
	<!-- add CSS files for this page:
		<link rel="stylesheet" href="css/filename.css"> -->
	</head>

	<body>
		<div id="main-container-horizontal">
			<!-- if internet is accessible, JS will load an external website (e.g. Bing) in the iframe -->
			<iframe id="frame" allowfullscreen></iframe>
		</div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
   	<script src="js/looma-web.js"></script>
</body>
