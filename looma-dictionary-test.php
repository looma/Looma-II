<!doctype html>
<!--
Filename: yyy.html
Date: 6/2015
Description: looma PHP template

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma dictionary test ';
require_once ('includes/header.php');
define ("CLASSES", 8);
?>

<link rel="stylesheet" href="css/looma-dictionary-test.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <span><img src="images/logos/LoomaLogoTransparent.png"></span>
        <h2>dictionary test program</h2>
        <input id="word" placeholder="enter a word..."></input>
        <button id="lookup-button">look up</button>
        <br>
        <input id="count" name="count" type="number"value="5" min="1" max="25"></input>
        <button id="wordlist-button">word list</button>
        <button id="worddef-button">list definitions</button>
        <div id="wordlist-output"></div>
        <?php include ('includes/looma-control-buttons.php');?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>


<script src="js/looma-dictionary-test.js"></script>          <!--  Javascript for this page-->
</body>
</html>
