<!doctype html>
<!--
LOOMA php code file
Filename: looma-text-scam.php
Description:

Programmer name: skip
Owner: Looma Education
Date:
Revision:

Comments: internal use page for sequencing through and examining text files
-->

<?php $page_title = 'Looma - Text Scan';
include ('includes/header.php');
?>
<link rel="stylesheet" href="css/looma-text-scan.css">
<link rel="stylesheet" href="css/looma-text-display.css">
</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <div id="filterdiv">
            <input id="filterterm" placeholder="enter a chapter ID"></input>
            <button id="filter">Filter</button>
        </div>
        <div id="legend">
            <span id="dn"></span>
            <button id="edit">Edit</button>
        </div>
        <div id="text">
            <div id="text-display" class="text-display"></div>
        </div>
        <button class = "lookup"></button>
        <button class="speak looma-control-button"></button>
        <button id="fullscreen-control" class="looma-control-button"></button>
        <button id="next">Next</button>
        <button id="prev">Prev</button>
        <button id="plus10">+10</button>
        <button id="minus10">-10</button>
    </div>
</div>

<?php
include ('includes/toolbar.php');
include ('includes/js-includes.php');
?>
<script src="js/looma-text-scan.js"></script>
</body>
