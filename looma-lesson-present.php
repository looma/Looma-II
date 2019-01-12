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
          include('includes/looma-utilities.php'); ?>

    <link rel="stylesheet" href="css/looma-media-controls.css">
<link rel="stylesheet" href="css/looma-video.css">
<link rel="stylesheet" href="css/looma-text-display.css">
    <link rel="stylesheet" href="css/looma-lesson-present.css">

  </head>

  <body>
    <?php
        if (isset($_REQUEST['id'])) $lesson_id = $_REQUEST['id']; else $lesson_id = null;
    ?>

        <div id="main-container-horizontal">
            <div id="fullscreen">
                <div id="viewer"></div>
                <?php include("includes/looma-control-buttons.php"); ?>
            </div>
        </div>
        <div id="media-controls-container"></div>

        <div id="timeline-container">
            <div id="timeline" >

        <?php

        function prefix ($ch_id) { // extract textbook prefix from ch_id
            preg_match("/^(([1-9]|10)(EN|SS|M|S|N))[0-9]/", $ch_id, $matches);
            return $matches[1];
        };

        //look up the lesson plan in mongo lessons collection
        //send DN, AUTHOR and DATE in a hidden DIV
        //for each ACTIVITY in the DATA field of the lesson, create an 'activity button' in the timeline

         if ($lesson_id) {   //get the mongo document for this lesson
            $query = array('_id' => new MongoId($lesson_id));
            //returns only these fields of the activity record
            $projection = array('_id' => 0,
                                'dn' => 1,
                                'author' => 1,
                                'date' => 1,
                               // 'thumb' => 1,  //no THUMB stored with lessons in mongo
                                'data' => 1
                                );

            $lesson = $lessons_collection -> findOne($query, $projection);

            $displayname = $lesson['dn'];

            if (isset($lesson['data'])) $data = $lesson['data'];
            else { echo "Lesson has no content"; $data = null;}

            //should send DN, AUTHOR and DATE in a hidden DIV

            if ($data) foreach ($data as $lesson_element) {

               if ($lesson_element['collection'] == 'activities') {

                    $query = array('_id' => new MongoId($lesson_element['id']));

                    $details = $activities_collection -> findOne($query);

                if (isset($details['thumb']))
                     $thumbSrc = $details['thumb'];
                else if (isset($details['fn']) && isset($details['fp']))
                     $thumbSrc = $details['fp'] . thumbnail($details['fn']);
                else $thumbSrc = null;

                    //  format is:  makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)

                        makeActivityButton(
                             $details['ft'],
                            (isset($details['fp'])) ? $details['fp'] : null,
                            (isset($details['fn'])) ? $details['fn'] : null,
                            (isset($details['dn'])) ? $details['dn'] : null,
                             null,
                            $thumbSrc,

                            "", //(isset($details['ch_id'])) ? $details['ch_id'] : null,
                            (isset($details['mongoID'])) ? $details['mongoID'] : null,
                            (isset($details['url'])) ? $details['url'] : null,
                            null,
                            null);
                } else

                if ($lesson_element['collection'] == 'chapters') {

                    $query = array('_id' => $lesson_element['id']);
                    $chapter = $chapters_collection -> findOne($query);

                    $query = array('prefix' => prefix($chapter['_id']));

                    $textbook = $textbooks_collection -> findOne($query);

                    if (isset($textbook['fn']) && isset($textbook['fp']))
                        $thumbSrc = "../content/" . $textbook['fp'] . thumbnail($textbook['fn']);
                    else $thumbSrc = null;

                    // makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton('pdf',
                       (isset($textbook['fp'])) ? '../content/' . $textbook['fp'] : null,
                        (isset($textbook['fn'])) ? $textbook['fn'] : null,
                        (isset($textbook['dn'])) ? $textbook['dn'] : null,
                        null,
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
            <span>Looma Lesson:&nbsp; <span class="filename"><?php if ($displayname) echo $displayname ?></span></span>
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
             <button class='control-button' id='return' >
                <!-- <img src="images/delete-icon.png"> -->
            </button>
        </div>
    </div>

    <?php //include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/jquery-ui.min.js">  </script>
    <script src="js/jquery.hotkeys.js"> </script>
    <script src="js/tether.min.js">  </script>
    <script src="js/bootstrap.min.js">  </script>
    <script src="js/looma-media-controls.js"></script>
    <script src="js/looma-lesson-present.js"></script>

 </body>
</html>
