<!doctype html>
<!--
Filename: looma-test.php
Date: Nov 2019
Description: looma PHP template

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 5.4
-->

<?php $page_title = 'Looma Test Shell Commands';
require_once ('includes/header.php');
?>

<link rel="stylesheet" href="css/looma-template.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <span><img src="images/logos/LoomaLogoTransparent.png"></span>
        <h2>Looma Shell Cmd Test Page</h2><br>
        <form id="exec">
            <?php keyword("Enter shell command"); ?>
            <input type="text"  id="input" autofocus autocomplete="off">
            <button type="submit" id="submit" value="submit"> <?php keyword("Submit"); ?> </button>
        </form>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-shell-cmd
.js"></script>
</body>
</html>
