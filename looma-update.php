<?php
require_once('includes/looma-isloggedin.php');

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = loggedIn(); if (!$loggedin || loginLevel() !== 'exec') header('Location: looma-login.php');
error_log("Starting Import Content session. logged in as: " . $loggedin);

?>

<!doctype html>
<!--
Filename: looma-update.php
Description: updates code or code+content, then reboots the system

Author: Skip
Owner:  Looma Education Company
Date:   2023
-->

<?php $page_title = 'Looma Update';
require_once ('includes/header.php');
?>
<link rel="stylesheet" href="css/looma-update.css">

</head>

<body>
<div id="main-container-horizontal">
    <h2 class="title">Looma Code and Content Update</h2>

    <p id="1" class="info"></p>
    <p id="2" class="info"></p>
    <p id="3" class="info"></p>
    <p id="4" class="info"></p>

    <fieldset id="radios">
        <legend>Include content files? <br> (Recommended, but takes much longer)</legend>

            <input type="radio" id="codeonly" name="code" value="code"  checked="checked"/>
            <label>No</label>

            <input type="radio" id="codeandcontent" name="code" value="code and content" />
            <label>Yes</label>
    </fieldset>

    <div id="button-div">
        <button id="network" class="buttons">Check Network Speed</button>
        <button id="update" class="buttons">Update</button>
        <button id="cancel" class="buttons">Cancel</button>
    </div>

    <div id="message-box">
        <p id="warning"></p>
        <p><span id="waiting"> Please wait </span><span id="ellipsis"></span></p>
    </div>

</div>

<?php

?>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-update.js"></script>

</body>
</html>
