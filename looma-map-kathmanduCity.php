<!doctype html>
<!--
Author: lauren henze, lauren smith
Email:
Filename: looma-map-topoMap.php
Date: Aug 2015
Description:
-->
<?php $page_title = 'Kathmandu Street Map';
	  include ('includes/header.php');
	?>

    <link rel="stylesheet" href="css/looma-map.css">
    <link rel="stylesheet" href="css/leaflet.css">
<!--[if lt IE 9]> <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script> <![endif]-->

  </head>

  <body>

      <div id="main-container-horizontal">
          <h2>Street Map of Kathmandu and Patan</h2>
          <div class="viewer" id="fullscreen">
              <?php include ('includes/looma-control-buttons.php');?>
              <div id="streetMap" style="width: 100%; height: 100%""></div>
          </div>
      </div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
	<!--Include other JS here -->
	<script src="js/leaflet.js"></script>
	<!--<script src="js/mapbox-standalone.js"></script>	-->
	<!-- <script src="js/mbtiles.js"></script>	-->
	<script src="js/topojson.js"></script>
	<script src="js/looma-map-kathmanduCity.js"></script>


  </body>
</html>
