<!doctype html>
<!--
Filename: looma-log-viewer.php

Author: Skip
Owner:  Looma Education Company
Revision: Looma 3
-->

<!--

NOTE: suggested enhancement: show number of unique viewers (IPs)
        cumulutive since start
        by year, or L12M, or YTD, etc
      in an info box on the Looma users map

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
        <div id="log-panel">
            <h2 id="title">Activity Log</h2>
            <div id="workspace">
                <!-- each canvas gets its own relatively-positioned box so Chart.js can size it responsively -->
                <div class="chart-box" id="linebox"><canvas id="linechart"></canvas></div>
                <div class="chart-box" id="barbox"><canvas id="barchart"></canvas></div>
            </div>
            <div id="linecontrols">
                <span class="radio"><input type="radio" id="hours" name="timeframe" value="hours">
                    <label for="hours">By hour</label></span>
                <span class="radio"><input type="radio" id="days" name="timeframe" value="days" checked>
                    <label for="days">By day</label></span>
                <span class="radio"><input type="radio" id="weeks" name="timeframe" value="weeks">
                    <label for="weeks">By week</label></span>
                <span class="radio"><input type="radio" id="months" name="timeframe" value="months">
                    <label for="months">By month</label></span>
                <span class="paging"><button id="prev">&#60; Previous</button><button id="next">Next &#62;</button></span>
            </div>
            <div id="barcontrols">
                <span class="radio"><input type="radio" id="pages" name="bartype" value="pages" checked>
                    <label for="pages">Pages Used</label></span>
                <span class="radio"><input type="radio" id="filetypes" name="bartype" value="filetypes">
                    <label for="filetypes">Filetypes Used</label></span>
            </div>
        </div>
        <div id="views">
            <button id="line">     <?php tooltip("Activity") ?>  </button>
            <button id="bar">      <?php tooltip("Usage") ?>     </button>
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
