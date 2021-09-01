<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Activity Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Filename: looma-edit-keywords.php

Programmer name: Skip
Date: aug 2020
Revision: Looma 3.0
 -->

<?php   $page_title = 'Looma Keyword Editor';
include ('includes/header.php');
?>
<link rel = "Stylesheet" type = "text/css" href = "css/looma-edit-keywords.css">
</head>

<body>
    <div id="main-container">

        <div id="header" class="inner-div">
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>Looma Keyword Editor</span>
        </div>

        <div id="search-bar" class="inner-div">
            <?php require_once ('includes/looma-search.php');?>
        </div>

        <div id="spacer"></div>

        <div id="formpanel" >
            <form id='changes' name='changes'>
                <?php
                /*****************************************/
                /*********** Keyword Dropdowns  **********/
                /*****************************************/
                echo "<div id='keyword-changes' class='keyword-filter media-filter'>";

                // get the ROOT document of the TAGs collection
                $query = array('name' => 'root', 'level' => 0);
                $root = $tags_collection -> findOne($query);

                echo "<span id='keyword-changes-menu' >
                    <span class='label'>Keywords:</span>
                    <select name='key1' id='key1-changes-menu' class='media-filter  keyword-changes keyword-dropdown black-border' data-level=1 form='changes'>
                        <option value=''>Select keyword...</option>";

                for($x = 0; $x < sizeof($root['children']); $x++) {
                    $y = $root['children'][$x]['name'];
                    $z = $root['children'][$x]['kids'];
                    echo "<option value='" . $y . "' id='" . $y . "' data-kids='" . $z. "'>" . $y . "</option>";
                }
                echo "</select>";

                echo "<select name='key2' disabled id='key2-changes-menu' class='media-filter keyword-changes keyword-dropdown black-border' data-level=2 form='changes'>
                                <option value='' selected></option>";
                echo "</select>";

                echo "<select name='key3' disabled id='key3-changes-menu' class='media-filter  keyword-changes keyword-dropdown black-border' data-level=3 form='changes'>
                                            <option value='' selected></option>";
                echo "</select>";

                echo "<select name='key4' disabled id='key4-changes-menu' class='media-filter  keyword-changes keyword-dropdown black-border' data-level=4 form='changes'>
                                            <option value='' selected></option>";
                echo "</select>";

                echo "</span>";
                echo "<button class='chng-clear' id='keyword-clear'>X</button>";

                echo "</div>";

                ?>

            <div><span class="label">New keyword:</span>
                <input id='key1-change' data-key="key1" disabled class='media-filter key-change'  type='text'></input>
                <input id='key2-change' data-key="key2"  disabled class='media-filter key-change'  type='text'></input>
                <input id='key3-change' data-key="key3"  disabled class='media-filter key-change'  type='text'></input>
                <input id='key4-change' data-key="key4" disabled class='media-filter key-change'  type='text'></input>
                <button class='chng-clear' id='new-keyword-clear'>X</button>
            </div>

            <button id="submit-changes" class="edit-control">Submit</button>

            </form>

            <div id="hints">
                <br>
                <p class="hint">Select the keyword sequence you want to add a keyword to</p>
                <p class="hint">   for instance, if you want to add Mathematics > Algebra > Non-linear</p>
                <p class="hint">   then select "Mathematics" and "Algebra" </p>
                <p class="hint">   then, in the "New keyword" input, type "Non-linear"</p>
                <p class="hint">   and click "Submit"</p>
            </div>
        </div>

    </div>

    <img id="padlock"
         draggable="false"
         src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >
    <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>

    <?php   include('includes/looma-control-buttons.php');?>
    <button class='control-button' id='dismiss' ></button>

<?php include ('includes/js-includes.php'); ?>

<script src="js/jquery-ui.min.js"></script>
<script src="js/jquery.hotkeys.js"></script>

<script src="js/looma-search.js"></script>
<script src="js/looma-edit-keywords.js"></script>

