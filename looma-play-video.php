<!doctype html>
<!--
Name: Skip, Aaron, Connor, Ryan

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 1.0
File: video.php
Description: Can play an unedited video reroutes the user to looma-edited-video.php if
they want to edit a video
-->
<?php $page_title = 'Looma Video Player';
	  require_once ('includes/header.php');
      require_once ('includes/looma-utilities.php');
      logFiletypeHit('video');
?>

    <link rel="stylesheet" type="text/css" href="css/looma-video.css">
    <link rel="stylesheet" type="text/css" href="css/looma-media-controls.css">

	</head>

	<body>
		<?php
            //Gets the filename, filepath, and the thumbnail location
            $filename = urldecode($_REQUEST['fn']);
            $filepath = urldecode($_REQUEST['fp']);
            $displayname = urldecode($_REQUEST['dn']);
            $thumbFile = thumbnail($filename,$filepath,"mp4");
            $fileprefix = substr($filename,0,strrpos($filename, "."));
	    ?>
			<script>
				//Converts thumbFile to js
                var fileName = "<?php echo $filename ?>";
                var filePath = "<?php echo $filepath ?>";
                var displayName = "<?php echo $displayname ?>";
				var thumbFile = <?php echo json_encode($thumbFile); ?>;
				var fileprefix = "<?php echo $filepath . $fileprefix . '.eng.eng.vtt'?>";
			</script>

			<div id="main-container-horizontal">

                    <div id="video-player">
                        <div id="fullscreen">
                            <video id="video" class="viewer">
                                <?php echo 'poster=\"' . thumbnail($filename,$filepath,"mp4") . '\">';?>
                                <?php echo '<source id="video-source" src="' . $filepath . $filename . '" type="video/mp4">'; ?>
                                <?php
                                    if (file_exists($filepath . $fileprefix . ".vtt"))
                                        echo '<track  default class="en" src="' . $filepath . $fileprefix . '.vtt" kind="subtitles" srclang="en" label="English">';
                                ?>
                                <?php
                                if (file_exists($filepath . $fileprefix . "_nepali.vtt"))
                                    echo '<track  class="np" src="' . $filepath . $fileprefix . '_nepali.vtt" kind="subtitles" srclang="np" label="Nepali">';
                                ?>
                            </video>
                            <div id="fullscreen-buttons">
                                <?php include ('includes/looma-control-buttons.php');?>
                                <?php downloadButton($filepath,$filename); ?>
                            </div>
                        </div>
                    </div>

            <?php require_once("includes/looma-media-controls.php");?>
            </div>

        <?php include ('includes/toolbar.php'); ?>
        <?php include ('includes/js-includes.php'); ?>
        <script src="js/looma-media-controls.js"></script>          <!-- Looma Javascript -->
        <script src="js/looma-play-video.js"></script>          <!-- Looma Javascript -->

	</body>
