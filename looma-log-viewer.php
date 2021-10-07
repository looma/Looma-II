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
        <h2>Looma Activity Log</h2>
        <canvas id="chart"></canvas>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/chartjs/chart.min.js"></script>
<script src="js/looma-log-viewer.js"></script>
</body>
</html>
