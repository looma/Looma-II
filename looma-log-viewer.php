<!doctype html>
<!--
Filename: looma-log-viewer.php

Author: Skip
Owner:  Looma Education Company
Revision: Looma 3
-->

<?php $page_title = 'Looma Log Viewer';
require_once ('includes/header.php');
/* header.php imports: CSS: looma.css, looma-keyboard.css, bootstrap.css */
?>

<link rel="stylesheet" href="css/looma-log-viewer.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <h2 id="title">Activity Log</h2>
        <div id="workspace">
            <canvas id="linechart"></canvas>
            <canvas id="barchart"></canvas>
            <canvas id="mapchart"></canvas>
        </div>
        <div id="linecontrols">
            <input type="radio" id="hours" name="timeframe" value="hours" >
            <label for="hours">By hour</label>
            <input type="radio" id="days" name="timeframe" value="days" checked>
            <label for="days">By day</label>
            <input type="radio" id="weeks" name="timeframe" value="weeks">
            <label for="months">By week</label>
            <input type="radio" id="months" name="timeframe" value="months">
            <label for="months">By month</label>
            <span><button id="prev">Previous &#60;</button><button id="next">Next &#62;</button></span>
        </div>
        <div id="barcontrols">
            <input type="radio" id="pages" name="bartype" value="pages" checked>
            <label for="pages">Pages Used</label>
            <input type="radio" id="filetypes" name="bartype" value="filetypes">
            <label for="filetypes">Filetypes Used</label>
        </div>
        <div id="views">
                <button id="line"> <?php tooltip("Activity") ?>  </button><br>
            <button id="bar">      <?php tooltip("Usage") ?>     </button><br>
            <button id="map">      <?php tooltip("Locations") ?> </button>
        </div>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/chartjs/chart.min.js"></script>
<script src="js/looma-log-viewer.js"></script>
</body>
</html>
