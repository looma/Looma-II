<!doctype html>
<!--
Author: lauren henze, lauren smith
Email:
Filename: looma-map-zoneMap.php
Date: Aug 2015
Description:
-->

<?php $page_title = 'Nepal Zones Map';
	  include ('includes/header.php');
?>

    <link rel="stylesheet" href="css/looma-map.css">
    <link rel="stylesheet" href="css/leaflet.css">
<!--[if lt IE 9]> <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script> <![endif]-->

  <body>

    <div id="main-container-horizontal">
        <h2>Administrative Zone and District Map</h2>
        <div class="viewer" id="fullscreen">
            <?php include ('includes/looma-control-buttons.php');?>
            <div id="zoneMap" style="width: 100%; height: 100%"></div>
        </div>
    </div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

	<script src="js/leaflet.js"></script>

	<script src="js/topojson.js"></script>
    <script src="js/looma-map-zoneMap.js"></script>

  </body>
</html>
