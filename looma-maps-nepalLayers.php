<html>
  <head>
    <title>Layer</title>

    <?php $page_title = 'Layered Nepal Map';
    	  include ('includes/header.php');
    	?>

    <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.css">
    <script src="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.js"></script>
    <style>
      #map {
        height: 100%;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
    <div id="map"></div>
    <script src="js/looma-maps-nepalLayers.js"></script>
  </body>
</html>
