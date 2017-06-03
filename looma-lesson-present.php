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

    <link rel="stylesheet" href="css/looma-media-controls.css">
    <link rel="stylesheet" href="css/looma-video.css">
    <link rel="stylesheet" href="css/looma-lesson-present.css">

  </head>

  <body>
    <?php
        //Gets the filename, filepath, and the thumbnail location
        if (isset($_REQUEST['id'])) $lesson_id = $_REQUEST['id']; else $lesson_id = null;
    ?>



    <div id="main-container-horizontal">

        <div id="viewer"></div>
        <div id="timeline-container">

        <div id="timeline" >
        <!--
            <span>Timeline: </span><span class="filename"></span>
        -->
        <?php

        function prefix ($ch_id) { // extract textbook prefix from ch_id
            preg_match("/^([1-8](EN|SS|M|S|N))[0-9]/", $ch_id, $matches);
            return $matches[1];
        };

        //look up the lesson plan in mongo lessons collection
        //send DN, AUTHOR and DATE in a hidden DIV
        //for each ACTIVITY in the DATA field of the lesson, create an 'activity button' in the timeline

         if ($lesson_id) {   //get the mongo document for this lesson
            $query = array('_id' => new MongoID($lesson_id));
            //returns only these fields of the activity record
            $projection = array('_id' => 0,
                                'dn' => 1,
                                'author' => 1,
                                'date' => 1,
                                'thumb' => 1,
                                'data' => 1
                                );

            $lesson = $lessons_collection -> findOne($query, $projection);

            $displayname = $lesson['dn'];

            if (isset($lesson['data'])) $data = $lesson['data'];
            else { echo "Lesson has no content"; $data = null;}
        //
        // NEED TO SORT DATA
        //

            //should send DN, AUTHOR and DATE in a hidden DIV

            if ($data) foreach ($data as $activity) {

                //echo "ID is " . $activity['id'];
                //echo "coll is " . $activity['collection'];

                if (isset($details['thumb']))
                     $thumbSrc = $details['thumb'];
                else if (isset($details['fn']) && isset($details['fp']))
                     $thumbSrc = $details['fp'] . thumbnail($details['fn']);
                else $thumbSrc = null;

               if ($activity['collection'] == 'activities') {

                    $query = array('_id' => new MongoID($activity['id']));

                    $db_collection =  $activities_collection;
                    $details = $db_collection -> findOne($query);

                if (isset($details['thumb']))
                     $thumbSrc = $details['thumb'];
                else if (isset($details['fn']) && isset($details['fp']))
                     $thumbSrc = $details['fp'] . thumbnail($details['fn']);
                else $thumbSrc = null;

                    //  format is:  makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)


                        makeActivityButton($details['ft'],
                                           (isset($details['fp'])) ? $details['fp'] : null,
                                           (isset($details['fn'])) ? $details['fn'] : null,
                                           (isset($details['dn'])) ? $details['dn'] : null,
                                            $thumbSrc,

                                           "", //(isset($details['ch_id'])) ? $details['ch_id'] : null,
                                           $activity['id'],
                                           (isset($details['url'])) ? $details['url'] : null,
                                           null,
                                           null);
                } else

                if ($activity['collection'] == 'chapters') {

                    $query = array('_id' => $activity['id']);
                    $chapter = $chapters_collection -> findOne($query);

                    $query = array('prefix' => prefix($chapter['_id']));

                    $textbook = $textbooks_collection -> findOne($query);

                    // makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)

                    if (isset($details['fn']) && isset($details['fp']))
                             $thumbSrc = $details['fp'] . thumbnail($details['fn']);

                        makeActivityButton('pdf',
                                           (isset($textbook['fp'])) ? '../content/' . $textbook['fp'] : null,
                                           (isset($textbook['fn'])) ? $textbook['fn'] : null,
                                           (isset($chapter['dn'])) ? $chapter['dn'] : null,
                                           $thumbSrc,
                                           $chapter['_id'],
                                           null,
                                           null,
                                           (isset($chapter['pn']) ? $chapter['pn'] : 1),
                                           160);
                };
             };
             }
            else {echo "<h1>No lesson plan selected</h1>";
                  $displayname = "<none>";};
           ?>
        </div>
        </div>

         <div id="title">
             <span id="subtitle"></span>
            <span>&nbsp; &nbsp; &nbsp; Looma Lesson:&nbsp; <span class="filename"><?php if ($displayname) echo $displayname ?></span></span>
        </div>

    </div>

    <div id="controlpanel">

        <div id="button-box">
            <button class="control-button" id="back">
                <!-- <img src="images/back-arrow.png"> -->
            </button>
     <!--
            <button class="control-button" id="pause">
            </button>
     -->
            <button class="control-button" id="forward">
                <!-- <img src="images/forward-arrow.png"> -->
            </button>
             <button class='control-button' id='dismiss' >
                <!-- <img src="images/delete-icon.png"> -->
            </button>
        </div>
    </div>

    <button  id="fullscreen-control"></button>

    <?php //include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/jquery-ui.min.js">  </script>
    <script src="js/looma-screenfull.js"></script>
     <script src="js/looma-media-controls.js"></script>
     <script src="js/looma-lesson-present.js"></script>
 </body>
</html>