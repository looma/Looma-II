<!doctype html>
<!--
LOOMA php code file
Filename: looma-picture-player.php
Description: The main picture player page. Allows for slideshows of pictures.

Programmer name: Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
Email: thomas.woodside@gmail.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 7/1/16
Revision: 0.4
-->

<?php
$page_title = 'Looma Picture Player';
include ('includes/header.php');
if (isset($_GET["id"])) {
    $id = $_GET["id"];
    $mode = "existing";
    $connection = new MongoClient();
    $db = $connection->selectDB("looma");
    $collection = $db->selectCollection("slideshows");
    $entry = $collection->findOne(array("_id" => new MongoId($id)), array("order"));
} else if (isset($_GET["dir"])){
    $mode = "dir";
} else {
    $mode = "blank";
}
?>
<head>
    <!-- <link href="css/looma-contentNav-newDesign.css" type="text/css" rel="stylesheet"> -->
    <link rel="stylesheet" href="css/looma-picture-player.css"> <!-- Picture Player CSS -->
</head>

<body>
<div id="main-container-horizontal">

    <div class="row main-slideshow"> <!-- The image and next and previous controls -->
        <div class = "col-md-1" id="otherImageCol">
            <button class="controls carrot small" id="extend">
                <img src="images/carrot.png" alt="Carrot" class = "small noDrag">
            </button>
            <button class="controls carrot small" id="retract">
                <img src="images/carrot.png" alt="Uncarrot" class = "small noDrag">
            </button>
            <?php include "looma-picture-player-other-images.php";?>
                <button class="controls carrot small" id="retract">
                    <img src="images/carrot.png" alt="Uncarrot" class = "small noDrag">
                </button>
        </div>
        <button class="col-md-1 previous controls" id="previous"> <!--Previous Button-->
            <img src="images/next-arrow.png" alt="Back Arrow" class="noDrag">
            <?php tooltip("Previous") ?>
        </button>
        <div class="col-md-8" id="screenfull">
            <img class="img-responsive center-block"
                 id = "main-img"
                 src=""
                 alt="main image">
            <button  id="fullscreen-control"></button><br>
            <div class="captions-div" id="caption-text">
                <p id="caption"></p>
            </div>
        </div>
        <button class="col-md-1 next controls" id="next"> <!--Next Button-->
            <img src="images/next-arrow.png" alt="Next Arrow" class="noDrag">
            <?php tooltip("Next") ?>
        </button>
    </div>
    <div class="row"> <!--Thumbnails and next and previous control-->
        <div id="bottomOffset" class="search">
        </div>
        <div class="col-md-offset-1 col-md-1" id="thumbnail-div-first-col">

            <button class="thumbnail-controls previous controls" id="back-thumbnails"> <!-- backward scroll thumbnails -->
                <img src="images/double-arrow.png" alt="Scroll backward" class="noDrag">
                <?php tooltip("Scroll Back")?>
            </button>
        </div>
        <div class="col-md-8" id="thumb-div"> <!-- the image thumbnails -->
            <ul id="img-thumbs">
                <?php
                if ($mode == "existing") {
                    foreach($entry["order"] as $item) {
                        $filepath = $item["src"];
                        $fpSplit = explode("/", $filepath);
                        $filename = array_pop($fpSplit);
                        $dirpath = implode("/", $fpSplit);
                        echoThumbnail($filename, $item["caption"], $dirpath);
                    }
                }
                else if ($mode == "dir") {
                    $dir = new DirectoryIterator($_GET["dir"]); // an iterator for every file in the given directory.
                    // we plan to make the path to the directory a parameter to this file.
                    foreach($dir as $item) {
                        $filename = $item->getFilename();
                        echoThumbnail($filename, "", $_GET["dir"]);
                    }
                } //else empty, echoes no thumbnails.
                function echoThumbnail($filename, $caption,  $dirname) {
                    if (!strpos($filename, '-thumb') and $filename != 'images.txt') //Non-thumbnails
                    {
                        $thumbnail = explode(".", $filename)[0];
                        if ($thumbnail == "")
                        {
                            return;
                        }
                        $thumbnail .= "-thumb.jpeg";
                        if (file_exists("$dirname/$thumbnail")) {
                            echo "<li class='img-thumbnail'><img src='$dirname/$thumbnail' alt='thumbnail' data-fp='$dirname/$filename' data-caption='$caption'></li>";
                        }
                        else {
                            echo "<li class='img-thumbnail'><img src='$dirname/$filename' alt='thumbnail' data-fp='$dirname/$filename' data-caption='$caption'></li>";
                        }
                    }
                }
                ?>
            </ul>
        </div>
        <div class="col-md-1">
            <button class="thumbnail-controls next controls" id="next-thumbnails"> <!-- backward scroll thumbnails -->
                <img src="images/double-arrow.png" alt="Scroll forward" class = "noDrag">
                <?php tooltip("Scroll Forward")?>
            </button>
        </div>
    </div>
    <div class="row slide-controls"> <!-- slideshow controls -->
            <div class = "col-md-1 small">
            </div>
            <div id="start_stop">
            <div class="col-md-2 small" id="controllers">
                <button id="play" class="center-block controls small"><img src="images/play-button.png" class="small noDrag">
                    <?php tooltip("Play")?></button>
                <button id="pause" class="center-block controls small"><img src="images/pause-button.png" class="small noDrag">
                    <?php tooltip("Pause")?>
                </button>
            </div>
            </div>
            <div class="col-md-2 small"> 
                <button id="slow-down" class="controls small">
                    <img src="images/slow-turtle.png" class="small noDrag"> 
                    <?php tooltip("Slow")?></button> 
            </div>
            <div class="col-md-3 small" id="slider-div">
                <input id="slide" type="range" min="5" max="40" step="1" value = "20">
            </div>
            <div class = "col-md-2 small">
                     <button id="speed-up" class="controls small">
                    <img src="images/fast-rabbit.png" class="small noDrag">
                    <?php tooltip("Fast")?></button> </div>
        <div class="col-md-1 small">
            <button id="save" class="center-block controls small">
                <img src="images/save-icon.png" alt="save-icon" class = "small noDrag"><?php tooltip("Save")?>
            </button>
            <button id="editor" class="center-block controls small">
                <img src="images/edit-icon-below.png" alt="edit-icon" class = "small noDrag">
                <?php tooltip("Edit")?>
            </button>
        </div>
        <div class="col-md-2 small">
            <button id="delete" class="center-block controls small nonExtendTrash">
                <img src="images/delete-icon.png" alt="trash-icon" class = "small noDrag">
                <?php tooltip("Delete")?>
            </button>
        </div>

    </div>
    <div class="captions-div captions-div-start">
        <!-- Caption: <input type="text" name="Caption"> <input type="submit" value="Submit"> -->
        <button id = "edit"><img src="images/edit-icon.png" class="small noDrag"> <?php tooltip("Edit")?></button>
        <textarea id = "caption-textarea" placeholder = "Enter a caption! एक क्याप्सन प्रविष्ट गर्नुहोस्!"></textarea>
        <button id = "submit" class = "small"><img src="images/save-icon.png" class="small noDrag"><?php tooltip("Save")?></button>
    </div>
</div>
<?php
/*include either, but not both, of toolbar.php or toolbar-vertical.php*/
include ('includes/toolbar.php');
/*include ('includes/toolbar-vertical.php'); */
include ('includes/js-includes.php');
/*include looma header*/
?>

<script src="js/jquery.js">          </script>      <!-- jQuery -->
<script src = "js/looma-utilities.js"> </script>      <!-- Looma utility functions -->
<script src="js/looma-screenfull.js"></script>
<script src="js/jquery-ui.min.js"></script>
<script src="js/looma-picture-player.js"></script>
</body>