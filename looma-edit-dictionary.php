<?php
//function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};
require_once('includes/looma-isloggedin.php');
// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = loggedin(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Lesson Plan Edit session. logged in as: " . $loggedin);
?>


<!--
Filename: looma-edit-dictionary.php
Description: editor for dictionary

Programmer name: Skip, Charlotte
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: June 2021
Revision: Looma 6.4
 -->

<?php $page_title = 'Looma Dictionary Editor';
include ('includes/header.php');

include ('looma-database-utilities.php');




?>
<link rel = "Stylesheet" type = "text/css" href = "css/looma-edit-dictionary.css">
</head>
<body>
<div id="main-container-horizontal">

        <!-- where the user inputs a word -->
        <form id="lookup">
            <span id="title">Looma Dictionary Editor</span>
            <button type="submit" id="addButton"         class="editButton">Add new word</button>
            <div><?php keyword("Enter word"); ?>
                <br>
                <input type="text"  id="input" autofocus autocomplete="off">
                <button type="submit" id="submit" value="submit"> <?php keyword("Search"); ?> </button>
                <button type="click"  id="in_chapButton"     class="editButton">Show in chapter</button>
                <button type="submit" id="suggestionsButton" class="editButton">Show suggested definitions</button>
            </div>
        </form>

        <!-- where the information about the word is displayed -->
        <div id="word">
            <div class="titles">English</div>
            <div class="titles">Nepali</div>
            <div class="titles">Root</div>
            <div class="titles">Plural</div>
            <div class="titles">Chapter ID's</div>
        </div>

        <div id="definitions">
            <div class="row>">
                <div class="titles">Part</div>
                <div class="titles">Definition</div>
            </div>
        </div>

        <!-- where the suggested definitions are displayed -->
        <div id="suggestions">
            <div class="titles">Part</div>
            <div class="titles">Definition</div>

        </div>

        <div id = "chap_div">
            <button id = "chap_escape_button">X</button>
            <iframe id = "chap_iframe"></iframe>
        </div>

    <button class='control-button' id='dismiss'></button>
    <div id="modified"></div>
    <button id='instructions'><img src="images/info.png"></button>
    <?php include ('includes/looma-control-buttons.php');?>

</div>

<?php include ('includes/js-includes.php'); ?>

<script src="js/jquery-ui.min.js"></script>
<script src="js/jquery.hotkeys.js"></script>
<script src="js/tether.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<script src = "js/looma-edit-dictionary.js"></script>



</body>
</html>
