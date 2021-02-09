<!doctype html>
<!--
Name: Bo, Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 summer
Revision: Looma 2.0.0
File: looma-library-search.php
Description:  searches Looma library for Looma 2
-->

<?php $page_title = 'Looma Library';
require_once ('includes/header.php');
require_once ('includes/mongo-connect.php');
require_once ('includes/looma-utilities.php');
include("includes/looma-control-buttons.php");
?>

<!--<link rel = "Stylesheet" type = "text/css" href = "css/looma-search.css">--->
<link rel = "Stylesheet" type = "text/css" href = "css/looma-library-search.css">
</head>

<body>
<div id="main-container-horizontal" class="scroll">

    <?php
    require_once ('includes/looma-search.php');

    /*********** Search Results ***********/
    echo "<div id='results-div'></div>";

    echo "<button id='more'>";
    keyword("More results");
    echo "</button>";
    echo "<button id='top'>";
    keyword("^Top");
    echo "</button>";

    echo "<button id='toggle-database' class='toggle black-border big-show'>";
        echo "<img draggable='false' src='images/library.png'>";
        tooltip("Library Folders");
    echo "</button>"; ?>

    <h1 class = "credit">Created by Bo</h1>

</div>

<?php include ('includes/toolbar.php');
include ('includes/js-includes.php'); ?>

<!--<script src="js/jquery-ui.min.js"></script>-->
<script src="js/looma-search.js"></script>
<script src="js/looma-library-search.js"></script>
<!--<script src="js/bubble_cursor.js"></script>-->

</body>
