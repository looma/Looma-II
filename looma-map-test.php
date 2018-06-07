<!doctype html>
<!--
Filename: looma-maps-asianCapitals.php
Date: 2017 07
Description:

Author: Julia, Mohini, Matt, Matthew
Owner:  VillageTech Solutions (villagetechsolutions.org)
Looma version 3.0
File: header.php
-->

<html>
<?php $page_title = 'Asian Capitals Map';
include ('includes/header.php');
?>

<link rel="stylesheet" href="css/looma-map.css">
<link rel="stylesheet" href="css/leaflet.css">
<link rel="stylesheet" href="css/looma-map-asianCapitals.css" />

<body>
<div id="main-container-horizontal">
    <h2>Asian Capitals</h2>
    <div class="viewer" id="fullscreen">
        <button id="fullscreen-control" class="looma-control-button"></button>
        <div id="map" style="width: 100%; height: 100%"></div>

    </div>
</div>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<!--Include other JS here -->
<script src="js/leaflet.js"></script>
<script src="js/topojson.js"></script>
<script src="js/looma-map-test.js"></script>

</body>
</html>
