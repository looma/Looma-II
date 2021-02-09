<!doctype html>
<!--
Filename: bagh-chal.php
Date: 5/18
Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Date:   2018
Revision: Looma 3
-->
<?php
$page_title = 'Looma Bagh Chal';
$prefix = "../Looma/";
require_once ($prefix . 'includes/header.php');
?>

<link rel="stylesheet" href="css/looma-bagh-chal.css">

</head>

<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">
        <span class="title"><?php keyword('Bagh Chal') ?></span>
            <div id="corral"></div>

            <div id="game">
                <img src="images/alquerque_board.png" id="alquerque">
            </div>

            <?php include ('includes/looma-control-buttons.php');?>
            <button id="info"></button>
            <button id="newgame">New Game</button>

            <button id="sign" disabled>Next turn: <img id="next"></img></button>
        </div>
    </div>

    <?php include ($prefix . 'includes/toolbar.php'); ?>
    <?php include ($prefix . 'includes/js-includes.php'); ?>

    <script src="js/jquery-ui.min.js">  </script>
    <script src="js/looma-bagh-chal.js"></script>
</body>
</html>
