<!doctype html>
<!--
Filename: looma-sort-game.php
Description: looma sort game

Author: Skip
Owner:  Looma Education Company
Date:   2021
Revision: Looma 3
-->

<?php $page_title = 'Looma Sort Game';
require_once ('includes/header.php');
?>
<link rel="stylesheet" href="css/looma-sort-game.css">
</head>

<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">
            <div id="title"><h1>Sorting Game</h1></div>

            <div id="bins">
                <div class="bin_holder">
                    <p id="heading1" class="heading"></p>
                    <div id="bin1" class="bin"></div>
                </div>
                <div class="bin_holder">
                    <p id="heading2" class="heading"></p>
                    <div id="bin2" class="bin"></div>
                </div>
                <div class="bin_holder">
                    <p id="heading3" class="heading"></p>
                    <div id="bin3" class="bin"></div>
                </div>
            </div>

            <div id="words">
                    <p id="word" class="word"></p>
            </div>

            <button id="next_button" class="activity img">Play Again</button>

            <?php include ('includes/looma-control-buttons.php');?>
        </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/jquery-ui.min.js"></script>
    <script src="js/looma-sort-game.js"></script>
</body>
</html>
