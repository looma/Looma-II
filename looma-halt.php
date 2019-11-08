<!doctype html>
<!--
Filename: looma-halt.php
Date: Nov 2019
Description: looma PHP template

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 5.4
-->

<?php $page_title = 'Looma Halt';
require_once ('includes/header.php');
?>

<link rel="stylesheet" href="css/looma-template.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <span><img src="images/logos/LoomaLogoTransparent.png"></span>
        <h2>Looma Halt Page</h2><br>
        <h3>This page will halt Looma and open the Linux Desktop</h3>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-halt.js"></script>
</body>
</html>
