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

<link rel="stylesheet" href="css/looma-template.css">
<link rel="stylesheet" href="css/color-test.css">

</head>

<body>
<div id="main-container-horizontal" style="color:black;">

    <div class="blinking"></div>
 <!--
    <div style="display:inline-block;background-color:#83ffb1;height:20vh;width:10vw;">#83ffb1</div>
    <div style="display:inline-block;background-color:#ffa7be;height:20vh;width:10vw;">#ffa7be</div>
    <div style="display:inline-block;background-color:#69ddff;height:20vh;width:10vw;">#69ddff</div>
    <div style="display:inline-block;background-color:#FDFD96;height:20vh;width:10vw;">#ffd1e3</div>

    <div style="display:inline-block;background-color:#DFB9FF;height:20vh;width:10vw;">#DFB9FF</div>
    <div style="display:inline-block;background-color:#ffdb99;height:20vh;width:10vw;">#ffdb99</div>
    <div style="display:inline-block;background-color:#bbffff;height:20vh;width:10vw;">#bbffff</div>
 -->

</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>      <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->

<script src="js/looma-template.js"></script>          <!--  Javascript for this page-->
</body>
</html>
