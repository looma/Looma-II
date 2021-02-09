<!doctype html>
<!--
Filename: looma-life.php
Date: APR 2020
Description: looma game of life

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 3
-->

<?php $page_title = 'Looma Game of Life';
require_once ('includes/header.php');
?>

<link rel="stylesheet" href="css/looma-life.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <div id="world"> </div>
       <?php include ('includes/looma-control-buttons.php');?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-life.js"></script>          <!--  Javascript for this page-->
</body>
</html>
