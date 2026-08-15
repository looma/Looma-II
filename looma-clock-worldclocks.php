<!DOCTYPE html>

<!--
LOOMA php code file
Filename: looma-clock-worldclocks.php
Description: This file stores 8 canvases for 8 different cities across the world,
each displaying a clock.

Programmer name: John Weingart and Grant Dumanian
Email: jrweingart@gmail.com, grant.dumanian@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 7/11/2016
Revision: Looma 2.0.x
Comments:
-->

<?php
$page_title = 'Looma - Time';
    include ('includes/header.php');
    include ('includes/toolbar.php');
    include ('includes/js-includes.php');
?>
    <link rel="Stylesheet" type="text/css" href="css/looma-clock.css">
</head>

<body>
    <div id="main-container-horizontal" class="wc-page">

        <h1 id="header-row"> <?php keyword("Looma Clock") ?></h1><br>
        <h2 class = "credit"> <?php keyword("Clocks Around the World") ?></h2>


        <div id="clockrow1" class="clock-row">
            <div class="wc-clock">
                <div class="wc-name" id="nepal-name"></div>
                <canvas id="nepal" width="220" height="220"></canvas>
                <div class="wc-time" id="nepal-time"></div>
            </div>
            <div class="wc-clock">
                <div class="wc-name" id="tokyo-name"></div>
                <canvas id="tokyo" width="220" height="220"></canvas>
                <div class="wc-time" id="tokyo-time"></div>
            </div>
            <div class="wc-clock">
                <div class="wc-name" id="newYork-name"></div>
                <canvas id="newYork" width="220" height="220"></canvas>
                <div class="wc-time" id="newYork-time"></div>
            </div>
            <div class="wc-clock">
                <div class="wc-name" id="paris-name"></div>
                <canvas id="paris" width="220" height="220"></canvas>
                <div class="wc-time" id="paris-time"></div>
            </div>
        </div>
        <div id="clockrow2" class="clock-row">
            <div class="wc-clock">
                <div class="wc-name" id="london-name"></div>
                <canvas id="london" width="220" height="220"></canvas>
                <div class="wc-time" id="london-time"></div>
            </div>
            <div class="wc-clock">
                <div class="wc-name" id="sanFrancisco-name"></div>
                <canvas id="sanFrancisco" width="220" height="220"></canvas>
                <div class="wc-time" id="sanFrancisco-time"></div>
            </div>
            <div class="wc-clock">
                <div class="wc-name" id="moscow-name"></div>
                <canvas id="moscow" width="220" height="220"></canvas>
                <div class="wc-time" id="moscow-time"></div>
            </div>
            <div class="wc-clock">
                <div class="wc-name" id="cairo-name"></div>
                <canvas id="cairo" width="220" height="220"></canvas>
                <div class="wc-time" id="cairo-time"></div>
            </div>
        </div>

        <script src="js/looma-clock-worldclocks.js"></script>
    </div>
</body>
