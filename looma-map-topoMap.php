<!doctype html>
<!--
Author: lauren henze, lauren smith
Email:
Filename: looma-map-topoMap.php
Date: Aug 2015
Description:
-->
<?php $page_title = 'Topography Map';
	  include ('includes/header.php');
	?>

    <link rel="stylesheet" href="css/looma-map.css">
    <link rel="stylesheet" href="css/leaflet.css">
    <link rel="stylesheet" href="css/looma-map-topoMap.css" />
<!--[if lt IE 9]> <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script> <![endif]-->

  </head>

  <body>

      <div id="main-container-horizontal">
          <h2>Topography Map</h2>
          <div class="viewer" id="fullscreen">
              <?php include ('includes/looma-control-buttons.php');?>
              <div id="topoMap" style="width: 100%; height: 100%"></div>
          </div>
      </div>
   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
	<!--Include other JS here -->
	<script src="js/leaflet.js"></script>
	<!--<script src="js/mapbox-standalone.js"></script>	 -->
	<!-- <script src="js/mbtiles.js"></script>	-->
	<script src="js/topojson.js"></script>
	<script src="js/looma-map-topoMap.js"></script>

    <link rel="stylesheet" href="fullscreen/Control.FullScreen.css" />
    <script src="fullscreen/Control.FullScreen.js"></script>

  </body>
</html>
