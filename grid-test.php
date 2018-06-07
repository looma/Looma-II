<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: index.php   [home page for Looma]
Description: displays all the classes and on-click, all the subjects, plus toolbar for other pages
-->

<?php $page_title = 'Looma Grid Page';
include ('includes/header.php');
//include ('includes/mongo-connect.php');

define ("CLASSES", 8);
?>

<style>
    body {background-color:pink;}
    #main-container{
        padding:2vh 2vh 2vh 2vh;
        display:grid;
        grid-gap:2vh;
        grid-template-columns: 33vw 64vw;
        grid-template-rows: 5vh 20vh 50vh 15vh;
        background-color:red;
    }
    #main-container > div {
        border-radius:4px;
        border: 2px solid blue;
        background-color: yellow;
        color:green;
    }
    #header {
        grid-column: 1/-1;
        grid-row: 1;
    }
    #search-bar {
        grid-column: 1/-1;
        grid-row: 2;
    }
    #results-div {
        grid-column: 1;
        grid-row: 3;
    }
    #preview-panel {
        grid-column: 2/-1;
        grid-row: 3;
    }
    #timeline {
        grid-column: 1/-1;
        grid-row: 4;
    }
</style>

</head>

<body>
<section>
    <div id="main-container">

        <img src="images/logos/LoomaLogoTransparent.png" class="looma-logo" width="75%"/>

        <div id="header" class="inner-div">header</div>
        <div id="search-bar" class="inner-div">search-bar</div>
        <div id="results-div" class="inner-div">results-div</div>
        <div id="preview-panel" class="inner-div">preview-p[anel</div>
        <div id="timeline" class="inner-div">timeline</div>
    </div>
</section>
<?php
//include ('includes/toolbar.php');
?>

<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-home.js"></script>          <!-- Looma Javascript -->
