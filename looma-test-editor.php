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
            <span class="number">1</span><input id="1" class="line"><br>
            <span class="number">2</span><input id="2" class="line"><br>
            <span class="number">3</span><input id="1" class="line"><br>
            <span class="number">4</span><input id="3" class="line"><br>
            <span class="number">5</span><input id="5" class="line"><br>
            <span class="number">6</span><input id="6" class="line"><br>
            <span class="number">7</span><input id="7" class="line"><br>
            <span class="number">8</span><input id="8" class="line"><br>
            <span class="number">9</span><input id="9" class="line"><br>
            <span class="number">10</span><input id="10" class="line"><br>
            <span class="number">11</span><input id="11" class="line"><br>
            <span class="number">12</span><input id="12" class="line"><br>
            <span class="number">13</span><input id="13" class="line">
        </div>
    </div>
</div>

<?php include ('includes/js-includes.php'); ?>      <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->

<script src="js/looma-test-editor.js"></script>          <!--  Javascript for this page-->
</body>
</html>
