<!doctype html>
<html>
    <?php $page_title = 'Looma - Register Lesson to Chapter';
          include ('includes/header.php');
          //include ('includes/mongo-connect.php');

          if (!loggedin()) header('Location: looma-login.php');
    ?>

        <link rel="stylesheet" href="css/font-awesome.min.css">
        <link rel="stylesheet" type="text/css" href="css/looma-activity-register-to-chapter.css">
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
                        <input type="hidden" value="lessons" name="collection" />
                        <input type="hidden" id="cmd" value="search" name="cmd" />
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
                    <span class="hint">Preview</span>
                </div>

                <div id = "timeline">
                    <div class="timelineEntire" id="timelineDisplay">
                        <br>
                    </div>
               </div>

               <div id="hints">
                   <p class="hint">1. Use the Search criteria above to search for Activities </p>
                   <p class="hint">2. Preview and Select an Activity from the search results</p>
                   <p class="hint">3. Click "Show Details" to attach the Activity to a Chapter</p>
               </div>

               <div id="activity-controls">
                    <button id="rename"   class="control">  Rename    </button>
                    <button id="unassign" class="control">  Un-assign from this chapter</button>
                    <button id="assign" class="control">  Assign to another chapter  </button>
                    <button id="cancel" class="control">  Cancel   </button>
                </div>

            </div>
        </div>

<?php   include ('includes/js-includes.php');
?>
        <script src="js/jquery-ui.min.js">  </script>
        <script src="js/jquery.hotkeys.js"> </script>
        <script src="js/tether.min.js">  </script>
        <script src="js/bootstrap.min.js">  </script>

<?php
        //include ('includes/looma-filecommands.php');
        include ('includes/looma-search.php');
?>
       <script src="js/looma-lesson-register-to-chapter.js"></script>

    </body>
</html>


