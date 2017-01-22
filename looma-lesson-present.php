<!doctype html>
<!--
Author:
Email: skip@stritter.com
Filename: looma-lesson-present.php
Date: 6/2015
Description:
-->
    <?php $page_title = 'Looma Lesson Plan Presenter ';
          //include ('includes/header.php');
    ?>

  </head>

<html>
    <head>
        <link rel="stylesheet" type="text/css" href="css/looma-lesson-plan.css">
        <link rel="stylesheet" type="text/css" href="css/looma-lesson-present.css">
    </head>

    <body>
        <div id="navbar">
            <img id="logo" src="images/LoomaLogo.png">
            <p>Lesson Plan Creator: Present</p>
            <button type="button" id="btnOpen" onclick="location.href='looma-lesson-open.html';">Open</button>
            <button type="button" id="btnEdit" onclick="location.href='looma-lesson-plan.html';">Edit</button>
        </div>

        <div id="container">
            <div id= "displaybox"></div>
            <br/>
            <div id = "presentwrapper">
                <div class="timeline" id="timelineDisplay">

                </div>
            </div>
            <br/>
        </div>
    </body>

    <script src="js/jquery.min.js"></script>
    <script src="js/jquery-ui.min.js"></script>

    <script type="text/javascript" src="js/looma-lesson-load.js"></script>
    <script type="text/javascript" src="js/looma-lesson-present.js"></script>

</html>
