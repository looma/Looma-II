<!doctype html>
<!--
Author: lauren henze, lauren smith
Email:
Filename: looma-map-worldMap.php
Date: Aug 2015
Description:
-->

<?php $page_title = 'World Map';
	  include ('includes/header.php');
?>
    <link rel="stylesheet" href="css/leaflet.css">
    <link rel="stylesheet" href="css/looma-map.css">

  <body>

    <h2>Looma World Map</h2>
    <div id="main-container-horizontal">
        <div class="viewer" id="fullscreen">
            <button id="fullscreen-control"></button>
            <div id="worldMap" style="width: 100%; height: 100%"></div>
        </div>
    </div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
	<!--Include other JS here -->
	<script src="js/leaflet.js"></script>
	<!--<script src="js/mapbox-standalone.js"></script>	 -->
	<!-- <script src="js/mbtiles.js"></script>	-->
	<script src="js/topojson.js"></script>
    <script src="js/looma-screenfull.js"></script>

    <script src="js/looma-map-worldMap.js"></script>

   <!--
    <link rel="stylesheet" href="fullscreen/Control.FullScreen.css" />
    <script src="fullscreen/Control.FullScreen.js"></script>
-->
  </body>
</html>
