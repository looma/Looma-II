<!doctype html>
<!--
Author: Skip
Filename: looma-lesson-present.php
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

                <input id="force_keyboard" hidden>

                <div id="viewer">
                </div>

                 <div id="displayers" hidden>
                    <div id="pdf-canvas">
                        <div id="pdf" class="scroll" data-fn="" data-fp="" data-page="" data-len="" data-zoom="">
                        </div>
                    </div>
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
            global $playLang;
            makeActivityButton('filenotfound', null, null, null, null, null, null, null, null, null,
                              null, null, null, null, null, null, null, null, null, $playLang);
        };  // end makeNotFoundButton()

        //look up the lesson plan in mongo lessons collection
        //send DN, AUTHOR and DATE in a hidden DIV
        //for each ACTIVITY in the DATA field of the lesson, create an 'activity button' in the timeline

        function thumbPrefix($ft) {   // this should be in includes/looma-utilities.php
            $fp =   "";
		switch ($ft) { //if $fp is not specified, use the default content folder for this $ft
            case "video":
            case "mp4":
            case "mp5":
            case "m4v":
            case "mov":
                $fp = '../content/videos/';
                break;
            case "image":
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
                $fp = '../content/pictures/';
                break;
            case "audio":
            case "m4a":
            case "mp3":
                $fp = '../content/audio/';
                break;
            case "pdf":
                $fp = '../content/pdfs/';
                break;
            case "slideshow":
                $fp = urlencode('../content/slideshows/');
                break;
            case "evi":
                $fp = '../content/videos/';
                break;
            case "html":
            case "HTML":
                $fp = '../content/html/';
                break;
            case "EP":
            case "epaath":
                break;
            case "VOC":       //vocabulary reviews
            case "lesson":    //lesson plan
            case "map":       //map
            case "game":      //game
            case "text":      //text
            case "book":      //book
            case "looma":     //looma
            case "chapter":   //chapter
            case "history":   //$fp = '../content/histories/';
                break;
        };
        return $fp;
        };  //  end thumbPrefix()

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
                            if (isset($details['thumb']) && $details['thumb'] != "")
                                $thumbSrc = $details['thumb'];
                            else if (isset($details['ft']) && $details['ft'] == 'EP' && isset($details['version']) && $details['version'] == 2015)
                                $thumbSrc = '../content/epaath/activities/' . $details["fn"] . '/thumbnail.jpg';
                           // else if (isset($details['ft']) && $details['ft'] == 'EP' && isset($details['version']) && $details['version'] == 2019)
                             //   $thumbSrc = $details['thumb'];
                           // else if (isset($details['ft']) && $details['ft'] == 'EP' && isset($details['version']) && $details['version'] == 2022)
                             //   $thumbSrc = '../ePaath/' . $details['thumb'];
                            else if (isset($details['ft']) && $details['ft'] == 'evi')
                                $thumbSrc = 'images/video.png';
                            else if (isset($details['ft']) && $details['ft'] == 'text')
                                $thumbSrc = 'images/textfile.png';
                            else if (isset($details['ft']) && $details['ft'] == 'game')
                                $thumbSrc = 'images/games.png';
                            else if (isset($details['fn']) && isset($details['fp']))
                                $thumbSrc = thumbnail($details['fn'], $details['fp'],$details['ft']);
                            else if (isset($details['fn']))
                                $thumbSrc = thumbnail($details['fn'], thumbPrefix($details['ft']), $details['ft']);
                            else $thumbSrc = 'images/LoomaLogo_small.png';

                            if (isset($details['ft']) && $details['ft'] == 'EP' && $details['subject'] === 'nepali') $playLang = 'np'; else $playLang = 'en';
                            //  format is:  makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom,$grade,$epversion,$nfn,$npg,$prefix,$lang)

                            //echo "thumb is " . $thumbSrc;

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
                                (isset($details['pn'])) ? $details['pn'] : null,
                                null,
                                (isset($details['grade'])) ? $details['grade'] : null,
                                (isset($details['version'])) ? $details['version'] : null,
                                (isset($details['nfn'])) ? $details['nfn'] : null,
                                (isset($details['npn'])) ? $details['npn'] : null,
                                null,
                                $playLang,
                                (isset($details['nfn'])) ? $details['nfn'] : null,
                            );
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

                              makeChapterButton('chapter',
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
                                  $len,
                                  2.3,
                                  null,
                                  null,
                                  $nfn,
                                  $npn,
                                  $nlen,
                                  null,
                                  $lang
                              );
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
    <script src="js/bootstrap.min.js">  </script>
    <script src="js/looma-media-controls.js"></script>
    <script src="js/pdfjs/pdf.min.js"></script>
    <script src="js/looma-pdf-utilities.js"></script>
    <script src="js/looma-play-lesson.js"></script>
 </body>
</html>
