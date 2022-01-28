<!doctype html>
<!--
Filename: looma-play-map.php
Date: 2018 06
Description:

Author: Sophie, Henry, Morgan
Owner:  VillageTech Solutions (villagetechsolutions.org)
Looma version 3.0
File: header.php
-->

<?php $page_title = 'Looma Maps';
include ('includes/header.php');
logFiletypeHit('map');

?>

<link rel="stylesheet" href="js/leafletjs1.7.1/leaflet.css">
<link rel="stylesheet" href="js/leafletjs1.7.1/leaflet-markerCluster.css" />
<link rel="stylesheet" href="js/leafletjs1.7.1/leaflet-markerCluster.Default.css" />
<link rel="stylesheet" href="css/looma-map.css" />


</head>

<body>

<div id="main-container-horizontal">
        <!--<h1 id = 'title'> Map </h1>-->
        <div class="viewer" id="fullscreen">
                <?php include ('includes/looma-control-buttons.php');?>
                <?php

                if ((isset($_REQUEST["id"]))) {
                    $_id = $_REQUEST["id"];
                    echo "<div id='map' data-id=" . $_id . "></div>";

                    // NOTE: this passes the mongo ID of the map to be opened as a "data-id" attribute on the id="map" div
                    // Javascript can retrieve the mongo ID and call looma-database-utilities.php to get the map metadata from mongo

                } //end if isset()
                else if ((isset($_REQUEST["dn"]))) {
                    $dn = $_REQUEST["dn"];
                    echo "<div id='map' data-dn=" . $dn . "></div>";
                }
                else
                {echo 'no map found';}
                ?>
            </div>
</div>


<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<!-- <script src="js/leafletjs/leaflet.0.7.3.js"></script> -->
<script src="js/leafletjs1.7.1/leaflet.js"></script>
<!--
<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js" integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==" crossorigin=""></script>
-->
<script src="js/leafletjs1.7.1/leaflet-markerCluster.min.js"></script>

<script src="js/looma-map.js"></script>

</body>
</html>
