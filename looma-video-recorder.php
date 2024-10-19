<!doctype html>
<!--
Name: Yefri, Kirumba

Owner: Looma Education Company
Date: 2021 03
Revision: Looma Video Recorder 1.0
File: looma-video-recorder.php

-->
<?php $page_title = 'Looma Video Recorder';
      require_once ('includes/header.php');
      require_once('includes/looma-utilities.php');
?>

    <link rel="stylesheet" type="text/css" href="css/looma-video.css">
    <link rel="stylesheet" type="text/css" href="css/looma-media-controls.css">
    <link rel="stylesheet" type="text/css" href= "css/looma-video-recorder.css">

    </head>

    <body>

        <div id="main-container-horizontal">
            <div id="video-player">
                <div id="fullscreen">
                    <video id="preview_pane" width="100%" height="100%" autoplay muted></video>
                    <div id="fullscreen-buttons">
                        <?php include ('includes/looma-control-buttons.php');?>
                    </div>
                </div>
            </div>

            <div id="record-buttons">
                <a href="#!" id="stop_button" class="btn btn-danger" >Stop Cam</a>
                <a href="#!" id="preview_button" class="btn btn-success" >Preview</a>
                <a href="#!" id="start_button" class="btn btn-success" >Start Recording</a>
                <label>Screen record</label><input type="checkbox" id="SR" name="Screen Record">
                <a id= "uploadButton" href="#!" class= "btn btn-secondary">Upload Recording</a>

                <!--<pre id="log"></pre>-->
            </div>
        </div>

        <div id="uploadDialog">
            <form action='looma-video-upload.php' method='POST' enctype='multipart/form-data'>
                <input type='file' name='upload-file'> <br>
                <p>Title:  &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;<input type='text' name='dn'>
                <p> Author's Name: <input type='text' name='author'></p>
                <input type='submit'  name='submit' value='Upload File'></form>
        </div>

        <?php include ('includes/toolbar.php'); ?>
        <?php include ('includes/js-includes.php'); ?>
        <script src="js/looma-media-controls.js"></script>
        <script src="js/looma-play-video.js"></script>
   <!--
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js" type="text/javascript"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.bundle.min.js" ></script>
   -->
        <script src="js/looma-video-recorder.js"></script>
    <!--
         <script src="js/looma-video-recorder-inputbox.js"></script>
   -->
</body>
