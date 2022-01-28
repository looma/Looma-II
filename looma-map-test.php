<!doctype html>
<!--
Filename: looma-xxx.php
Description: looma PHP template

Author: Skip
Owner:  Looma Education Company
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma Page Template';
require_once ('includes/header.php');

/* header.php imports: CSS: looma.css, looma-keyboard.css, bootstrap.css */
?>

<link rel="stylesheet" href="css/looma-template.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <div id="map" style="background-color:white"></div>


    </div>
</div>

<?php
//include ('includes/js-includes.php');
?>
<script src="js/jquery3.1.1.js">      </script>
<!--
<script src="js/leafletjs0.7.3/leaflet.js"></script>
-->

<script src="js/looma-map-test.js"></script>          <!--  Javascript for this page-->
</body>
</html>
