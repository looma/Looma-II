 <!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10, 2017 09
Revision: Looma .0
File: looma-library.php
Description:  displays and navigates content folders for Looma
-->

<?php $page_title = 'Looma Library';
        require ('includes/header.php');
        require ('includes/mongo-connect.php');

        // load: function makeActivityButton
        //params are ($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
        require('includes/looma-utilities.php');
?>

    <link rel = "Stylesheet" type = "text/css" href = "css/looma-library.css">
 </head>

<body>
    <div id="main-container-horizontal" class="scroll">

        <?php
            function natksort($array) {
                // Like ksort but uses natural sort instead
                $keys = array_keys($array);
                natsort($keys);

                foreach ($keys as $k)
                    $new_array[$k] = $array[$k];

                return $new_array;
            }; //end natksort()

 //***********MAIN CODE **********//

// get filepath to use for start of DIR traversal
    if (isset($_GET['fp'])) $path = $_GET['fp']; else $path = "../content/";

                // DEBUG echo "at path " . $path . "folderName is " . folderName($path);

    echo "<br><h3 class='title'>"; keyword('Looma Library'); echo ":  " . folderName($path) . "</h3>";

    echo "<button id='toggle-database' class='filesearch black-border'></button>";

//  first list directories in this directory
    echo "<br><table id='dir-table'><tr>";
    $buttons = 1;
    $maxButtons = 3;

    $files = [];

    if ( ! isEpaath($path) ) {

    //////
    //gather all the files at this directory into $files[] and sort by filename
    //////
    foreach (new DirectoryIterator($path) as $fileInfo) {$files[$fileInfo->getFilename()] = $fileInfo; };

    //NOTE: this sorts on FILENAME - really should sort on DISPLAYNAME
    $files = natksort($files);  //PHP key sort, sort on keys [e.g. filenames]


/********************************/
/**********  DIRs  **************/
/********************************/
/*************** iterate through the files in this DIR and make buttons for the DIRs ******************/

    foreach ($files as $file => $dirInfo) {

        //echo "filename is " . $path . $file;
        //echo "   and isDir is " . (is_dir($path . $file) ? "true" : "false");
        //echo "   and isFile is " . (is_file($path . $file)?"true":"false");
        //echo "<br>";

    //skips ".", "..", and any ".filename", and any directory containing a file named "hidden.txt"
    if ((is_dir($path . $file)) &&
        !isHTML($path . $file) &&
        $file[0] !== "." &&
        ( ! file_exists($path . $file . "/hidden.txt")))
    {

    //special case for Wikipedia for Schools
    //make a button that launches W4S index.htm -- virtual folder
         if($path . $file == "../content/W4S") {   //create a virtual folder for W4S
                echo "<td>";
                $dn = "Wikipedia for Schools";
                $ft = "html";
                $thumb = "../content/W4S/thumbnail.png";
                makeActivityButton($ft, "../content/W4S/", "index.htm", $dn, $thumb, "", "", "", "", "");
                echo "</td>";
                //$buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
        }  //end IF wiki4schools

    //special case for Khan Academy
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

    // regular case
    else {  //make a regular directory button

                echo "<td><a href='looma-library.php?fp=" . $path . $file .
                "/'><button class='activity img zeroScroll'>" .
                folderThumbnail($path . $file) . $file .
                "<span class='tip yes-show big-show' >" . $file . "</span>" .
                "</button></a></td>";
            }
    $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

        };
    }; // ********** end FOREACH directory  **************
};

/********************************/
/********  PSEUDO folders  ******/
/********************************/
/*************** make buttons for the "pseudo-folders" in this DIR ******************/


    echo "</tr></table>";
    echo "<hr>";

    //now list files in this directory

    echo "<br><table id='file-table'><tr>";
    $buttons = 1;
    $maxButtons = 3;
    $specials = array("_", "-", ".", "/", "'");

    //now show buttons for all the "files" in this dir,
    // including pseudo-files like maps, histories, edited-videos, epaath and slideshows

        //special case for EDITED VIDEOS
        //make buttons for EDITED VIDEOS directory -- virtual folder, populated from edited_videos collection in mongoDB
        //***************************
    if($path == "../content/edited videos/") {  //populate virtual folder of EDITED VIDEOs
        //If the folder being filled is the edited videos it fills it using
        //all of the entries from the edited_videos collection in the database
        $editedVideos = $edited_videos_collection->find();
        //SORT the found items before sending to client-side
        $editedVideos->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

         foreach ($editedVideos as $doc) {
                echo "<td>";
                $dn = $doc['dn'];
            /*  $fn = $doc['vn'] . ".mp4"; //NOTE: BUG: assumes all videos are .mp4. should save extension with evi collection
                $fp = $doc['vp'];  */
                $ft = "evi";
                $thumb = (isset($doc['thumb'])) ? $doc['thumb'] : "";
                $id = $doc['_id'];
                //$json = $doc['JSON'];  //NOTE: this passed the full text of the edited script in the URL.
                                       // should just pass the mongo ID and have the player retrieve the script's full text
                //  makeActivityButton($ft, $fp, $fn, $dn, "", "", $id, "", "", "");
                makeActivityButton($ft, "", "", $dn, $thumb, "", $id, "", "", "");

                echo "</td>";
                $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
        }
    }  //end IF edited videos

    else
        //special case for EPAATH
        //***************************
        if ($path == "../content/epaath/") {
            $path = $path . "activities/";
            $query = array('ft' => 'EP');
            $epaaths = $activities_collection->find($query);
            //SORT the found items before sending to client-side
            $epaaths->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

            foreach ($epaaths as $doc) {
                // display an EPAATH play button
                echo "<td>";
                    $file = $doc['fn'];
                    $thumb = "../content/epaath/activities/" . $file . "/thumbnail.jpg";
                    $dn = $doc['dn'];
                    // use UTILITY function makeActivityButton($ft, $fp, $fn, $dn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                    makeActivityButton("epaath", $path, $file, $dn, $thumb, "", "", "", "", "");
                echo "</td>";
                $buttons++; if ($buttons > $maxButtons) { $buttons = 1; echo "</tr><tr>";};
            }
        } //end if EP

     else

         //special case for SLIDESHOW
         //***************************
         //make buttons for SLIDESHOW directory -- virtual folder, populated from SLIDESHOWS collection in mongoDB
         if($path == "../content/slideshows/") {   //populate virtual folder of SLIDESHOWs
             //If the folder being filled is the slideshow it fills it using
             //all of the entries from the slideshows collection in the database

             $slideshows = $slideshows_collection->find();
             //SORT the found items before sending to client-side
             $slideshows->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

             foreach ($slideshows as $slideshow) {

                 echo "<td>";
                 $dn = $slideshow['dn'];
                 //$ft = $slideshow['ft'];
                 $data = $slideshow['data'];
                 $author = $slideshow['author'];
                 $date = $slideshow['date'];
                 $thumb = $slideshow['thumb'] ? $slideshow['thumb'] : "";
                 //NOTE: for now, fp and fn are concatenated in fn
                 //$path = $slideshow['fp'];

                 $ft = "slideshow";
                 $id = $slideshow['_id'];  //mongoID of the descriptor for this slideshow
                 makeActivityButton($ft, "", "", $dn, $thumb, "", $id, "", "", "");
                 echo "</td>";
                 $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
             } //end FOREACH slideshow
         }  //end IF slideshows
    else

        //special case for LESSONPLANs
        //***************************
        //make buttons for LESSONPLAN directory -- virtual folder, populated from lessons collection in mongoDB
        if($path == "../content/lessons/") {   //populate virtual folder of lesson plans

            $lessons = $lessons_collection->find();
            //SORT the found items before sending to client-side
            $lessons->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

             foreach ($lessons as $lesson) {

                 if ($lesson['ft'] == "lesson") {  //do not display lesson templates
                    echo "<td>";
                    $dn = $lesson['dn'];
                    $ft = "lesson";
                    $thumb = $path . "/thumbnail.png";
                    $id = $lesson['_id'];  //mongoID of the descriptor for this lesson
                    makeActivityButton($ft, "", "", $dn, $thumb, "", $id, "", "", "");
                    echo "</td>";
                    $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};
                }
            } //end FOREACH lesson
        }  //end IF lessons

    else

        //special case for History Timelines
        //***************************
        //make buttons for timelines directory -- virtual folder, populated from histories collection in mongoDB
        if($path == "../content/timelines/") {   //populate virtual folder of histories

            $histories = $histories_collection->find();
            //SORT the found items before sending to client-side
            $histories->sort(array('title' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

             foreach ($histories as $history) {

                        //echo "DEBUG   found lesson " . $lesson['dn'] . "<br>";
                    echo "<td>";
                    $dn = $history['title'];
                    $ft = "history";
                    $thumb = $path . $dn . "_thumb.jpg";
                    //$thumb = $path . "/thumbnail.png";
                    $id = $history['_id'];  //mongoID of the descriptor for this lesson
                    makeActivityButton($ft, "", "", $dn, $thumb, "", $id, "", "", "");
                    echo "</td>";
                    $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

            } //end FOREACH history
        }  //end IF histories

    else

        //special case for MAPS
        //***************************
        //make buttons for maps directory -- virtual folder, populated from maps collection in mongoDB
        if($path == "../content/maps/") {   //populate virtual folder of maps

            $query = array('ft' => 'map');
            $maps = $activities_collection->find($query);
            //SORT the found items before sending to client-side
            $maps->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

             foreach ($maps as $map) {

                    echo "<td>";
                    $dn = $map['dn'];
                    $url = $map['url'];
                    $ft = "map";
                    $thumb = $path . "/thumbnail.png";
                    $id = $map['_id'];  //mongoID of the descriptor for this lesson
                    makeActivityButton($ft, "", "", $dn, $thumb, "", $id, $url, "", "");
                    echo "</td>";
                    $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

            } //end FOREACH map
        }  //end IF maps

    else {


/********************************/
/**********  FILEs  *************/
/********************************/
/*************** iterate through the regular files in this DIR
 *************** and make buttons each of the FILES ******************/

        foreach ($files as $file => $info) {

            //skip ".", "..", and any ".filename" and any filename with '_thumb' in the name
            if (($file[0]  == ".")       ||
                 strpos($file, "_thumb") ||
                 $file == "thumbnail.png"||
                 $file == "images.txt")
            continue;


            //echo "file is " . $path . $file . " and is_file is " . (is_file($path . $file) ? "true" : "false") . "<br>";

            if (is_file($path . $file)) {

            //this code is also in looma-activities.php - should be a FUNCTION
            echo "<td>";
            $components = pathinfo($path . $file);
            $ext = $components["extension"];
            $base = $components["basename"];  //$base is filename w/o the file extension

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
                        // echo "DEBUG: " . $info -> getFilename() . "unknown filetype in looma-library.php";
                };  //end SWITCH
                echo "</td>";
                $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

                }

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

              } //end FOREACH file
            }
        echo "</tr></table>";
?>

    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-library.js"></script>
    </body>
