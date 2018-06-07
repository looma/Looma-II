<!doctype html>
<!--
Filename: yyy.html
Date: 6/2015
Description: looma PHP template

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma Page Template';
    require_once ('includes/header.php');
    define ("CLASSES", 8);
?>

<link rel="stylesheet" href="css/looma-template.css">

</head>

<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">
            <span><img src="images/logos/LoomaLogoTransparent.png"></span>
            <h2>Template for making new Looma pages</h2>
            <input placeholder="example input..."></input>
            <?php include ('includes/looma-control-buttons.php');?>
        </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>


    <script src="js/looma-template.js"></script>          <!--  Javascript for this page-->
</body>
</html>
