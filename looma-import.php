<!doctype html>
<!--
Name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 04
Revision: Looma 2.0.0
File: looma-import.php
Description:  navigate content folders and import media files into activities collection in the database
              derived from looma-library.php
-->

<?php $page_title = 'Looma Import';
        require ('includes/header.php');
        require ('includes/mongo-connect.php');

        // load: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
        //require ('includes/activity-button.php');
?>
    <link rel="stylesheet" href="css/looma-import.css">
    </head>

    <body>
    <div id="main-container-horizontal" class="scroll">

<?php

    function folderName ($path) {
        // strip trailing '/' then get the last dir name, by finding the remaining last '/' and substr'ing
         $a = explode("/", $path);
         return $a[count($a) - 2];
    };  //end FOLDERNAME()

    function isEpaath($fp) {
        //echo "<br>DEBUG: in isEpaath, FP is " . $fp . " Substr is " . mb_substr($fp, -7, 7);

        if (mb_substr($fp, -7, 7) == "epaath/")
             return true;
        else return false;
    }; //end function isEpaath

    function isHTML($fp) {

        //echo "DEBUG: in isHTML - fp = " . $fp . " and fileexists = " . (file_exists($fp . "/index.html")?"true":"false"). "<br>";

        if (file_exists($fp . "/index.html") && !isEpaath($fp))
             return true;
        else return false;
    };  //end function isHTML

    function thumb_image ($fp) {  //for directories, look for filename "thumbnail.png" for a thumbnail representing the contents
        if (file_exists($fp . "/thumbnail.png")) {
             return "<img src='$fp/thumbnail.png' >"; }
        else return "";
    }; //end function thumbnail

///////////////////
///  main code  ///
///////////////////

    if (!loggedin()) header('Location: looma-login.php');

            // get filepath to use for start of DIR traversal
            //this will be  "../content/" for Looma 2 Library starting folder [to be outside of web-accessible folder structure]

    if (isset($_GET['fp'])) $path = $_GET['fp'];
    else $path = "../content/";

            //echo "<br>DEBUG: directory is:  " .  $path . "<br><br>";

    //in ..resources/epaath/ DIR skip to ..resources/epaath/Activities/
    //if (isEpaath($path)) {$path = $path . "activities/"; $ep = true;}
    //else   $ep = false;

    // DEBUG echo "at path " . $path . "folderName is " . folderName($path);
    echo "<h3 class='title'>"; keyword('Looma Import'); echo "</h3>";

    //  first list directories in this directory
    echo "<table id='dir-table'><tr>";
    $buttons = 1;
    $maxButtons = 3;

    // iterate through the files in this DIR and make buttons for each included DIR

        //TODO: should gather all the filenames into an array and sort it, use (natcasesort() or multisort(), before making the buttons

/*************** iterate through the files in this DIR and make buttons for the DIRs ******************/
/******************************************************************************************************/
/********************************/
/**********  DIRs  **************/
/********************************/

        foreach (new DirectoryIterator($path) as $fileInfo) {
            $file =  $fileInfo->getFilename();
            //if ($file{0}  == ".") continue;  //skips ".", "..", and any ".filename" (more thorough than isDot() )

            if (($fileInfo -> isDir()) &&  $file[0] !== "." && ( ! file_exists($path . $file . "/hidden.txt")))
                //skips ".", "..", and any ".filename" (more thorough that isDot() )
                //skips any directory with a file named "hidden.txt"


            {  //make a regular directory button

                echo "<td><a href='looma-import.php?fp=" . $path . $file .
                "/'><button class='activity img zeroScroll'>" .
                thumb_image($path . $file) . $file . "</button></a></td>";

                $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

            };
        }; // ********** end FOREACH directory  **************
/******************************************************************************************************/
/******************************************************************************************************/

    echo "</tr></table>";

    //now list files in this directory

    //echo "<br><table id='file-table'><tr>";
    $buttons = 1;
    $maxButtons = 3;
    $specials = array("_", "-", ".", "/", "'");

    //echo "<hr>";
    // iterate through the files in this DIR and make buttons for each included FILE

    //TODO: should gather all the filenames into an array and sort it, use (natcasesort() or multisort(), before making the buttons

/*************** iterate through the files in this DIR and make buttons each of the FILES ******************/
/******************************************************************************************************/
/********************************/
/**********  FILEs  *************/
/********************************/

        echo "<div id='buttons'>";
        echo "<h5 class='title'> Working in directory:  " . $path . "</h5>";
        echo "<button id='check'> Check All </button>";
        echo "<button id='uncheck'> Uncheck All </button>";
        echo "<button type='submit' form='list'>Submit</button><br>";
        echo "</div>";

        echo "<hr>";
        echo "<form id='list' name='list'>";

        foreach (new DirectoryIterator($path) as $fileInfo) {
            $file =  $fileInfo->getFilename();

            //echo "DEBUG     found " . $file . "<br>";

            //skip ".", "..", and any ".filename" and any filename with '_thumb' in the name
            if (($file[0]  == ".")       ||
                 strpos($file, "_thumb") ||
                 $file == "thumbnail.png"||
                 $file == "images.txt")
            continue;

            if ($fileInfo -> isFile()) {

                //insert code here to sort the filenames before sending them to client side
                // iterate thru the directory, storing valid files in an array
                /* $files = arr
                 foreach {$files[] =$file;]
                 * $files = array_sort($files);
                 * while ?? $next = array)shift($files);
                 *
                */

                //then SORT
                //then iterate thru the array  making buttons

            //this code is also in looma-activities.php - should be a FUNCTION
            $ext = $fileInfo -> getExtension();
            $file = $fileInfo -> getFilename();
            $base = trim($fileInfo -> getBasename($ext), ".");  //$base is filename w/o the file extension

            // look in the database to see if this file has a DISPLAYNAME
                $query = array('fn' => $file);

                $projection = array('_id' => 0,
                                    'dn' => 1,
                                    );
                $activity = $activities_collection -> findOne($query, $projection);

                $dn = ($activity && array_key_exists('dn', $activity)) ? $activity['dn'] : str_replace($specials, " ", $base);
            //
            //DEBUG   echo "activity is " . $activity['dn'] . " looked up '" . $file . "' and got '" . $dn . "'";

                switch (strtolower($ext)) {
                    case "video":
                    case "mp4":
                    case "m4v":
                    case "mov":

                    case "image":
                    case "jpg":
                    case "png":
                    case "gif":

                    case "audio":
                    case "mp3":

                    case "pdf":
                    case "html":

                    // at top: display the FP being shown
                    // in middle frame: display scrollable list of:
                    //      a checkbox, input with DN, FN, inputs for tag(s)
                    //      with the row 'grayed' out if already imported into Activities
                    // at bottom display FP, input (area), input (sub-area)

                    echo "<input type='checkbox' form='list' class='filter_checkbox'>" .
                         "<input class='text' name='dn' value='" . $dn . "'>" .
                         "<span class='fn'>" . $file .  "</span>" .
                         "<input class='text' name='tags'>" .
                         "<span>tag1, tag2</span><br>";

                        break;

                    default:
                        // ignore unknown filetypes
                        // echo "DEBUG: " . $fileInfo -> getFilename() . "unkown filetype in looma-import.php";
                };  //end SWITCH
               // $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

                }

              } //end FOREACH file

        echo "</form>";
?>

    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/looma-import.js"></script>

    </body>