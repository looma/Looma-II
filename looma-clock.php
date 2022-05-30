<!doctype html>
<!--
Filename: looma-clock.php
Description: This is the main file of the looma time page.  It displays
a canvas for clock, which is controlled by a .js file: "JS/looma-clock.js",
which updates the clock every second and allows for dragging of the hands.

There are four buttons surrounding the clock, which link to other games and programs:
    1) looma-clock-single clock.php
    2) looma-clock-digitalclock.php
    3) looma-clock-doubleclock.php
    4) looma-clock-worldclocks.php
    5) looma-clock-oneclock.php

Programmer name: John Weingart and Grant Dumanian
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 7/11/2016
Revision: Looma 3
Comments:
-->

    <?php
        $page_title = 'Looma - Time';
        include ('includes/header.php');
    ?>

    <link rel="stylesheet" href="css/looma-clock.css">
</head>

<body>
    <div id="main-container-horizontal">
        <h1 id="title"> <?php keyword("Looma Clock")?></h1>
            <h1 class="credit">Created by Grant and John</h1>

            <FORM METHOD="LINK" ACTION="looma-clock-singleclock.php" id="singleClockButton">
                <button TYPE="submit"  id="a" class="clock-button">
                    <?php keyword("Clock Game") ?> <?php keyword("1")?>
                </button>
            </FORM>

            <FORM id="digitalClockButton">
                <button TYPE="button" id="b" class="clock-button"> <?php keyword("Digital Clock")?>
                </button>
            </FORM>

            <FORM id="analogClockButton">
                <button TYPE="button" id="b2" class="clock-button"> <?php keyword("Analog Clock")?>
                </button>
            </FORM>

            <FORM METHOD="LINK" ACTION="looma-clock-doubleclock.php" id="doubleClockButton">
                <button TYPE="submit" id="c" class="clock-button"><?php keyword("Clock Game")?> <?php keyword("2")?></button>
            </FORM>

            <FORM METHOD="LINK" ACTION="looma-clock-worldclocks.php" id="acrossWorldClocks">
                <button TYPE="submit" id="d" class="clock-button"><?php keyword("World Clocks")?></button>
            </FORM>

            <FORM id="oneClock">
                <button TYPE="button" id="clock-only"  class="clock-button looma-control-button"></button>
            </FORM>

            <FORM id="toCurrent">
                <button TYPE="button" id="toCurrentTime" class="clock-button">
                    <?php keyword("Show Current Time")?></button>
            </FORM>

            <FORM>
                <button TYPE="button" id="twentyFourHour" class="clock-button looma-control-button">
                    <?php keyword("24 Hour Time")?></button>
            </FORM>

        <div id="fullscreen">
            <canvas id="mainClock"></canvas>
            <?php include('includes/looma-control-buttons.php') ?>



        <div id="digitalDisplay">
            <span id = "digitalTime"></span>
            <span id = "amOrPm1" ></span>
        </div>


        <div id="clockBox">
            <span id="time"></span>
            <span id="amOrPm"></span>
            <span id="seconds"></span>
            <span id="day"></span>
            <span id="date"></span>
        </div>
        </div>
        <p id = "dragHands"> <?php keyword("Drag the clock hands to change the time") ?></p>
    </div>

    <?php
        include ('includes/toolbar.php');
        include ('includes/js-includes.php');
    ?>
    <script src="js/looma-clock.js"></script>
</body>
