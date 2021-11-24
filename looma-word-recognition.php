
<!doctype html>
<!--
Filename: looma-xxx.php
Description: looma PHP template
Author: Skip
Owner:  Looma Education Company
Date:   2018
Revision: Looma 3
-->
<?php $page_title = 'Looma Word Recognition';
require_once ('includes/header.php');
?>
<link rel="stylesheet" href="css/looma-word-recognition.css">

</head>

<div id="main-container-horizontal">
    <div id="fullscreen">
        <h2>Looma Word Recognition</h2>
        <div id = "game" data-id="61107753d83e3eb35050a471"></div>
        <button id="nextWord" class="control"><?php  keyword("Start play"); ?></button>
        <button id="speakWord" class="control"><?php keyword("Repeat the word"); ?></button>
        <button id="newGame" class="control"><?php   keyword("Play again"); ?></button>
    </div>
</div>
<?php include ('includes/looma-control-buttons.php');?>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>      <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->
<script src="js/looma-word-recognition.js"></script>          <!--  Javascript for this page-->
</body>
</html>
