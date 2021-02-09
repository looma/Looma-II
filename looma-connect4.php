<!doctype html>
<!--
Filename: looma-connect4.php
Date: AUG 2020
Description: looma connect 4

Author: Caroline
Owner:  VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 3
-->

<?php $page_title = 'Looma Connect Four';
require_once ('includes/header.php');
?>

<link rel="stylesheet" href="css/looma-connect4.css">

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

<script src="js/looma-connect4.js"></script>          <!--  Javascript for this page-->
</body>
</html>
