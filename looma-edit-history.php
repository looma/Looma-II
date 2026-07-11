<?php
require_once('includes/looma-isloggedin.php');

// NOTE: this code sending "header" must be before ANY data is sent to client-side
$loggedin = loggedIn();
$level = isset($_COOKIE['login-level']) ? $_COOKIE['login-level'] : null;
if (!$loggedin) { header('Location: looma-login.php'); exit; }
// admin-control only: lock down to admin / exec (matches Resource & Dictionary editors)
if ($level !== 'admin' && $level !== 'exec') { header('Location: looma-home.php'); exit; }
error_log("Starting History Timeline Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Filename: looma-edit-history.php
Description: editor for user-created history timelines. Modeled on looma-edit-slideshow.php.
             Reads/writes ONLY the 'user_histories' collection; the curated, read-only
             'histories' collection (the 11 approved timelines) is never touched.

Owner: VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 7.x
 -->

<?php   $page_title = 'Looma History Timeline Editor';
        include ('includes/header.php');
?>

    <link rel = "Stylesheet" type = "text/css" href = "css/looma-search.css">
    <link rel = "Stylesheet" type = "text/css" href = "css/looma-filecommands.css">
    <link rel = "Stylesheet" type = "text/css" href = "css/looma-edit-history.css">

</head>

<body>

    <div id="main-container">

        <div id="header" class="inner-div">
            <div id="title">Editing: <span class="filename">&lt;none&gt;</span> </div>
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>Looma History Timeline Editor</span>
        </div>

        <div id="search-bar" class="inner-div">
            <?php require_once ('includes/looma-search.php');?>
            <button id="add-event">+ Add Event</button>
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
            <span class="hint">Activity Preview</span><br><br><br>
            <div id="hints">
                <br>
                <p class="hint">Use <b>File &rarr; New</b> to start a timeline, or <b>File &rarr; Open</b> to edit one of your own.</p>
                <p class="hint">Click <b>+ Add Event</b> to add events to the timeline below.</p>
                <p class="hint">To attach an activity to an event: click the event, search above, then click <b>Add</b>.</p>
            </div>
        </div>

        <div id = "timeline">
            <div id="timelineDisplay" class="timelineCenter">
            </div>
        </div>

            <button type="button" id="timelineLeft" class="timelineScroll"></button>
            <button type="button" id="timelineRight" class="timelineScroll"></button>

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
    <script src="js/looma-edit-history.js"></script>
</body>
</html>
