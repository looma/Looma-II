 <!doctype html>
<!--
Name: Skip, Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07, 2019 05
Revision: Looma Video Editor 3.0
File: looma-evi-player.php
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
	b. [ currently disabled] from looma-video.php when "edit" is clicked
	c. in case the user enters looma-evi-player.php directly in the browser URL

	In case (a) the URL hash includes "data-id=..." and
	the id for accessing the edited video in the edited_videos collection in mongo is specified. in this case,
	data-fp, data-fn, and data-dn are expected to be provided.
-->

<?php $page_title = 'Looma Edited Video Player';
    include ('includes/header.php');
    include ('includes/mongo-connect.php');
    include('includes/looma-utilities.php');
?>

    <!--<link rel="stylesheet" type="text/css" href="css/looma-video.css">  -->
    <link rel="stylesheet" type="text/css" href="css/looma-media-controls.css">
    <link rel="stylesheet" type="text/css" href="css/looma-text-display.css">
    <link rel="stylesheet" type="text/css" href="css/looma-evi-player.css">
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

        if (isset($vid['fp'])) $filepath = $vid['fp']; else $filepath = "../content/videos/";
        $thumbFile = $filepath . thumbnail($vidFN);
?>
<!--
    <script>
        var commands =    <?php print json_encode($data);?>;
        var displayName = "<?php echo addslashes($dn);  ?>";
        var videoPath =   "<?php echo $filepath;        ?>";
        var vn =          "<?php echo $vidFN;        ?>";
        var thumbFile =   <?php echo json_encode($thumbFile); ?>;
        var fn =          "<?php echo $dn;              ?>";
        console.log('video editor opening - ' + fn);
    </script>
 -->
    <?php
        echo '<div hidden id="args" ';
        echo "data-commands='" . json_encode($data) . "' ";
        echo 'data-dn      ="' . addslashes($dn) . '" ';
        echo 'data-vp      ="' . $filepath . '" ';
        echo 'data-vn      ="' . $vidFN . '" ';
        //echo 'data-thumb   ="' . json_encode($thumbFile) . '" ';
        //echo 'data-fn      ="' . $dn . '" ';
        echo '></div>';
    ?>
			<div id="main-container-horizontal">
				<div id="video-player">
					<div id="video-area">
                        <div id="fullscreen">
                            <?php include("includes/looma-control-buttons.php"); ?>
                            <video id="video" class="displayArea">
    							<?php echo 'poster="' . $filepath . thumbnail($vidFN) . '">'; ?>
                                <?php echo '<source src="' . $filepath . $vidFN . '"type="video/mp4">' ?>
    						</video>
    						<div id="text-file-area"      class="displayArea text-display"></div>
    						<div id = "picture-area"        class="displayArea"></div>
                            <div id = "pdf-area"          class="displayArea"></div>
                            <div id = "added-video-area"  class="displayArea"></div>
                        </div>
					</div>

                    <?php include("includes/looma-media-controls.php"); ?>

                    <!--<div id="timeline-area"></div>-->
                    <div id="title-area">
                        <div id="title-div">
                            <h3 id="title"></h3>
                        </div>
                    </div>
				</div>



			</div> <!-- End of main container -->
            <?php include ('includes/toolbar.php'); ?>
            <?php include ('includes/js-includes.php'); ?>

            <script src = "js/looma-media-controls.js"></script>
            <script src = "js/looma-evi-player.js"></script>
