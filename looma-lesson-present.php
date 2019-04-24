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

                <button class="control-button-fullscreen" id="back-fullscreen"></button>
                <button class="control-button-fullscreen" id="forward-fullscreen"></button>

                <div id="viewer"></div>
                <?php include("includes/looma-control-buttons.php"); ?>
            </div>
        </div>
        <div id="media-controls-container"></div>

        <div id="timeline-container">
            <div id="timeline" >

        <?php

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

            $lesson = $lessons_collection -> findOne($query);

            $displayname = $lesson['dn'];

            if (isset($lesson['data'])) $data = $lesson['data'];
            else { echo "Lesson has no content"; $data = null;}

            //should send DN, AUTHOR and DATE in a hidden DIV

            if ($data) foreach ($data as $lesson_element) {

               if ($lesson_element['collection'] == 'activities') {  //timeline element is from ACTIVITIES

                    $query = array('_id' => new MongoId($lesson_element['id']));

                    $details = $activities_collection -> findOne($query);

                   //echo ('  ft: ' . $details['ft'] . '  version: ' . $details['version']);

                   if (isset($details['thumb']) && $details['thumb'] != "")
                      $thumbSrc = $details['thumb'];
                else if (isset($details['ft']) && $details['ft'] == 'EP'  && isset($details['version']) && $details['version'] == 2015)
                     $thumbSrc = '../content/epaath/activities/' . $details["fn"] . '/thumbnail.jpg';
                else if (isset($details['fn']) && isset($details['fp']))
                     $thumbSrc = $details['fp'] . thumbnail($details['fn']);
                else $thumbSrc = null;

                    //  format is:  makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom)

                        makeActivityButton(
                             $details['ft'],
                            (isset($details['fp'])) ? $details['fp'] : null,
                            (isset($details['fn'])) ? $details['fn'] : null,
                            (isset($details['dn'])) ? $details['dn'] : null,
                             null,
                            $thumbSrc,

                            "", //(isset($details['ch_id'])) ? $details['ch_id'] : null,
                            (isset($details['mongoID'])) ? $details['mongoID'] : null,
                            (isset($details['oleID'])) ? $details['oleID'] : null,
                            (isset($details['url'])) ? $details['url'] : null,
                            null,
                            null,
                            (isset($details['grade'])) ? $details['grade'] : null,
                            (isset($details['version'])) ? $details['version'] : null
                        );
                } else

                if ($lesson_element['collection'] == 'chapters') {  //timeline element is from CHAPTERS

                    $query = array('_id' => $lesson_element['id']);
                    $chapter = $chapters_collection -> findOne($query);

                    $query = array('prefix' => prefix($chapter['_id']));
                    $textbook = $textbooks_collection -> findOne($query);
//echo $textbook['fn'] . '   ' . $textbook['nfn'];
                    $filename = (isset($textbook['fn']) && $textbook['fn'] != "") ? $textbook['fn'] : ((isset($textbook['nfn'])) ? $textbook['nfn'] : null);
//echo 'filename is   ' . $filename;
                    $filepath = (isset($textbook['fp']) && $textbook['fp'] != "") ? $textbook['fp'] : null;

//echo '   filepath is   ' . $filepath; return;
                    $displayname = (isset($chapter['dn']) && $chapter['dn'] != "") ? $chapter['dn'] : ((isset($chapter['ndn'])) ? $chapter['ndn'] : null);
                    $pagenumber  = (isset($chapter['pn']) && $chapter['pn'] != "") ? $chapter['pn'] : ((isset($chapter['npn'])) ? $chapter['npn'] : null);

                    if ($filename && $filepath)
                        $thumbSrc = "../content/" . $filepath . thumbnail($filename);
                    else $thumbSrc = null;
                    //echo "filename is " . $filename;
                    // makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom)
                    makeActivityButton('pdf',
                        '../content/' . $filepath,
                        $filename,
                        $displayname,
                        null,
                       $thumbSrc,
                       $chapter['_id'],
                       null,
                       null,
                       null,
                       $pagenumber,
                       160,
                        null,
                        null);
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
