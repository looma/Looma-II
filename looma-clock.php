<!doctype html>
<!--
LOOMA php code file
Filename: looma-time.php
Description: This is the main file of the looma time page.  It stores
a canvas for clock, which is controlled by a .js file: "JS/looma-mainclock.js",
which updates the clock every second and allows for dragging of the hands.
There are four buttons surrounding the clock, which link to other games and programs:
1) looma-clock-single clock.php
2) looma-clock-digitalclock.php
3) looma-clock-doubleclock.php
4) looma-clock-worldclocks.php
5) looma-clock-oneclock.php

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
<head>
    
<link rel="Stylesheet" type="text/css" href="css/looma-clock.css">
    
</head>

<body>
<div id="main-container-horizontal">
<h1>Looma Clock</h1>
<h2 class = "credit">Created by Grant and John</h2>

<FORM METHOD="LINK" ACTION="looma-clock-singleclock.php" Id="singleClockButton">
    <button TYPE="submit" class="button-2" id="a">
        <?php keyword("Clock Game") ?> <?php keyword("1")?>
    </button>
</FORM>
      
<FORM Id="digitalClockButton">
    <button TYPE="button" id="b"> <?php keyword("Digital Clock")?>
    </button>
</FORM>

<FORM Id="analogClockButton">
    <button TYPE="button" id="b2"> <?php keyword("Analog Clock")?>
    </button>
</FORM>

<FORM METHOD="LINK" ACTION="looma-clock-doubleclock.php" Id="doubleClockButton">
    <button TYPE="submit" id="c"><?php keyword("Clock Game")?> <?php keyword("2")?></button>
</FORM>

<FORM METHOD="LINK" ACTION="looma-clock-worldclocks.php" Id="acrossWorldClocks">
    <button TYPE="submit" id="d"><?php keyword("World Clocks")?></button>
</FORM>

<FORM Id="oneClock">
    <button TYPE="button" id="e"><img src="images/clock.png" id = "clockImage"></button>
</FORM>

<FORM>
    <button TYPE="button" id="toCurrentTime"><?php keyword("To Current Time")?></button>
</FORM>

<FORM>
    <button TYPE="button" id="twentyFourHour"><?php keyword("24 Hour Time")?></button>
</FORM>

<canvas id="mainClock">
</canvas>

<script src="js/jquery.min.js"></script>
<script src="js/looma-utilities.js"></script>
<script src="js/looma-clock.js"></script>

</div>

<p id = "digitalTime"></p>
<p id = "amOrPm1" ></p>
<p id = "dragHands">Drag and drop the hour or minute hand!</p>
<p id="time"></p>
<p id="amOrPm"></p>
<p id="seconds"></p>
<p id="day"></p>
<p id="date"></p>
<div id="clockBox"></div>

        <button class="speak"></button>

</body>