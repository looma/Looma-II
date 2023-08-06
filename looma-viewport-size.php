<!doctype html>
<!--
Filename: looma-viewport-size.php
Author: Skip
Owner:  Looma Education Company
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma Viewport Size';
require_once ('includes/header.php');
?>

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">

        <h2>Viewport width = <span id="width"></span></h2><br><br>
        <h2>Viewport height = <span id="height"></span></h2>

        <?php include ('includes/looma-control-buttons.php');?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>      <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->

<script src="js/looma-viewport-size.js"></script>          <!--  Javascript for this page-->
</body>
</html>
