<!doctype html>
<html>
    <?php $page_title = 'Looma - Lesson Plan editor';
          include ('includes/header.php');
          include ('includes/mongo-connect.php');
    ?>

    <head>
        <link rel="stylesheet" href="css/font-awesome.min.css">
        <link rel="stylesheet" type="text/css" href="css/looma-lesson-plan.css">
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

                        <input type="hidden" value="activities" name="collection" />
                        <input type="hidden" id="cmd" value="search" name="cmd" />

                    </form>
                </div>
            </div>
            <div id="container">
                <div id="titleDiv">
                </div>
                <div id="outerResultsDiv">
                    <div id="innerResultsMenu">
                    </div>
                    <div id="innerResultsDiv">
                    </div>
                </div>

                <div id= "displaybox">
                </div>

                <div id = "wrapper">
                    <div class="timelineEntire" id="timelineDisplay">
                    </div>
                </div>
            </div>
        </div>

<?php   include ('includes/js-includes.php');
?>
        <script src="js/jquery-ui.min.js">  </script>
        <script src="js/jquery.hotkeys.js"> </script>
        <script src="js/bootstrap.min.js">  </script>

<?php   include ('includes/looma-filecommands.php');
        include ('includes/looma-search.php');
?>
        <script type="text/javascript" src="js/looma-lesson-load.js"></script>
        <script type="text/javascript" src="js/looma-lesson-plan.js"></script>

    </body>
</html>


