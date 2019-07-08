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
<head>
<link rel="Stylesheet" type="text/css" href="css/looma-clock.css">

</head>

<body>
    <div id="main-container-horizontal">

        <h1> <?php keyword("Looma Clock") ?></h1>
        <h2 class = "credit"> <?php keyword("Clocks Around the World") ?></h2>


        <canvas id="nepal" width="220" height="220">
        </canvas>
        <canvas id="tokyo" width="220" height="220">
        </canvas>
        <canvas id="newYork" width="220" height="220">
        </canvas>
        <canvas id="paris" width="220" height="220">
        </canvas>
        <canvas id="london" width="220" height="220">
        </canvas>
        <canvas id="sanFrancisco" width="220" height="220">
        </canvas>
        <canvas id="moscow" width="220" height="220">
        </canvas>
        <canvas id="cairo" width="220" height="220">
        </canvas>

        <script src="js/looma-clock-worldclocks.js"></script>
    </div>
</body>
