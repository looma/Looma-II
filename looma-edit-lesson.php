<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Lesson Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Filename: looma-lesson-edit-lesson.php
Description: version 1 [SCU, Spring 2016]
             version 2 [skip, Fall 2016]
Programmer name: SCU, skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: version 1:spring 2016, version 2: Nov 16  version 3: spring 2018
Revision: Looma 4
 -->
    <?php $page_title = 'Looma - Lesson Editor';
          include ('includes/header.php');
          //include ('includes/mongo-connect.php');
    ?>

        <link rel="stylesheet" href="css/font-awesome.min.css">
        <link rel="stylesheet" type="text/css" href="css/looma-filecommands.css">
        <link rel="stylesheet" type="text/css" href="css/looma-edit-lesson.css">
        <link rel="stylesheet" href="css/looma-text-display.css">
    </head>

    <body>
        <div id = "main-container">

            <div id="header" class="inner-div">
                <div id="title">Editing: <span class="filename">&lt;none&gt;</span> </div>
                <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
                <span>Looma Lesson Editor</span>
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

            <div id= "previewpanel">
               <span class="hint">Preview Area</span>
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

        <!-- new iFrame June 2017 - used to open the text-editor iFrame when called from in another editor, e.g. lesson
            initially hidden by CSS, shown when New Text File button in filecommands.js is clicked  -->
        <div id="text-editor">
            <iframe id="textframe" src="./looma-text-frame.php" allowTransparency="true"> </iframe>
        </div>

        <img id="padlock"
             draggable="false"
             src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >

        <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>

        <?php   include('includes/looma-control-buttons.php');?>
        <button class='control-button' id='dismiss' ></button>

    <?php
        include ('includes/js-includes.php');
        include ('includes/looma-filecommands.php');
    ?>

        <script src="js/jquery-ui.min.js">  </script>
        <script src="js/jquery.hotkeys.js"> </script>
        <script src="js/tether.min.js">  </script>
        <script src="js/bootstrap.min.js">  </script>
        <script src="js/looma-search.js"></script>
        <script src="js/looma-media-controls.js"></script>
        <script src="js/looma-edit-lesson.js"></script>

    </body>
</html>


