<!doctype html>
<!--
Author: Kiefer
Filename: looma-play-slideshow.php
Date: Aug 2018
Description: looma slideshow presenter

-->
    <?php $page_title = 'Looma Slideshow Presenter ';
          include ('includes/header.php');
          include('includes/looma-utilities.php');
    logFiletypeHit('slideshow');
    ?>

<link rel="stylesheet" href="css/looma-text-display.css">
<link rel="stylesheet" href="css/looma-play-slideshow.css">

  </head>

  <body>
    <?php
        //Gets the filename, filepath, and the thumbnail location
        if (isset($_REQUEST['id'])) $slideshow_id = $_REQUEST['id'];
        else {
            echo "<h1>File not found</h1>";
            exit;
        }
    ?>


        <div id="main-container-horizontal">
            <div id="fullscreen">
                <div id="viewer">
                    <div class="media-container"></div>
                     <p class="caption"></p>
                </div>
                <?php include("includes/looma-control-buttons.php"); ?>
            </div>
        </div>

        <div id="timeline-container">
            <div id="timeline">

        <?php

        //look up the slideshow in mongo slideshows collection
        //send DN, AUTHOR and DATE in a hidden DIV
        //for each ACTIVITY in the DATA field of the slideshow, create an 'activity button' in the timeline

         if ($slideshow_id) {   //get the mongo document for this slideshow
            $query = array('_id' => mongoId($slideshow_id));

            $slideshow = mongoFindOne($slideshows_collection, $query);

            if (!$slideshow) {
                echo "<h1>File not found</h1>";
                exit;
            }
            $displayname = $slideshow['dn'];

            if (isset($slideshow['data'])) $data = $slideshow['data'];
            else { echo "Slideshow has no content"; $data = null;}


            //should send DN, AUTHOR and DATE in a hidden DIV

            if ($data) foreach ($data as $slideshow_element) {

                $query = array('_id' =>  mongoId($slideshow_element['id']));

                $details = mongoFindOne($activities_collection, $query);

                if (isset($details['thumb']))
                     $thumbSrc = $details['thumb'];
                else if (isset($details['fn']) && isset($details['fp']))
                     $thumbSrc = thumbnail($details['fn'], $details['fp'], "slideshow");
                else $thumbSrc = null;

                //  format is:  makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom)

                $caption = isset($slideshow_element['caption']) ? $slideshow_element['caption']: "";

                makeActivityButton(
                        $details['ft'],
                       (isset($details['fp'])) ? $details['fp'] : null,
                       (isset($details['fn'])) ? $details['fn'] : null,

                        $caption,
                        //(isset($details['dn'])) ? $details['dn'] : null,
                        null,
                        $thumbSrc,
                       "",
                       $slideshow_element['id'],
                       null, //$caption,
                       null,
                       null,
                       null, null, null,null,null,null,null);
             }
         }
            else {echo "<h1>No slideshow selected</h1>";
                  $displayname = "<none>";}
        ?>
            </div>
        </div>

            <div id="controlpanel">
                 <div id="button-box">
                    <button class="control-button" id="back">   </button>
                    <button class="control-button" id="forward"></button>
                    <button class='control-button' id='return' ></button>
                 </div>
            </div>

         <div id="title">
             <span id="subtitle"></span>
            <span>Looma Slideshow:&nbsp; <span class="filename"><?php if ($displayname) echo $displayname ?></span></span>
        </div>



    <?php //include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/jquery-ui.min.js">  </script>
    <script src="js/jquery.hotkeys.js"> </script>
    <script src="js/tether.min.js">  </script>
    <script src="js/bootstrap.min.js">  </script>
    <script src="js/looma-play-slideshow.js"></script>

 </body>
</html>
