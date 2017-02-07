<!doctype html>
<!--
Author: Skip
Filename: looma-lesson-present.php
Date: 02/2017
Description: looma lesson plan presenter

-->
	<?php $page_title = 'Looma Lesson Presenter ';
          include ('includes/header.php');
          require ('includes/mongo-connect.php');
          include ('includes/activity-button.php'); ?>

    <link rel="stylesheet" href="css/looma-lesson-present.css">

  </head>

  <body>
    <?php
        //Gets the filename, filepath, and the thumbnail location
        if (isset($_REQUEST['id'])) $lesson_id = $_REQUEST['id'];

    //echo 'lesson id is ' . $lesson_id;

    ?>


    <script>
        //send "id" parameter to client-side JS
        var lesson_id = "<?php echo $lesson_id ?>";
    </script>

    <div id="main-container-horizontal">
        <div id="fullscreen">
            <div id="viewer">
            </div>
        </div>
        <div id="timeline" >

        <span>Timeline: </span><span class="filename"></span>
    <?php
        //look up the lesson plan in mondo lessons collection
        //send DN, AUTHOR and DATE in a hidden DIV
        //for each ACTIVITY in the DATA field of the lesson, create an 'activity button' in the timeline


        //get the mongo document for this lesson
        $query = array('_id' => new MongoID($lesson_id));
        //returns only these fields of the activity record
        $projection = array('_id' => 0,
                            'dn' => 1,
                            'author' => 1,
                            'date' => 1,
                            'dn' => 1,
                            'data' => 1
                            );

        $lesson = $lessons_collection -> findOne($query, $projection);

        //echo json_encode ($lesson);

        $data = $lesson['data'];

        //echo json_encode ($data);

        //should send DN, AUTHOR and DATE in a hidden DIV

        foreach ($data as $activity) {
            $query = array('_id' => new MongoID($activity['id']));
            $db_collection = ($activity['collection'] == 'activities') ? $activities_collection : $chapters_collection;
            $details = $db_collection -> findOne($query);

            //makeactivitybutton
            //  format is:  makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $pg, $zoom)
            if ($activity['collection'] == 'activities')
                makeActivityButton($details['ft'],
                                   (isset($details['fp'])) ? $details['fp'] : null,
                                   (isset($details['fn'])) ? $details['fn'] : null,
                                   (isset($details['dn'])) ? $details['dn'] : null,
                                   (isset($details['fn'])) ? thumbnail($details['fn']) : null,
                                   (isset($details['ch_id'])) ? $details['ch_id'] : null,
                                   $activity['id'], null, null);
        };
    ?>

        </div>
    </div>

    <div id="controlpanel">
        <span>Looma Lesson:&nbsp; <span class="filename">&lt;name&gt;</span></span>

        <div id="button-box">
            <button class="control-button" id="back">
                <!-- <img src="images/back-arrow.png"> -->
            </button>
            <button class="control-button" id="pause">
               <!-- <img src="images/pause-button.png"> -->
            </button>
            <button class="control-button" id="forward">
                <!-- <img src="images/forward-arrow.png"> -->
            </button>
             <button class='control-button' id='dismiss' >
                <!-- <img src="images/delete-icon.png"> -->
            </button>
        </div>
    </div>

    <button  id="fullscreen-control"></button><br>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/jquery-ui.min.js">  </script>
    <script src="js/looma-screenfull.js"></script>
    <script src="js/looma-lesson-present.js"></script></html>

   </body>
</html>