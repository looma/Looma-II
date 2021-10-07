<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Dictionary Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
    <?php $page_title = 'Looma - Video Editor';
          include ('includes/header.php');
    ?>
        <link rel="stylesheet" href="css/font-awesome.min.css">
        <link rel="stylesheet" type="text/css" href="css/looma-filecommands.css">
        <link rel="stylesheet" type="text/css" href="css/looma-media-controls.css">
        <link rel="stylesheet" type="text/css" href="css/looma-edit-video.css">
        <link rel="stylesheet" href="css/looma-text-display.css">
    </head>

    <body>
        <div id = "main-container">

            <div id="header" class="inner-div">
                <span id="title">Editing: </span>  <span class="filename">&lt;none&gt;</span>
                <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
                <span>Looma Video Editor</span>
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
                    <div id="video-area">
                        <div id="video-screen"></div>
                        <?php include ("includes/looma-media-controls.php");?>

                        <div id="adjust" draggable="true">
                            <button class="adjust" id="frameMinus5">-5</button> <button class="adjust" id="frameMinus1">-1</button>
                            <span>frame&nbsp;&nbsp;</span>
                            <button class="adjust" id="frameAdd1">+1</button> <button class="adjust" id="frameAdd5">+5</button>
                            <br>
                            <button class="adjust" id="secMinus5">-5</button>   <button class="adjust" id="secMinus1">-1</button>
                            <span>second</span>
                            <button class="adjust" id="secAdd1">+1</button>   <button class="adjust" id="secAdd5">+5</button>
                        </div>
                    </div>
                    <div id= "preview-area">
                        <div id="preview-screen"></div>
                    </div>
                    <button id = "clearPreview" type = "button">Clear Preview</button>
                </div>


                <div id="timeline">
                    <div id="timelineDisplay"></div>
                </div>
            </div>

        <div id="text-editor">
            <iframe id="textframe" src="./looma-text-frame.php" allowTransparency="true"> </iframe>
        </div>

        <img id="padlock" draggable="false" src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >
        <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>

        <button class='control-button' id='dismiss' ></button>

    <?php
        include ('includes/js-includes.php');
        include ('includes/looma-filecommands.php');
    ?>

        <script src="js/jquery-ui.min.js">  </script>
        <script src="js/jquery.hotkeys.js"></script>
        <script src="js/tether.min.js"></script>
        <script src="js/bootstrap.min.js"></script>
        <script src="js/looma-search.js"></script>
        <script src="js/looma-media-controls.js"></script>
        <script src="js/looma-edit-video.js"></script>

    </body>
</html>


