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
            <span><img src="images/logos/LoomaLogoTransparent.png"></span>
            <h2>Template for making new Looma pages</h2>
            <button id="sample_button" class="activity img">
                <?php keyword("Sample Button");?>
                <img src="images/LoomaLogo.png"/>
            </button>
            <br><br><br>
            <input placeholder="example input..."></input>
            <?php include ('includes/looma-control-buttons.php');?>
        </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>      <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->

    <script src="js/looma-template.js"></script>          <!--  Javascript for this page-->
</body>
</html>
