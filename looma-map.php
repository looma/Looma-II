<!doctype html>
<!--
Filename: looma-map.php
Date: 2018 06
Description:

Author: Sophie, Henry, Morgan
Owner:  VillageTech Solutions (villagetechsolutions.org)
Looma version 3.0
File: header.php
-->

<?php $page_title = 'Looma Maps';
include ('includes/header.php');
//include ("includes/mongo-connect.php");
?>
  <link rel="stylesheet" href="css/leaflet.css">
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

                    //echo "<h1 id = 'title'> Map </h1>";
                    echo "<div id='map' data-id=" . $_id . "></div>";

                    // NOTE: this passes the mongo ID of the map to be opened as a "data-id" attribute on the id="map" div
                    // Javascript can retrieve the mongo ID and call looma-database-utilities.php to get the map metadata from mongo

                } //end if isset()
                else
                {echo 'no map found';}
                ?>
            </div>
</div>


<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/leaflet.js"></script>
<script src="js/looma-map.js"></script>

</body>
</html>
