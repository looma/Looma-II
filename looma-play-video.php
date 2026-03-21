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
            $fn = rawurldecode($_REQUEST['fn']);
            $fp = urldecode($_REQUEST['fp']);
            $dn = urldecode($_REQUEST['dn']);
            if (isset($_REQUEST['captions']) && $_REQUEST['captions'] === 'false' || $_REQUEST['captions'] === 'undefined')
                $captions = false; else $captions = true;
            $thumbFile = thumbnail($fn,$fp,"mp4");
            $prefix = substr($fn,0,strrpos($fn, "."));
	    ?>

			<div id="main-container-horizontal">

                    <div id="video-player">
                        <div id="fullscreen">
                            <video id="video" class="viewer"
                                <?php echo "data-fn=$fn data-fp = $fp";
                                echo 'poster=\"' . thumbnail($fn,$fp,"mp4") . '\">';echo '<source id="video-source" src="' . $fp . $fn . '" type="video/mp4">';
                                    if ( $captions && file_exists($fp . $prefix . ".vtt"))
                                        echo '<track  default class="en" src="' . $fp . $prefix . '.vtt" kind="subtitles" srclang="en" label="English">';

                                if ( $captions && file_exists($fp . $prefix . "_np.vtt"))
                                    echo '<track  class="np" src="' . $fp . $prefix . '_np.vtt" kind="subtitles" srclang="np" label="Nepali">';
                                ?>
                            </video>
                            <div id="fullscreen-buttons">
                                <?php include ('includes/looma-control-buttons.php');?>
                                <?php downloadButton($fp,$fn); ?>
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
