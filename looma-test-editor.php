<!doctype html>
<!--
Filename: looma-xxx.php
Description: looma PHP template

Author: Skip
Owner:  Looma Education Company
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma Page Template';
require_once ('includes/header.php');
/* header.php imports: CSS: looma.css, looma-keyboard.css, bootstrap.css */
?>

<link rel="stylesheet" href="css/looma-test-editor.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <p id="guide"><----+----+----+----+----+----+----+----+----+----+----+----></p>
        <div id="editor">
            <input id="1" class="line">
            <input id="2" class="line">
            <input id="1" class="line">
            <input id="3" class="line">
            <input id="5" class="line">
            <input id="6" class="line">
            <input id="7" class="line">
            <input id="8" class="line">
            <input id="9" class="line">
            <input id="10" class="line">
            <input id="11" class="line">
            <input id="12" class="line">
            <input id="13" class="line">
        </div>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>      <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->

<script src="js/looma-test-editor.js"></script>          <!--  Javascript for this page-->
</body>
</html>
