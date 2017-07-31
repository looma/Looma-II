<!doctype html>
<html>
<?php $page_title = 'Asian Capitals Map';
	  include ('includes/header.php');
?>

    <link rel="stylesheet" href="css/looma-map.css">
    <link rel="stylesheet" href="css/leaflet.css">
		<link rel="stylesheet" href="css/looma-maps-asianCapitals.css" />
  <body>
        <h2>Asian Capitals</h2>
				<div id="main-container-horizontal">
              <button id="fullscreen-control"></button><br>
</div>
<div class="viewer" id="fullscreen">
    <div id="map"></div>
    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
  <!--Include other JS here -->
  <script src="js/leaflet.js"></script>
  <script src="js/topojson.js"></script>
	<script src="js/looma-screenfull.js"></script>
     <script src="js/looma-maps-asianCapitals.js"></script>
		       </div>
  </body>
</html>
