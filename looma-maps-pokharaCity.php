<html>

    <?php $page_title = 'Pokhara Street Map';
        include ('includes/header.php');
      ?>
    <link rel="stylesheet" href="css/looma-map.css">
    <link rel="stylesheet" href="css/leaflet.css">
    <link rel="stylesheet" href="css/looma-maps-pokharaCity.css" />

  <body>
    <h2>Pokhara Street Map<h2>
          <div id="map"></div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/leaflet.js"></script>
    <script src="js/topojson.js"></script>
    <script src="js/looma-maps-pokharaCity.js"></script>
  </body>
</html>
