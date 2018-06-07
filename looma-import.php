<!doctype html>
<!--
Name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 04
Revision: Looma 2.0.0
File: looma-import.php
Description:  navigate content folders and import media files into activities collection in the database
              derived from looma-library.php


    GENERALLY, this code is improved and obsoleted by looma-import-content.php

      NOTES (2018 03)
        - navigates in folders in ../content/
        - allows selecting indivudual files
        - allows setting DN and "tags" for those files
        - no backend implemented

      CHANGES TO MAKE
        - change tag inputs to keyword dropdowns
        - implement SUBMIT backend
        - SORT the DIRs and FILEs before displaying

        - dont show 'hidden.txt'

-->

<?php $page_title = 'Looma Import';
        require ('includes/header.php');
        require ('includes/mongo-connect.php');
        require('includes/looma-utilities.php');
?>

    <link rel="stylesheet" href="css/looma-import.css">
    </head>

    <body>
    <div id="main-container-horizontal" class="scroll">

<?php


///////////////////
///  main code  ///
///////////////////

    if (!loggedin()) header('Location: looma-login.php');

    if (isset($_GET['fp'])) $path = $_GET['fp'];
    else $path = "../content/";

    echo "<h3 class='title'>"; keyword('Looma Import'); echo "</h3>";

    //  first list directories in this directory
    echo "<table id='dir-table'><tr>";
    $buttons = 1;
    $maxButtons = 3;

    // iterate through the files in this DIR and make buttons for each included DIR
    //change backend PHP code to SORT files

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
                folderThumbnail($path . $file) . $file . "</button></a></td>";

                $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

            };
        }; // ********** end FOREACH directory  **************

/******************************************************************************************************/

    echo "</tr></table>";

    $buttons = 1;
    $maxButtons = 3;
    $specials = array("_", "-", ".", "/", "'");

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

        /*************** iterate through the files in this DIR and make buttons each of the FILES ******************/

        //change backend PHP code to SORT files

        foreach (new DirectoryIterator($path) as $fileInfo) {
            $file =  $fileInfo->getFilename();

            //skip ".", "..", and any ".filename" and any filename with '_thumb' in the name
            if (($file[0]  == ".")       ||
                 strpos($file, "_thumb") ||
                 $file == "thumbnail.png"||
                 $file == "images.txt")
            continue;

            if ($fileInfo -> isFile()) {

//change backend PHP code to SORT files

                $ext = $fileInfo->getExtension();
                $file = $fileInfo->getFilename();
                $base = trim($fileInfo->getBasename($ext), ".");  //$base is filename w/o the file extension

                // look in the database to see if this file has a DISPLAYNAME
                $query = array('fn' => $file);

                $projection = array('_id' => 0, 'dn' => 1);
                $activity = $activities_collection->findOne($query, $projection);
                $dn = ($activity && array_key_exists('dn', $activity)) ? $activity['dn'] : str_replace($specials, " ", $base);

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

                        echo "<input type='checkbox' form='list' class='filter_checkbox'>" .
                            "<input class='text' name='dn' value='" . $dn . "'>" .
                            "<span class='fn'>" . $file . "</span>" .
                            "<input class='text' name='tags'>" .
                            "<span>tag1, tag2</span><br>";

                        break;

                    default:
                }
            }
        } //end FOREACH file

        echo "</form>";
?>

    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/looma-import.js"></script>

    </body>
