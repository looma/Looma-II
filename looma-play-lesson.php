<!doctype html>
<!--
Author: Skip
Filename: looma-play-lesson.php
Date: 02/2017
Description: looma lesson plan presenter
-->
	<?php $page_title = 'Looma Lesson Presenter ';
      include ('includes/header.php');
      include ('includes/looma-utilities.php');
      logFiletypeHit('lesson');
    ?>

    <link rel="stylesheet" href="css/looma-media-controls.css">
    <!-- <link rel="stylesheet" href="css/looma-video.css"> -->
    <link rel="stylesheet" href="css/looma-play-pdf.css">
    <link rel="stylesheet" href="css/looma-play-lesson.css">
    <link rel="stylesheet" href="css/looma-text-display.css">
  </head>

  <body>
    <?php
    if (isset($_REQUEST['lang'])) $lang = $_REQUEST['lang']; else $lang = 'en';
    echo "<div id='lesson-container' data-lang=$lang>";
    ?>
            <div id="fullscreen" class="keyboard">

              <!--  <input id="force_keyboard" hidden> -->


                <div id="viewer">
                </div>

                 <div id="displayers" >

                    <div id="pdf-canvas">
                        <?php
                            include("includes/looma-pdf-toolbar.php");
                            include("includes/looma-pdf-viewer.php");
                        ?>

                  <!--      <div id="pdf" class="scroll" data-fn="" data-fp="" data-page="" data-len="" data-zoom="">
                        </div>
             -->
                    </div>
                     <div id="thumbs"></div>

                </div>

                <?php
                include("includes/looma-control-buttons.php");
                // Some control buttons conflict with lesson timeline items' control buttons, so these buttons
                // are selectively hidden depending on filetype being displayed
                ?>
            </div>

            <?php include("includes/looma-media-controls.php"); ?>
        </div>

        <div id="timeline-container">
            <div id="timeline" >

        <?php

        function makeNotFoundButton() {
            makeButton(array('ft' => 'filenotfound'));
        };  // end makeNotFoundButton()

    /////////////// MAIN BODY /////////////
        if (isset($_REQUEST['id'])) $lesson_id = $_REQUEST['id']; else $lesson_id = null;
        if (isset($_REQUEST['db']) && $_REQUEST['db'] === 'loomalocal') {
            $db = 'loomalocal';
            $dbCollection = $localcollections['lessons'];
        } else {
            $db = 'looma';
            $dbCollection = $collections['lessons'];
        }

        if ($lesson_id) {   //get the mongo document for this lesson
            $query = array('_id' => mongoId($lesson_id));
            $lesson = mongoFindOne($dbCollection, $query);

            if (!$lesson) {
                echo "<h1>No lesson plan found</h1>";
                $displayname = "<none>";
            } else {
                $lessonname = $lesson['dn'];
                if (isset($lesson['data'])) $data = $lesson['data'];
                else { echo "<h1>Lesson has no content</h1>"; $data = null;}

                //should send DN, AUTHOR and DATE in a hidden DIV

                if ($data) foreach ($data as $lesson_element) {
                    if (isset($lesson_element['ft']) && $lesson_element['ft'] === 'inline') {  //timeline element is an inline text slide
                        makeInlineActivityButton($lesson_element);
                    } else {
                        if ($lesson_element['collection'] == 'activities') {  //timeline element is from ACTIVITIES

                        $query = array('_id' => mongoId($lesson_element['id']));

                        $details = mongoFindOne($activities_collection, $query);

                        if (!$details) {
                            makeNotFoundButton();
                        } else {
                            // thumbnail: use thumb field if present, otherwise let makeButton handle it
                            if (isset($details['thumb']) && $details['thumb'] != "")
                                $thumbSrc = $details['thumb'];
                            else if (isset($details['ft']) && $details['ft'] == 'EP' && isset($details['version']) && $details['version'] == 2015)
                                $thumbSrc = '../content/epaath/activities/' . $details["fn"] . '/thumbnail.jpg';
                            else $thumbSrc = null;  // let makeButton() generate thumbnail

                            $playLang = (isset($details['ft']) && $details['ft'] == 'EP' && $details['subject'] === 'nepali') ? 'np' : 'en';

                            makeButton(array(
                                'ft'        => $details['ft'],
                                'fp'        => isset($details['fp']) ? $details['fp'] : null,
                                'fn'        => isset($details['fn']) ? $details['fn'] : null,
                                'dn'        => isset($details['dn']) ? $details['dn'] : null,
                                'ndn'       => isset($details['ndn']) ? $details['ndn'] : null,
                                'nfn'       => isset($details['nfn']) ? $details['nfn'] : null,
                                'thumb'     => $thumbSrc,
                                'mongo_id'  => isset($details['mongoID']) ? $details['mongoID'] : null,
                                'ole_id'    => isset($details['oleID']) ? $details['oleID'] : null,
                                'url'       => isset($details['url']) ? $details['url'] : null,
                                'pg'        => isset($details['pn']) ? $details['pn'] : null,
                                'npg'       => isset($details['npn']) ? $details['npn'] : null,
                                'grade'     => isset($details['grade']) ? $details['grade'] : null,
                                'epversion' => isset($details['version']) ? $details['version'] : null,
                                'lang'      => $playLang,
                            ));
                        }  // end if (activity exists)
                    } else

                    if ($lesson_element['collection'] == 'chapters') {  //timeline element is from CHAPTERS

                        $lang = (isset($lesson_element['lang']) ? $lesson_element['lang'] : null);

                        $query = array('_id' => $lesson_element['id']);
                        $chapter = mongoFindOne($chapters_collection, $query);

                        if (!$chapter) {
                            makeNotFoundButton();
                        } else {
                              //      $query = array('prefix' => prefix($chapter['_id']));
                              $query = array('prefix' => prefix($chapter['_id']));
                              $textbook = mongoFindOne($textbooks_collection, $query);

                              $filename = (isset($textbook['fn']) && $textbook['fn'] != "") ? $textbook['fn'] : ((isset($textbook['nfn'])) ? $textbook['nfn'] : null);
                              $nfn = (isset($textbook['nfn']) ? $textbook['nfn'] : null);

                              $filepath = (isset($textbook['fp']) && $textbook['fp'] != "") ? $textbook['fp'] : null;

                              $displayname = (isset($chapter['dn']) && $chapter['dn'] != "") ? $chapter['dn'] : ((isset($chapter['ndn'])) ? $chapter['ndn'] : null);
                              $pagenumber = (isset($chapter['pn']) && $chapter['pn'] != "") ? $chapter['pn'] : ((isset($chapter['npn'])) ? $chapter['npn'] : null);
                              $npn = (isset($chapter['npn']) ? $chapter['npn'] : null);

                              $len = (isset($chapter['len']) && $chapter['len'] != "") ? $chapter['len'] : ((isset($chapter['nlen'])) ? $chapter['nlen'] : null);
                              $nlen = (isset($chapter['nlen']) ? $chapter['nlen'] : null);

                              if ($filename && $filepath)
                                  $thumbSrc = thumbnail($filename, "../content/" . $filepath,'pdf');
                              else $thumbSrc = null;

                            //echo "thumbSrc is " . $thumbSrc . '<br>';
                            //echo "filename is " . $filename . '<br>';
                            //echo "filepath is " . $filepath . '<br>';

                              makeButton(array(
                                  'ft'    => 'chapter',
                                  'fp'    => '../content/' . $filepath,
                                  'fn'    => $filename,
                                  'nfn'   => $nfn,
                                  'dn'    => $displayname,
                                  'thumb' => $thumbSrc,
                                  'ch_id' => $chapter['_id'],
                                  'pg'    => $pagenumber,
                                  'npg'   => $npn,
                                  'len'   => $len,
                                  'nlen'  => $nlen,
                                  'zoom'  => 2.3,
                                  'lang'  => $lang,
                              ));
                          }
                    }
                    }
                }  //  end foreach (lesson element)
            } // end if ($lesson found in mongo)
         }  // end if ($lessonid)
         else { echo "<h1>No lesson plan selected</h1>";
                $displayname = "<none>";
              }
        ?>
           </div>
        </div>

         <div id="lessontitle">
             <span id="subtitle"></span>
            <span>Looma Lesson:&nbsp; <span class="filename"><?php if (isset($lessonname)) echo $lessonname ?></span></span>
         </div>

    <div id="controlpanel">
        <div id="button-box">
            <button class="control-button" id="back"></button>
            <button class="control-button" id="forward"></button>
            <button class='control-button' id='return' ></button>
        </div>
    </div>

    <?php //include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/jquery-ui.min.js">  </script>
    <script src="js/jquery.hotkeys.js"> </script>
    <script src="js/tether.min.js">  </script>
 <!--    <script src="js/bootstrap.min.js">  </script>  -->
    <script src="js/looma-media-controls.js"></script>
  <!--     <script src="js/pdfjs/pdf.min.js"></script> -->

   <script src="js/looma-pdf-utilities.js"></script>

      <!-- <script src="js/looma-play-pdf.js"></script> -->

  <script src="js/looma-play-lesson.js"></script>
 </body>
</html>
