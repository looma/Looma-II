<!doctype html>
<html>
<?php $page_title = 'Asian Capitals Map';
	  include ('includes/header.php');
?>

    <link rel="stylesheet" href="css/looma-map.css">
    <link rel="stylesheet" href="css/leaflet.css">
  <body>
        <h2>Asian Capitals</h2>
    <div id="map" style="width: 100%; height: 90%"></div>
    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
  <!--Include other JS here -->
  <script src="js/leaflet.js"></script>
  <script src="js/topojson.js"></script>
     <script src="js/looma-maps-asianCapitals.js"></script>
  </body>
</html>
