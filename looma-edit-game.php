<?php
require_once('includes/looma-isloggedin.php');

$loggedin = loggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Game Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Filename: looma-edit-game.php
Description: Looma Game Editor
Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 06 2026
Revision: Looma 7
 -->

<?php   $page_title = 'Looma Game Editor';
        include ('includes/header.php');
?>

    <link rel="Stylesheet" type="text/css" href="css/looma-filecommands.css">
    <link rel="Stylesheet" type="text/css" href="css/looma-edit-game.css">

</head>

<body>

    <div id="main-container">

        <div id="header" class="inner-div">
            <div id="title">Editing: <span class="filename">&lt;none&gt;</span> </div>
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>Looma Game Editor</span>
        </div>

        <div id="game-properties" class="inner-div">
            <h3>Game Properties</h3>
            <div class="form-row">
                <label>Title:</label>
                <input type="text" id="game-title" placeholder="Game title">
            </div>
            <div class="form-row">
                <label>Language:</label>
                <select id="game-lang">
                    <option value="en">English</option>
                    <option value="np">Nepali</option>
                </select>
            </div>
            <div class="form-row">
                <label>Grade Low:</label>
                <select id="game-cl-lo">
                    <?php for($x = 1; $x <= 12; $x++) echo "<option value='$x'>$x</option>"; ?>
                </select>
                <label>Grade High:</label>
                <select id="game-cl-hi">
                    <?php for($x = 1; $x <= 12; $x++) echo "<option value='$x'>$x</option>"; ?>
                </select>
            </div>
            <div class="form-row">
                <label>Subject:</label>
                <select id="game-subject">
                    <option value="">Select...</option>
                    <option value="math">Math</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                    <option value="nepali">Nepali</option>
                    <option value="social studies">Social Studies</option>
                    <option value="health">Health</option>
                    <option value="serofero">Serofero</option>
                </select>
            </div>
            <div class="form-row">
                <label>Time Limit (sec):</label>
                <input type="number" id="game-timelimit" value="60" min="10" max="600">
            </div>
            <div class="form-row">
                <label>Presentation Type:</label>
                <select id="game-type">
                    <option value="">Select...</option>
                    <option value="matching">Matching</option>
                    <option value="concentration">Concentration</option>
                    <option value="multiple choice">Multiple Choice</option>
                    <option value="sort">Sort</option>
                </select>
            </div>
        </div>

        <div id="game-data" class="inner-div">
            <h3>Game Data</h3>
            <div id="game-data-area">
                <p class="hint">Select a Presentation Type to enter game data</p>
            </div>
        </div>

    </div>

    <?php include('includes/looma-control-buttons.php');?>
    <button class='control-button' id='dismiss' ></button>

    <?php include ('includes/js-includes.php'); ?>

    <script src="js/jquery-ui.min.js"></script>
    <script src="js/tether.min.js"></script>
    <script src="js/bootstrap.min.js"></script>

    <?php include ('includes/looma-filecommands.php');?>

    <script src="js/looma-edit-game.js"></script>
</body>
</html>
