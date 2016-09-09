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
    include ('includes/activity-button.php');
?>

<link rel="stylesheet" type="text/css" href="css/looma-video.css">

</head>

<body>
    <?php

        /* thumbnail() is included with activity-button.php
         function thumbnail ($fn) {
                    //given a CONTENT filename, generate the corresponding THUMBNAIL filename
                    //find the last '.' in the filename, insert '_thumb.jpg' after the dot
                    //returns "" if no '.' found
                    //example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
                    $dot = strrpos($fn, ".");
                    if ( ! ($dot === false)) { return substr_replace($fn, "_thumb.jpg", $dot, 10);}
                    else return "";
        } //end function THUMBNAIL
         */

        // Create "edited videos" pseudo-folder if it doesnt exist
         if (!file_exists("../content/edited videos/")) { mkdir("../content/edited videos/", 0777, true); };

//*************** new init code - SKIP*******
        if (isset($_REQUEST['id'])) {  //id is set, being called with the id of an existing edited video
            $id = $_REQUEST['id'];
            $dn = $_REQUEST['dn'];
            $filepath = $_REQUEST['fp'];
            $filename = $_REQUEST['fn'];


           //fetch the JSON descriptor of this edited video from mongo
           $query =      array('_id' => new MongoID($id));
           $projection = array('_id' => 0, 'JSON' => 1);
           $doc = $edited_videos_collection->findOne($query, $projection);
           $json = $doc['JSON'];

        }
        else  //called with no 'id' means the fp/fn is an unedited video file
        {
            $dn =       (isset($_REQUEST['dn']) ? $_REQUEST['dn'] : "");
            $filepath = (isset($_REQUEST['fp']) ? $_REQUEST['fp'] : "");
            $filename = (isset($_REQUEST['fn']) ? $_REQUEST['fn'] : "");
            $id = null;
            $json = "null";
        }

        $thumbFile = $filepath . thumbnail($filename);

?>
            <script>
                //Sends the information from the .txt file to js
                var commands = <?php echo $json; ?>;
                var displayName = "<?php echo addslashes($dn);?>";
                var videoPath = "<?php echo $filepath; ?>";
                var vn =        "<?php echo $filename ?>";
                var thumbFile =  <?php echo json_encode($thumbFile); ?>;
                var fn =        "<?php echo $dn; ?>";
                console.log('video editor opening - ' + fn);
            </script>


<?php //************** end new init code ********?>

<?php
/*
            //Sets the filepath and filename
            //$dn being null means that the request came from looma-video.js and
            //looma-utilities.js
            $dn = $_REQUEST['dn'];
            $id = $_REQUEST['id'];
            $filepath = $_REQUEST['fp'];
            $filename = $_REQUEST['fn'];

            if ($dn != "null")
            {
                $filename = findName($_REQUEST['txt']);
            }
            else
            {
                $filename = $_REQUEST['fn'];
            }

            $thumbFile = $filepath . thumbnail($filename);

            //Finds the name of an edited video based of the text inside the file
            function findName($txt)
            {
                //Finds the videoName from inside the text file
                $startLoc = strpos($txt, "videoName") + 12;
                $endLoc = strpos(substr($txt, $startLoc), '"') + $startLoc;
                $len = $endLoc - $startLoc;
                return substr($txt, $startLoc, $len);
            }  //end findName()

    // removed makeButton() and thumbfile()

*/

  //**************************************************
    ?>
<!--
			<script>
				//Sends the information from the .txt file to js
				var commands = <?php echo $json; ?>;
                if ("<?php echo $_REQUEST['dn'] ?>" != "null")
                {
                    var displayName = "<?php echo addslashes($_REQUEST['dn']);?>";
                }
                var videoPath = "<?php echo $filepath; ?>";
                var vn = "<?php echo $filename ?>";
                var thumbFile = <?php echo json_encode($thumbFile); ?>;
                var fn = "<?php echo $_REQUEST['dn']; ?>";
                console.log('video editor opening - ' + fn);
			</script>
-->
			<!--
			    <link rel="stylesheet" type="text/css" href="css/looma-edited-video.css">
            -->

			<div id="main-container-horizontal">
				<div id="video-player">
					<div id="video-area">
						<video id="video">
							<?php echo 'poster="' . $filepath . thumbnail($filename) . '">'; ?>
								<?php echo '<source src="' . $filepath . $filename . '"type="video/mp4">' ?>
						</video>
						<div id="text-box-area">
                            <form class="media hidden_button" id="text-box">
								<textarea name="comments" id="comments" placeholder="Enter text..." autofocus></textarea>
							</form>
							<textarea name="text-playback" id="text-playback" readonly="true"></textarea>
						</div>
                        <!-- Along with text-playback ^ these divs are where the edits are added -->
						<div id="image-area"></div>
                        <div id="pdf-area"></div>
                        <div id ="added-video-area"></div>
					</div>
                    <div id="timeline-area"></div>
                    <div id="title-area">
                        <div id="title-div">
                            <h3 id="title"></h3>
                        </div>
                        <button type="button" class="media" id="open-videos-folder">
                            <?php keyword('Open Videos Folder') ?>
                        </button>
                        <div id="description-div">
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
                        </div>
                    </div>
				</div>
                <div id="media-controls">
                            <br>
                            <button id="fullscreen-control"></button>

                            <button id="fullscreen-playpause"></button>

                            <div id="time" class="title"></div>

                            <button type="button" class="media" id="play-pause">
                                <?php tooltip('Play/Pause'); ?>
                            </button>
                            <input type="range" class="video" id="seek-bar" value="0" style="display:inline-block">
                            <br>
                            <button type="button" class="media" id="volume">
                                <?php tooltip('Volume') ?>
                            </button>
                            <input type="range" class="video" id="volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block">
                            <br>
                </div>
                <div id="edit-controls">
                    <!-- All of the buttons that the user uses to edit a video -->
                    <div id="rename-form-div">
                        <p> Enter a name for your new edited video. The name must be 1 to 12 characters long. </p>
                        <p id="rename-error-prompt"> Error: The name you entered is not 1 to 12 characters long </p>

                        <form id="rename-form" autocomplete="off">
                            <input type="text" id="rename-text" autofocus />
                        </form>

                        <button type="button" class="media hidden_button" id="rename-form-submit-button">
                            <?php keyword("Submit") ?>
                        </button>
                    </div>

                    <div id="add-time-div">
                        <div id="add-start-stop-time-div">
                            <button type="button" class="media hidden_button" id="start-time">
                                <?php keyword('Set Start Time') ?>
                            </button>

                            <button type="button" class="media hidden_button" id="stop-time">
                                <?php keyword('Set Stop Time') ?>
                            </button>
                        </div>
                        <div id="default-start-stop-time-div">
                            <button type="button" class="media hidden_button" id="default-start-stop-time">
                                <?php  keyword('Default'); ?>
                            </button>
                        </div>
                    </div>

                    <button type="button" class="media" id="cancel">
                        <?php keyword('Cancel') ?>
                    </button>

                    <form class="media" id="search-area" style="display: none">
				        <input name="search" id="search-box" autofocus placeholder="Search for..."/>
                    </form>

                    <button type="button" class="media" id="delete">
                        <?php tooltip('Delete') ?>
                    </button>
                    <button type ="button" class="media" id="edit">
                        <?php keyword('Edit') ?>
                    </button>

                    <div id="login-div">
                        <button type="button" class="media" id="login">
                            <?php keyword('Log In') ?>
                        </button>
                    </div>

                    <button type="button" class="media hidden_button" id="prev-frame5">
                        &lt;&lt;&lt;
                        <?php
                            tooltip('Previous Frame')
                        ?>
                    </button>

                    <button type="button" class="media hidden_button" id="prev-frame">
                        &lt;
                        <?php  tooltip('Previous Frame') ?>
                    </button>

                    <button type="button" class="media hidden_button" id="next-frame">
                        &gt;
                        <?php tooltip('Next Frame')  ?>
                    </button>


                    <button type="button" class="media hidden_button" id="next-frame5">
                        &gt;&gt;&gt;
                        <?php tooltip('Next Frame') ?>
                    </button>

                    <br>

                    <button type="button" class="media hidden_button" id="rename">
                        <?php keyword('Rename') ?>
                    </button>

                    <button type="button" class="media" id="text">
                        <?php keyword('Text') ?>
                    </button>
                    <button type="button" class="media" id="image">
                        <?php keyword('Image') ?>
                    </button>
                    <button type="button" class="media hidden_button" id="pdf">
                        <?php keyword('Pdf') ?>
                    </button>

                    <button type="button" class="media hidden_button" id="video-button">
                        <?php keyword('Video') ?>
                    </button>

                    <button type="button" class="media hidden_button" id="submit">
                        <?php keyword('Submit') ?>
                    </button>

                    <br>
                </div>
                <div id="image-previews">
                    <!-- Opens pictures folder when you want to select an image -->
					<?php
                        $folder = "pictures";
                       include ('includes/looma-edited-video-fileviewer.php');
                    ?>
				</div>

				<!-- Opens the pdfs folder when you want to select a pdf-->
				<div id="pdf-previews">
					<?php
                        $folder = "pdfs";
                        include ('includes/looma-edited-video-fileviewer.php');
                    ?>
				</div>

				<div id="video-previews">
                    <!-- Opens the videos folder when you want to select a video -->
					<?php
                        $folder = "videos";
                       include ('includes/looma-edited-video-fileviewer.php');
                    ?>
				</div>

			</div> <!-- End of main container -->
            <?php include ('includes/toolbar.php'); ?>
            <?php include ('includes/js-includes.php'); ?>

            <script src="js/jquery.js">          </script>      <!-- jQuery -->
            <script src = "js/looma-utilities.js"> </script>
            <script src="js/looma-screenfull.js"></script>
            <script src="js/looma-edited-video.js"></script>