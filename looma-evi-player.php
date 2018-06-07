 <!doctype html>
<!--
Name: Skip, Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 1.0
File: looma-edited-video.php
Description: Edited Video viewer page for Looma 2

Usage: 	<button  id="testvideo"
                 data-fn="A_Day_On_Earth_Edited.txt"
                 data-fp="content/videos/"
                 data-dn="A Day On Earth"
				 data-id="<mongoID of the JSON commands for this edited video">
			<img src=thumbnail
		</button>

	   And: $("button#testvideo").click(LOOMA.playMedia);

	This code can be called from
	a. clicking an 'activity button' created by looma-library.php or looma-activity.php
	b. from looma-video.php when "edit" is clicked
	c. in case the user enters looma-edited-video.php directly in the browser URL

	In case (a) the URL hash includes "data-id=..." and
	the id for accessing the edited video in the edited_videos collection in mongo is specified. in this case,
	data-fp, data-fn, and data-dn are expected to be provided.

	In case (b), no 'data-id' is specified, this is an unedited video and
	the code expects data-fp, data-fn and data-dn to be provided

-->

<?php $page_title = 'Looma Video Player';
    include ('includes/header.php');
    include ('includes/mongo-connect.php');
    include('includes/looma-utilities.php');
?>

<link rel="stylesheet" type="text/css" href="css/looma-video.css">
<link rel="stylesheet" type="text/css" href="css/looma-media-controls.css">

</head>

<body>
    <?php

        // Create "edited videos" pseudo-folder if it doesnt exist
         if (!file_exists("../content/edited videos/")) { mkdir("../content/edited videos/", 0777, true); };

//*************** new init code - SKIP*******

        $id = $_REQUEST['id'];
        $dn = $_REQUEST['dn'];


        //fetch the JSON descriptor of this edited video from mongo
        $query =      array('_id' => new MongoID($id));
        $projection = array('_id' => 0, 'data' => 1);
        $doc = $edited_videos_collection->findOne($query, $projection);
        $data = $doc['data'];
        $masterVideo = array_splice($data, 0, 1);

        $masterVideo = $masterVideo[0];

        $vidQuery = array('_id' => new MongoID($masterVideo['id']));
        $vid = $activities_collection->findOne($vidQuery);

        $vidFN = $vid['fn'];

        $filepath = "../content/videos/";
        $thumbFile = $filepath . thumbnail($vidFN);
?>
            <script>
                var commands =    <?php print json_encode($data);?>;
                var displayName = "<?php echo addslashes($dn);  ?>";
                var videoPath =   "<?php echo $filepath;        ?>";
                var vn =          "<?php echo $vidFN;        ?>";
                var thumbFile =   <?php echo json_encode($thumbFile); ?>;
                var fn =          "<?php echo $dn;              ?>";
                console.log('video editor opening - ' + fn);
            </script>

			<div id="main-container-horizontal">
				<div id="video-player">
					<div id="video-area">
                        <div id="fullscreen">
                            <?php include("includes/looma-control-buttons.php"); ?>
                            <button id="fullscreen-playpause" class="looma-control-button"></button>
                            <video id="video">
    							<?php echo 'poster="' . $filepath . thumbnail($vidFN) . '">'; ?>
    								<?php echo '<source src="' . $filepath . $vidFN . '"type="video/mp4">' ?>
    						</video>
    						<div id="text-box-area" style="background-color: white; color: black; display: none">
                                <!--<form class="media hidden_button" id="text-box">
    								<textarea name="comments" id="comments" placeholder="Enter text..." autofocus></textarea>
    							</form>
    							<textarea name="text-playback" id="text-playback" readonly="true"></textarea>-->
    						</div>
                            <!-- Along with text-playback ^ these divs are where the edits are added -->
    						<div id="image-area"></div>
                            <div id="pdf-area"></div>
                            <div id ="added-video-area"></div>
                        </div>
					</div>
                    <!--<div id="timeline-area"></div>-->
                    <div id="title-area">
                        <div id="title-div">
                            <h3 id="title"></h3>
                        </div>

                        <!-- BUTTON for OPEN new video to EDIT
                        <button type="button" class="media" id="open-videos-folder" style="display:none;">
                            <?php //skeyword('New') ?>
                        </button>-->

                        <!--<div id="description-div">
                            <p id="open-videos-folder-description">Leave current edit and go to the videos folder</p>
                            <p id="edit-description">Edit the video</p>
                            <p id="save-description">Save changes</p>
                            <p id="cancel-description">Cancel the edit</p>
                            <p id="next-frame-description" style="display:none;">Move forward by 1 frame</p>
                            <p id="next5-frame-description" style="display:none;">Move forward by 5 frames</p>
                            <p id ="prev-frame-description" style="display:none;">Move backward by 1 frame</p>
                            <p id="prev5-frame-description" style="display:none;">Move backward by 5 frames</p>
                            <p id="text-description">Add text to the video</p>
                            <p id="image-description">Add an image to the video</p>
                            <p id="pdf-description">Add a pdf the video</p>
                            <p id="video-description">Add a video to the video</p>
                        </div>-->
                    </div>
				</div>

                <div id="media-controls">
                            <div id="time" class="title">0:00</div>
                            <button type="button" class="media play-pause" id="play-pause">
                                <?php tooltip('Play/Pause'); ?>
                            </button>
                            <input type="range" class="video" id="seek-bar" value="0"><br>
                            <button type="button" class="media mute" id="volume">
                                <?php tooltip('Volume') ?>
                            </button>
                            <input type="range" class="video" id="volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block">
                </div>

                <!-- the 3 DIVs below contain buttons for all media files that can be inserted into an edited-video
                     only populated if the user is logged in  -->
                <!--<<div id="image-previews">-->
                    <!-- Opens pictures folder when you want to select an image -->
					<!--<?php /*if (loggedIn()) {
                        $folder = "pictures";
                       include ('includes/looma-edited-video-fileviewer.php');
                        };
                    */?>
				</div>

				<div id="pdf-previews">-->
				    <!-- Opens the pdfs folder when you want to select a pdf-->
					<!--<?php/* if (loggedIn()) {
                        $folder = "pdfs";
                        include ('includes/looma-edited-video-fileviewer.php');
                        };
                    */?>
				</div>

				<div id="video-previews">-->
                    <!-- Opens the videos folder when you want to select a video -->
					<!--<?php/* if (loggedIn()) {
                        $folder = "videos";
                       include ('includes/looma-edited-video-fileviewer.php');
                        };
                    */?>
				</div>-->

			</div> <!-- End of main container -->
            <?php include ('includes/toolbar.php'); ?>
            <?php include ('includes/js-includes.php'); ?>

            <script src = "js/jquery.min.js">          </script>      <!-- jQuery -->
            <script src = "js/looma-utilities.js"> </script>
            <script src = "js/looma-media-controls.js"></script>
            <script src = "js/looma-evi-player.js"></script>
