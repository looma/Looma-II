 <!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10
Revision: Looma 2.0.0
File: looma-library.php
Description:  displays and navigates content folders for Looma 2
-->

<?php $page_title = 'Looma Library';
        require ('includes/header.php');
        require ('includes/mongo-connect.php');

        // load: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
        require ('includes/activity-button.php');
?>
        <link rel = "Stylesheet" type = "text/css" href = "css/looma-library-search.css">
    </head>

    <body>
    <div id="main-container-horizontal" class="scroll">

<?php

    function folderName ($path) {
        // strip trailing '/' then get the last dir name, by finding the remaining last '/' and substring
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

        if ( $fp != '../content/Khan' && file_exists($fp . "/index.html") && !isEpaath($fp))
             return true;
        else return false;
    };  //end function isHTML

    function thumb_image ($fp) {  //for directories, look for filename "thumbnail.png" for a thumbnail representing the contents
        if (file_exists($fp . "/thumbnail.png")) {
             return "<img src='$fp/thumbnail.png' >"; }
        else return "";
    }; //end function thumbnail




            // get filepath to use for start of DIR traversal
            //this will be  "../content/" for Looma 2 Library starting folder [to be outside of web-accessible folder structure]

    if (isset($_GET['fp'])) $path = $_GET['fp'];
    else $path = "../content/";

            //echo "<br>DEBUG: directory is:  " .  $path . "<br><br>";

    //in ..resources/epaath/ DIR skip to ..resources/epaath/Activities/
    if (isEpaath($path)) {$path = $path . "activities/"; $ep = true;}
    else   $ep = false;

    // check if this DIR contains HTML media
    //$html = isHTML($path);  //handle folders containing 'index.html' differently below
                            //should also check for 'index.php' and others?

    // DEBUG echo "at path " . $path . "folderName is " . folderName($path);
    echo "<br><h3 class='title'>"; keyword('Looma Library');
    if(foldername($path) != 'content') {echo ":  " . folderName($path);} echo "</h3>";


/****** creating the search tool ******/
/**************************************/
/**************  Search  **************/
/**************************************/
/*
#search-panel has 4 sections. all optional. CSS sets them to display:none. use JS to make them visible
the sections are #type-filter, #class-subj-filter, #sort-criteria, and #search-criteria

in addition, in #type-filter, CSS sets all .typ-chk checkboxes to display:none. JS can turn on/off individual .typ-chk checkboxes.
*/


  /* add sources like in lesson planner
  action='looma-database-utilities.php' method='post'*/


    echo "<hr style='visibility:hidden;'><div id='search-panel'>
            <form id='search' name='search'>
                <input type='hidden' id='collection' value='activities' name='collection'/>
                <input type='hidden' id='cmd' value='search' name='cmd'/>";


/**************************************/
/********** Media v. Chapter **********/
/**************************************/
    echo "<div id='search-kind'>
            <input type='radio' name='radio' value='activities' class='filter-radio black-outline' id='ft-media' checked>
                <label class='filter_label' for='ft-media'>Media</label>
            <input type='radio' name='radio' value='chapters' class='filter-radio black-outline' id='ft-chapter'>
                <label class='filter_label' for='ft-chapter'>Chapter</label>
        </div>";


/**************************************/
/************* Search Bar *************/
/**************************************/
    echo "<div id='search-bar-div' class='media-filter'>
            <input id='search-term' class='media-input black-border' type='search' name='search-term' placeholder='Enter Search Term...'>&nbsp;
            <button id='cancel-search' type='button'>Clear</button>
                        <button id='media-submit' class = \"filesearch\" name=\"search\" value=\"value\" type=\"submit\">
                    <i class=\"fa fa-search\"></i></button>
       </div>";


/**************************************/
/********** File Type Fields **********/
/**************************************/
    echo "<div id='type-div' class='chkbox-filter media-filter'>
            <p>Type:</p>";

    $types = array(
        array("pdf", "vid",   "img",   "hist",    "ss",        "map", "evi",          "aud",   "txt", "lesson"),  //tags used as IDs for checkbox html elements
        array("pdf", "video", "image", "history", "slideshow", "map", "evi",          "audio", "text", "lesson"), //the 'ft' values used in the DB
        array("PDF", "Video", "Image", "History", "Slideshow", "Map", "Edited video", "Audio", "Text", "Lesson"), //human readable versions for labels displayed on checkboxes
    );
    for($x = 0; $x < count($types[0]); $x++) {
        echo "<span class='typ-chk' id='" . $types[0][$x] ."-chk'>
                <input id='" . $types[0][$x] ."' class='media-input flt-chkbx media-filter' type='checkbox' name='type[]'' value='" . $types[1][$x] . "'>
                <label class='filter-label' for='" . $types[0][$x] . "'>" . $types[2][$x] . "</label>
              </span>";/*if($x == 4){echo "<br>";}*/}
    echo "</div>";


/**************************************/
/********* File Source  Fields ********/
/**************************************/
    echo "<div id='source-div' class='chkbox-filter media-filter'>
            <p>Source:</p>";

    $sources = array(
        array("ck12", "phet", "epth", "khan", "w4s"),
        array("Dr Dann", "PhET", "ePaath", "khan", "wikipedia"),
        array("CK-12", "PhET", "ePaath", "Khan", "Wikipedia"),
    );
    for($x = 0; $x < count($sources[0]); $x++){
        echo "<span class='src-chk' id='" . $sources[0][$x] ."-chk'>
                <input id='" . $sources[0][$x] ."' class='media-input flt-chkbx' type='checkbox' name='src[]'' value='" . $sources[1][$x] . "'>
                <label class='filter-label' for='" . $sources[0][$x] . "'>" . $sources[2][$x] . "</label>
              </span>";}
    echo "</div>";


/**************************************/
/*********** Grade Dropdown  **********/
/**************************************/
    echo "<div id='grade-div' class='chapter-filter'> 
            <span class='drop-menu'>Grade:<select id='grade-drop-menu' class='chapter-input black-border' name='class' form='search'>
                <option value='' selected>Select...</option>";
    for($x = 1; $x <= 8; $x++){echo "<option value='" . $x . "' id='" . $x . "'>" . $x . "</option>";}

    echo "</select></span>";
    echo "<button id='media-submit' class='filesearch black-border' name='search' value='value' type='submit'></button>";
    echo "<button id='cancel-search' type='button'>Clear</button>";
    echo "</div>";


/**************************************/
/********* Subject Dropdown  **********/
/**************************************/
    echo "<div id='subject-div' class='chapter-filter'> 
          <span class='drop-menu'>Subject:<select id='subject-drop-menu' class='chapter-input black-border' name='subj' form='search'>
            <option value='' selected>Select...</option>";

    $classInfo = array(
        array("all", "EN", "N", "M", "S", "SS"),
        array("All", "English", "Nepali", "Math", "Science", "Social Studies"),
    );
    for($x = 1; $x < count($classInfo[0]); $x++) {
        echo "<option name='subj' value='" . $classInfo[0][$x] . "'>" . $classInfo[1][$x] . "</option>";}

    echo "</select></span></div>";


/**************************************/
/********* Chapter Dropdown  **********/
/**************************************/
    echo "<div id='chapter-div' class='chapter-filter'> 
            <span class='drop-menu'>Chapter:<select id='chapter-drop-menu' class='chapter-input black-border' name='chapter' form='search'>
                    <option value='' selected>Select...</option>
          </select></span></div>";

    echo "</form></div>";


/**************************************/
/*********** Search Results ***********/
/**************************************/
    echo "<div id='results-div'></div>";


/**************************************/
/********** Sorting Results ***********/
/**************************************/
    /*echo    "<div id='sort-criteria'>
                Sort By:
                <input type='radio' name='sort' value='name'> Filename
                <input type='radio' name='sort' value='type'> Filetype
            </div>";



/**************************************/
/********** Folder Hierarchy **********/
/************* Navigation *************/
/**************************************/
if(foldername($path) == 'content') {
        echo   "<br>";/*
                <div>
                    <fieldset>
                        <ul>
                            <legend>Content:</legend>
                            <li>Science</li>
                            <li>Math</li>
                            <li>Social Studies</li>
                            <li>English</li>
                            <li>Nepali</li>
                        </ul>
                    </fieldset>
                </div>*/
        echo "<button id='toggle-database' class='toggle black-border'></button>";
    }


/**************************************/
/**************************************/
/**************************************/

 /*  NOTE: removing code that is now in LOOMA-LIBRARY.PHP but not used here [list DIRS and FILES]
    //  first list directories in this directory

/**************************************
/**************************************
/**************************************

echo "<table id='dir-table'><tr>";
    if(foldername($path) == 'content') {echo "<style>#dir-table{display: none;}</style>";}

    $buttons = 1;
    $maxButtons = 3;
    // iterate through the files in this DIR and make buttons for each included DIR
    if ( ! $ep ) {


//*************** iterate through the files in this DIR and make buttons for the DIRs ******************
//******************************************************************************************************


//********************************
//**********  DIRs  **************
//********************************

        foreach (new DirectoryIterator($path) as $fileInfo) {
            $file =  $fileInfo->getFilename();
            //if ($file{0}  == ".") continue;  //skips ".", "..", and any ".filename" (more thorough than isDot() )

            if (($fileInfo -> isDir()) && !isHTML($path . $file) && $file[0] !== "." && ( ! file_exists($path . $file . "/hidden.txt")))
                //skips ".", "..", and any ".filename" (more thorough that isDot() )
                //skips any directory with a file named "hidden.txt"

             {
                if (file_exists($path . $file . "/slideshows.txt")) { //this dir represents slideshows. add a play button to the dir button
                     // ************************************************************************
                     // EDITED: This if statement creates a slideshow play button linking directories containing slideshows.txt files
                     // with Looma slideshow player

                    echo "<td>
                            <a href='looma-slideshow.php?dir=$path$file'>
                                    <button class='activity zeroScroll  with-play'>
                                        <img src='images/play-slideshow-icon.png' class='img-responsive'>
                                    </button>
                                </a>";
                    echo "<a href='looma-library.php?fp=" . $path . $file .
                         "/'><button class='activity img zeroScroll beside-play'>" .
                    thumb_image($path . $file) . $file . "</button></a></td>";

                    }

        //modifications for Wikipedia for Schools
        //make a button that launches W4S index.htm -- virtual folder
        else if($path . $file == "../content/W4S") {   //create a virtual folder for W4S
                    echo "<td>";
                    $dn = "Wikipedia for Schools";
                    $ft = "html";
                    $thumb = "../content/W4S/thumbnail.png";
                    makeActivityButton($ft, "../content/W4S/", "index.htm", $dn, $thumb, "", "", "", "", "");
                    echo "</td>";
                    //$buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
        }  //end IF wiki4schools

         //modifications for Khan Academy
        //make a button that launches Khan index.html -- virtual folder
        else if($path . $file == "../content/Khan") {   //create a virtual folder for Khan

                    echo "<td>";
                    $dn = "Khan Academy";
                    $ft = "html";
                    $thumb = "../content/Khan/thumbnail.png";
                    makeActivityButton($ft, "../content/Khan/", "index.html", $dn, $thumb, "", "", "", "", "");
                    echo "</td>";
                    //$buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
        }  //end IF Khan

        else {  //make a regular directory button

                    echo "<td><a href='looma-library.php?fp=" . $path . $file .
                    "/'><button class='activity img zeroScroll'>" .
                    thumb_image($path . $file) . $file . "</button></a></td>";
        }
        $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

            };
        }; // ********** end FOREACH directory  **************
    };

    echo "</tr></table>";

//******************************************************************************************************
//******************************************************************************************************
    //now list files in this directory

    if(foldername($path) == 'content') {echo "<br>";} echo "<table id='file-table'><tr>";
    $buttons = 1;
    $maxButtons = 3;
    $specials = array("_", "-", ".", "/", "'");

    if(foldername($path) == 'content') {echo "<hr>";}
    // iterate through the files in this DIR and make buttons for each included FILE


//*************** iterate through the files in this DIR and make buttons each of the FILES ******************
//******************************************************************************************************
//********************************
//**********  FILEs  *************
//********************************

        //modifications for EDITED VIDEOS
        //make buttons for EDITED VIDEOS directory -- virtual folder, populated from edited_videos collection in mongoDB
        //***************************
        if($path == "../content/edited videos/") {  //populate virtual folder of EDITED VIDEOs
            //If the folder being filled is the edited videos it fills it using
            //all of the entries from the edited_videos collection in the database
            $editedVideos = $edited_videos_collection->find();

                foreach ($editedVideos as $doc) {
                    echo "<td>";
                    $dn = $doc['dn'];
                    $fn = $doc['vn'] . ".mp4"; //NOTE: BUG: assumes all videos are .mp4. should save extension with evi collection
                    $fp = $doc['vp'];
                    $ft = "evi";
                    $id = $doc['_id'];
                    //$json = $doc['JSON'];  //NOTE: this passed the full text of the edited script in the URL.
                                           // should just pass the mongo ID and have the player retrieve the script's full text
                     // change to use: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton($ft, $fp, $fn, $dn, "", "", $id, "", "", "");
                    //makeEditedVideoButton($dn, $path, $ext, $file, $json);

                    echo "</td>";
                    $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
                }
        }  //end IF edited videos

        else

        //modifications for SLIDESHOW
        //***************************
        //make buttons for SLIDESHOW directory -- virtual folder, populated from SLIDESHOWS collection in mongoDB
        if($path == "../content/slideshows/") {   //populate virtual folder of SLIDESHOWs
            //If the folder being filled is the slideshow it fills it using
            //all of the entries from the slideshows collection in the database

           //echo "DEBUG number of slideshows is :" . $slideshows_collection->count();

            $slideshows = $slideshows_collection->find();
           //echo "DEBUG length of slideshows array is :" . count($slideshows);

             foreach ($slideshows as $slideshow) {

                        //echo "DEBUG   found slideshow " . $slideshow['dn'] . "<br>";

                    echo "<td>";
                    $dn = $slideshow['dn'];
                    $fn = $slideshow['fn'];
                    $fp = $slideshow['fp'];
                    $thumb = thumbnail($fn);
                      //NOTE: for now, fp and fn are concatenated in fn
                    //$path = $slideshow['fp'];

                    $ft = "slideshow";
                    $id = $slideshow['_id'];  //mongoID of the descriptor for this slideshow
                    makeActivityButton($ft, $fp, $fn, $dn, $thumb, "", $id, "", "", "");
                    echo "</td>";
                    $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
            } //end FOREACH slideshow
        }  //end IF slideshows


        else

        //modifications for LESSONPLANs
        //***************************
        //make buttons for LESSONPLAN directory -- virtual folder, populated from lessons collection in mongoDB
        if($path == "../content/lessons/") {   //populate virtual folder of lesson plans

           //echo "DEBUG number of lessons is :" . $lessons_collection->count();

            $lessons = $lessons_collection->find();

             foreach ($lessons as $lesson) {

                        //echo "DEBUG   found lesson " . $lesson['dn'] . "<br>";

                    echo "<td>";
                    $dn = $lesson['dn'];
                    $ft = "lesson";
                    $thumb = $path . "/thumbnail.png";
                    $id = $lesson['_id'];  //mongoID of the descriptor for this lesson
                    makeActivityButton($ft, "", "", $dn, $thumb, "", $id, "", "", "");
                    echo "</td>";
                    $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
            } //end FOREACH lesson
        }  //end IF lessons

        else {

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



                //then SORT
                //then iterate thru the array  making buttons

            //this code is also in looma-activities.php - should be a FUNCTION
            echo "<td>";
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

                        // use UTILITY function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                        makeActivityButton ($ext, $path, $file, $dn, "", "", "", "", "", "");
                        //makeButton($file, $path, $ext, $base, $dn, $path . $base . "_thumb.jpg");
                        break;

                    default:
                        // ignore unknown filetypes
                        // echo "DEBUG: " . $fileInfo -> getFilename() . "unkown filetype in looma-library.php";
                };  //end SWITCH
                echo "</td>";
                $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

                }
                else {  //handle Epaath special case
                    if ($ep) {
                        // display an EPAATH play button
                        echo "<td>";
                        $thumb = "../content/epaath/activities/" . $file . "/thumbnail.jpg";
                        $dn = 'ePaath ' . $file;
                        // use UTILITY function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                        makeActivityButton("epaath", $path, $file, $dn, $thumb, "", "", "", "", "");
                        //makeButton($file, $path, 'epaath', $file, 'ePaath ' . $file, $path . $file . "/thumbnail.jpg");
                        // change to use: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                        echo "</td>";
                        $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

                    } //end if EP
               else if (isHTML($path . $file)) {
                        // display an HTML play button
                        echo "<td>";
                        $thumb = $file . "/thumbnail.jpg";
                        $dn = $file;
                        // use UTILITY function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                        makeActivityButton("html", $path, $file . "/index.html", $dn, $thumb, "", "", "", "", "");
                        //makeButton($file, $path, 'epaath', $file, 'ePaath ' . $file, $path . $file . "/thumbnail.jpg");
                        // change to use: function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                        echo "</td>";
                        $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
                   } // end if HTML
                }
              } //end FOREACH file
            }
        echo "</tr></table>";

    //NOTE: end of commented out library code
 */
?>
    <h1 class = "credit">Created by Bo</h1>

    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <!--<script src="js/jquery-ui.min.js"></script>-->
    <script src="js/looma-library-search.js"></script>
    </body>
