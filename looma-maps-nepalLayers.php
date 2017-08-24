<!doctype html>
<!--
Filename: looma-maps-nepalLayers.php
Date: 2017 07
Description:

Author: Julia, Mohini, Matt, Matthew
Owner:  VillageTech Solutions (villagetechsolutions.org)
Looma version 3.0
File: header.php
-->
<html>

    <?php $page_title = 'Nepal Layers';
      include ('includes/header.php');
      ?>
    <link rel="stylesheet" href="css/looma-map.css">
    <link rel="stylesheet" href="css/leaflet.css">
    <link rel="stylesheet" href="css/looma-maps-nepalLayers.css" />

  <body>
    <h2>Nepal Layers<h2>

    <div id="main-container-horizontal">
     <div class="viewer" id="fullscreen">
         <button id="fullscreen-control"></button>
         <div id="map"></div>
     </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/leaflet.js"></script>
    <script src="js/topojson.js"></script>
    <script src="js/looma-screenfull.js"></script>
    <script src="js/looma-maps-nepalLayers.js"></script>

  </body>
</html>
