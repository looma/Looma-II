<!doctype html>
<!--
LOOMA php code file
Filename: looma-clock-stopwatch.php
Description: A stopwatch and a countdown timer for the Looma clock page.
             The teacher toggles between "Stopwatch" and "Timer" modes.
             Timer duration is set with preset minute buttons (1/5/10/30)
             plus -/+ to fine-tune. At zero the display flashes (silent).
             Logic lives in js/looma-clock-stopwatch.js
Owner: Looma Education
Revision: Looma 7
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
    <div id="main-container-horizontal" class="sw-page">
        <h1><?php keyword("Looma Clock") ?></h1>
        <h2 class="credit"><?php keyword("Stopwatch") ?> &amp; <?php keyword("Timer") ?></h2>

        <!-- mode toggle: Stopwatch | Timer -->
        <div id="sw-mode-toggle">
            <button type="button" id="sw-mode-stopwatch" class="clock-button sw-mode-button active"><?php keyword("Stopwatch") ?></button>
            <button type="button" id="sw-mode-timer" class="clock-button sw-mode-button"><?php keyword("Timer") ?></button>
        </div>

        <!-- big time readout (JS fills this in) -->
        <div id="sw-display">00:00.00</div>

        <!-- timer duration setup (shown only in Timer mode) -->
        <div id="sw-timer-setup">
            <div id="sw-timer-presets">
                <button type="button" class="clock-button sw-preset-button" data-min="1">1</button>
                <button type="button" class="clock-button sw-preset-button" data-min="5">5</button>
                <button type="button" class="clock-button sw-preset-button" data-min="10">10</button>
                <button type="button" class="clock-button sw-preset-button" data-min="30">30</button>
            </div>
            <div id="sw-timer-adjust">
                <button type="button" id="sw-minus" class="clock-button sw-adjust-button">&minus;</button>
                <span id="sw-timer-set-label"><?php keyword("Minutes") ?></span>
                <button type="button" id="sw-plus" class="clock-button sw-adjust-button">+</button>
            </div>
        </div>

        <!-- start / reset -->
        <div id="sw-controls">
            <button type="button" id="sw-startStop" class="clock-button">Start</button>
            <button type="button" id="sw-reset" class="clock-button"><?php keyword("Reset") ?></button>
        </div>

        <script src="js/looma-clock-stopwatch.js"></script>
    </div>
</body>
