<!doctype html>
<!--
Filename: looma-editor-template.php
Description: template for Looma editor tools, like Lesson Plan Editor, Slideshow Editor, etc

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 3.0
 -->

<?php   $page_title = 'Looma <template> Editor';
        include ('includes/header.php');
        if (!loggedin()) header('Location: looma-login.php');
?>

    <link rel = "Stylesheet" type = "text/css" href = "css/looma-editor-template.css">

</head>

<body>

<section>
    <div id="main-container">

        <div id="header" class="inner-div">
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>Looma Editor Template</span>
        </div>

        <div id="search-bar" class="inner-div">
            <?php require_once ('includes/looma-search.php');?>
        </div>

        <div id="outerResultsDiv">
            <div id="innerResultsMenu"></div>
            <div id="results-div"></div>
            <div id="innerResultsDiv">
                <span class="hint">Search Results</span>
            </div>
        </div>
        <div id="previewpanel" class="inner-div">
            <span class="hint">Preview Area</span><br><br><br>
            <div id="hints">
                <br>
                <p class="hint">1. Use the Search criteria above to search for Activities </p>
                <p class="hint">2. Preview and Select an Activity from the search results</p>
                <p class="hint">3. Add buttons to process the selected activities</p>
            </div>
        </div>


        <div id = "timeline">
            <div class="timelineCenter" id="timelineDisplay">
                <span class="hint">Timeline</span>
            </div>
        </div>

            <button type="button" id="timelineLeft" class="timelineScroll"></button>
            <button type="button" id="timelineRight" class="timelineScroll"></button>

    </div>

    <!-- new iFrame June 2017 - used to open the text-editor iFrame when called from another editor, e.g. lesson plan
        initially hidden by CSS, shown when New Text File button in filecommands.js is clicked  -->
    <div id="text-editor">
        <iframe id="textframe" src="./looma-text-frame.php" allowTransparency="true"> </iframe>
    </div>


    <?php   include('includes/looma-control-buttons.php');?>
    <button class='control-button' id='dismiss' ></button>

</section>

    <?php include ('includes/js-includes.php'); ?>

    <script src="js/jquery-ui.min.js"></script>
    <script src="js/jquery.hotkeys.js"></script>
    <script src="js/tether.min.js"></script>
    <script src="js/bootstrap.min.js"></script>

    <?php include ('includes/looma-filecommands.php');?>

    <script src="js/looma-media-controls.js"></script>
    <script src="js/looma-search.js"></script>
    <script src="js/looma-editor-template.js"></script>
<!--    <script src="js/looma-lesson-plan.js"></script> -->

