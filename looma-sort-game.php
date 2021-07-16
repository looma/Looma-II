<!doctype html>
<!--
Filename: looma-sort-game.php
Description: looma sort game

Author: Skip
Owner:  Looma Education Company
Date:   2021
Revision: Looma 3
-->

<?php $page_title = 'Looma Page Template';
require_once ('includes/header.php');
?>

<link rel="stylesheet" href="css/looma-sort-game.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <h1>Sorting Game</h1>

        <div id="headings">
            <span class="heading">heading</span>
            <span class="heading">heading</span>
            <span class="heading">heading</span>
            <br>
        </div>
        <div id="bins">
            <div class="bin"></div>
            <div class="bin"></div>
            <div class="bin"></div>
        </div>
        <button id="word" class="activity img">
            <?php keyword("word here");?>
        </button>
       <button id="next_button" class="activity img">
           <img src="images/carrot-fwd.png">
        </button>

        <?php include ('includes/looma-control-buttons.php');?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/jquery-ui.min.js"></script>
<script src="js/looma-sort-game.js"></script>
</body>
</html>
