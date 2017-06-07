<!doctype html>
<html>
    <?php $page_title = 'Looma - Lesson editor template';
          include ('includes/header.php');
          include ('includes/mongo-connect.php');

          if (!loggedin()) header('Location: looma-login.php');

    ?>

    <head>
        <link rel="stylesheet" href="css/font-awesome.min.css">
        <link rel="stylesheet" type="text/css" href="css/looma-editor-template.css">
    </head>

    <body>
        <div id = "main-container-horizontal">
            <div id="headerDiv">

                <div id="navbar">
                    <img id="logo" src="images/LoomaLogo.png">
                    <div id="titleString">
                    </div>
                </div>

                <div id="querybar">
                    <form id="search" name="search">
                        <input type="hidden" name="collection" value="activities" id="collection"/>
                        <input type="hidden" name="cmd"        value="search"     id="cmd" />
                    </form>
                </div>

            </div>

            <div id="container">
                <div id="titleDiv"></div>
                <div id="outerResultsDiv">
                    <div id="innerResultsMenu">
                    </div>
                    <div id="innerResultsDiv">
                    <span class="hint">Search Results</span>
                    </div>
                </div>

                <div id= "previewpanel">
                   <span class="hint">Preview Area</span>
                </div>

                <div id = "timeline">
                    <div class="timelineEntire" id="timelineDisplay">
                    <span class="hint">Timeline</span>
                    </div>
               </div>
            </div>
        </div>

<?php   include ('includes/js-includes.php');
?>
        <script src="js/jquery-ui.min.js">  </script>
        <script src="js/jquery.hotkeys.js"> </script>
        <script src="js/tether.min.js">  </script>
        <script src="js/bootstrap.min.js">  </script>

<?php   include ('includes/looma-filecommands.php');
        include ('includes/looma-search.php');
?>
       <script src="js/looma-media-controls.js"></script>
       <script src="js/looma-editor-template.js"></script>

    </body>
</html>


