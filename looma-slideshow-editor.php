<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Slideshow Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Filename: looma-editor-template.php
Description: template for Looma editor tools, like Lesson Plan Editor, Slideshow Editor, etc

Programmer name: Skip, Kiefer
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 3.0
 -->

<?php   $page_title = 'Looma Slideshow Editor';
        include ('includes/header.php');
?>

    <link rel = "Stylesheet" type = "text/css" href = "css/looma-search.css">
    <link rel = "Stylesheet" type = "text/css" href = "css/looma-filecommands.css">
    <link rel = "Stylesheet" type = "text/css" href = "css/looma-slideshow-editor.css">

</head>

<body>

    <div id="main-container">

        <div id="header" class="inner-div">
            <div id="title">Editing: <span class="filename">&lt;none&gt;</span> </div>
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>Looma Slideshow Editor</span>
        </div>

        <div id="search-bar" class="inner-div">
            <?php require_once ('includes/looma-search.php');?>
        		<button id="present-link">Present</button>
        </div>


        <div id="outerResultsDiv">
            <div id="innerResultsMenu"></div>
            <div id="results-div"></div>
            <div id="innerResultsDiv">
                <span class="hint">Search Results</span>
            </div>
        </div>
        <div id="previewpanel" class="inner-div">
            <div id = "preview"></div>
            <span class="hint">Slide Preview</span><br><br><br>
            <div id="hints">
                <br>
                <p class="hint">Use the Search criteria above to search for Activities.</p>
                <p class="hint">Preview and add an Activity from the search results.</p>
            </div>
        </div>

        <div id = "timeline">
            <div id="timelineDisplay" class="timelineCenter">
            </div>
        </div>
        <div id="timeline-data" hidden></div>

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

    <?php include ('includes/js-includes.php'); ?>

    <script src="js/jquery-ui.min.js"></script>
    <script src="js/jquery.hotkeys.js"></script>
    <script src="js/tether.min.js"></script>
    <script src="js/bootstrap.min.js"></script>

    <?php include ('includes/looma-filecommands.php');?>

    <script src="js/looma-media-controls.js"></script>
    <script src="js/looma-search.js"></script>
    <script src="js/looma-slideshow-editor.js"></script>
</body>
