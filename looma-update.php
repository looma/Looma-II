<?php
require_once('includes/looma-isloggedin.php');

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = loggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Attempting Looma update. logged in as: " . $loggedin);
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

    <br><br><br>
    <p id="1"></p>
    <p id="2"></p>
    <p id="3"></p>
    <br>

    <fieldset id="radios">
        <legend>Include content files? <br> (Recommended, but takes much longer)</legend>

            <input type="radio" id="codeonly" name="code" value=false  />
            <label>No</label>

            <input type="radio" id="codeandcontent" name="code" value=true />
            <label>Yes</label>
    </fieldset>

    <p id="warning"></p>
    <p id="waiting"> Please wait <span id="ellipsis"></span></p>

    <div id="button-div">
      <button id="submit">Submit</button>
      <button id="cancel">Cancel</button>
    </div>
</div>

<?php

      //  echo "<p class='waiting'>Updating Looma Code</p>";
      //  $result = shell_exec("echo 'updating code' | tee -a /tmp/mylog 2>/dev/null >/dev/null");

   // echo 'completed with result ' . $result;
   // exit;
?>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-update.js"></script>

</body>
</html>
