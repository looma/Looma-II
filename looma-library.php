<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10, 2017 09
Revision: Looma .0
File: looma-library.php
Description:  displays and navigates content folders for Looma
-->

<?php $page_title = 'Looma Library';
        require ('includes/header.php');
        require ('includes/mongo-connect.php');
        // using function makeActivityButton from includes/looma-utilities.php
        //usage: makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id,
        //                          $mongo_id, $ole_id, $url, $pg, $zoom,
        //                          $grade, $epversion, $nfn, $npg,$prefix,$lang)
        require('includes/looma-utilities.php');?>

    <link rel = "Stylesheet" type = "text/css" href = "css/looma-library.css">
</head>

<body>
    <div id="main-container-horizontal" class="scroll">

<?php

    function folderDisplayName($folder) {
        global $folders_collection;
        // look in the database to see if this folder has a DISPLAYNAME
        $query = array('fn' => $folder);
        $projection = array('_id' => 0, 'dn' => 1, 'ndn' => 1);
        $folderMongo = mongoFindOne($folders_collection, $query);

        if ($folderMongo) {
            if (keyIsSet('dn', $folderMongo) && keyIsSet('ndn', $folderMongo)) {

                if ($folderMongo['ndn'] === "") $folderMongo['ndn'] = $folderMongo['dn'];

                echo "<span class='english-keyword'>"
                    . $folderMongo['dn'] .
                    "<span class='xlat'>" . $folderMongo['ndn'] . "</span>" .
                    "</span>";
                echo "<span class='native-keyword' >"
                    . $folderMongo['ndn'] .
                    "<span class='xlat'>" . $folderMongo['dn'] . "</span>" .
                    "</span>";
            } else if (keyIsSet('dn', $folderMongo)) echo $folderMongo['dn'];
        }  else echo $folder;
    }  //end folderDisplayName()

    function nextButton() {
        global $buttons, $maxButtons;
        $buttons++;
        if ($buttons > $maxButtons) { $buttons = 1; echo "</tr><tr>";}
    }

// get filepath to use for start of DIR traversal
    if (isset($_GET['fp'])) $path = $_GET['fp']; else $path = "../content/";

    echo "<br><h3 class='title'>"; keyword('Looma Library'); echo ":  ";
    folderDisplayName(folderName($path));
    echo "</h3>";

    echo "<button id='toggle-database' class='filesearch black-border big-show'>";
         echo "<img draggable='false' src='images/search.png'>";
   tooltip("Library Search");
    echo "</button>";

//////////////////////////////////////////////
//  first list DIRECTORIES in this directory
//////////////////////////////////////////////

    echo "<table id='dir-table'><tr>";
    $dircount = 0;
    $buttons = 1;
    $maxButtons = 3;

    $files = [];

    //gather all the files at this directory into $files[]

    foreach (new DirectoryIterator($path) as $fileInfo) {
        $files[$fileInfo->getFilename()] = $fileInfo;
    }

   //if at the top level folder "../content", then move Wikipedia, ePaath and Khan to the top so they are presented first
    if ($path == "../content/") {
        $tmp = $files['Khan'];
        unset($files['Khan']);
        $files = array('Khan' => $tmp) + $files;

        $tmp = $files['epaath'];
        unset($files['epaath']);
        $files = array('epaath' => $tmp) + $files;

        $tmp = $files['W4S'];
        unset($files['W4S']);
        $files = array('W4S' => $tmp) + $files;
    }

    /********************************************************************************************/
    /**********  DIRs  **************************************************************************/
    /********************************************************************************************/
    /*************** iterate through the files in this DIR and make buttons for the DIRs ********/

    $dirlist = array();

    foreach ($files as $file => $dirInfo) {

    //skips ".", "..", and any ".filename", and any directory containing a file named "hidden.txt"
    if ((is_dir($path . $file)) &&
        !isHTML($path . $file) &&
        $file[0] !== "." &&
        (!file_exists($path . $file . "/hidden.txt"))) {
            $dircount++;

        //special case for Wikipedia for Schools
        //make a button that launches W4S index.htm -- virtual folder
            if ($path . $file == "../content/W4S") {   //create a virtual folder for W4S
                echo "<td>";
                $dn = "Wikipedia";
                $ndn = "विकिपीडिया";
                $ft = "html";
                $thumb = "../content/W4S/thumbnail.png";
                makeActivityButton($ft, "../content/W4S/", "index.htm", $dn, $ndn, $thumb, "", "", "", "", "", "", "", "", null, null,null,null);
                echo "</td>";
                nextButton();
            }  //end IF wiki4schools

        //special case for Khan Academy
        //make a button that launches Khan index.html -- virtual folder
            else if ($path . $file == "../content/Khan") {   //create a virtual folder for Khan

                echo "<td>";
                $dn = "Khan Academy";
                $ndn = "खान";
                $ft = "html";
                $thumb = "../content/Khan/thumbnail.png";
                makeActivityButton($ft, "../content/Khan/", "index.html", $dn, $ndn, $thumb, "", "", "", "", "", "", "", "", null, null,null,null);
                echo "</td>";
                nextButton();
            }  //end IF Khan


        //special case for Khan Academy
        //make a button that launches Khan index.html -- virtual folder
            else if ($path . $file == "../content/epaath") {   //create a virtual folder for ePaath

                echo "<td>";
                $dn = "ePaath";
                $ndn = "खान";
                $ft = "html";
                $thumb = "../content/epaath/thumbnail.png";
                makeActivityButton($ft, "../ePaath/", "index.html", $dn, $ndn, $thumb, "", "", "", "", "", "", "", "", null, null,null,null);
                echo "</td>";
                nextButton();
            }  //end IF Khan

            // regular DIRECTORY case
            else {  //make a regular directory button
                $ft = ""; $prefix = "";
                // look in the database to see if this folder has a DISPLAYNAME
                $query = array('fn' => $file, 'fp' => $path);
                //$projection = array('_id' => 0, 'dn' => 1, 'ndn' => 1);
                $folderMongo = mongoFindOne($folders_collection, $query);

                $dirnDn = null;
                if ($folderMongo) {
                    if (keyIsSet('dn',  $folderMongo)) $dirDn = $folderMongo['dn'];
                    if (keyIsSet('ndn', $folderMongo) && $folderMongo['ndn'] !=="") $dirnDn = $folderMongo['ndn'];
                    if (keyIsSet('ft',  $folderMongo)) $ft = $folderMongo['ft'];
                    if (keyIsSet('prefix',  $folderMongo)) $prefix = $folderMongo['prefix'];

                    //   echo "dir is " . $dirDn . " ft is " . $ft;

                } else {
                    $dirDn = $file;  $dirnDn = $file;  // skip bug fix 2020 01
                }
                $dirlist[] = array('file' => $file, 'path' => $path, 'dn' => $dirDn, 'ndn' => $dirnDn, 'ft' => $ft, 'prefix' => $prefix);
            }
        }
    }// ********** end FOREACH directory  **************

    if (sizeof($dirlist) > 0) {
        // sort the list of dirs by DN
        $dirlist = alphabetize_by_dn($dirlist);

        foreach ($dirlist as $dir) {

            if (isset($dir['ft']) && $dir['ft'] === "book")
                 echo "<td><a class='book' href='looma-book.php?fp=" . $dir['path'] . $dir['file'] .
                      "/&prefix=" . $dir['prefix'] .
                      "&dn=" . $dir['dn'] .
                      "&ndn=" . $dir['ndn'] .
                      "'>";
            else echo "<td><a href='looma-library.php?fp=" . $dir['path'] . $dir['file'] . "/'>";
            echo "<button class='activity img zeroScroll'>" .
                folderThumbnail($dir['path'] . $dir['file']);

            echo "<span class='english-keyword'>"
                . $dir['dn'] .
                "<span class='xlat'>" . $dir['ndn'] . "</span>" .
                "</span>";
            echo "<span class='native-keyword' >"
                . $dir['ndn'] .
                "<span class='xlat'>" . $dir['dn'] . "</span>" .
                "</span>";
            echo "<span class='tip yes-show big-show' >" . $dir['file'] . "</span>" .
                "</button></a></td>";
            nextButton();
        }
    }

echo "</tr></table>";

    /********************************/
    /********  PSEUDO folders  ******/
    /********************************/
    /*************** make buttons for the "pseudo-folders" in this DIR ******************/

    $buttons = 1;
    $maxButtons = 3;
    $specials = array("_", "-", ".", "/", "'");

    //now show buttons for all the "files" in this dir,
    // including pseudo-files like maps, histories, edited-videos, epaath and slideshows

    //special case for EDITED VIDEOS
    //make buttons for EDITED VIDEOS directory -- virtual folder, populated from edited_videos collection in mongoDB
    //***************************
    if ($path == "../content/edited videos/") {  //populate virtual folder of EDITED VIDEOs
        //If the folder being filled is the edited videos it fills it using
        //all of the entries from the edited_videos collection in the database
        $editedVideos = mongoFind($edited_videos_collection, [], 'dn', null, null);
        //SORT the found items before sending to client-side
        //$editedVideos->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

        echo "<table id='file-table'><tr>";

        foreach ($editedVideos as $doc) {
            echo "<td>";
            $dn = $doc['dn'];
            $ft = "evi";
            $thumb = (isset($doc['thumb'])) ? $doc['thumb'] : "";
            $id = $doc['_id'];
            //$json = $doc['JSON'];  //NOTE: this passed the full text of the edited script in the URL.
            // should just pass the mongo ID and have the player retrieve the script's full text
            makeActivityButton($ft, "", "", $dn, "", $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);

            echo "</td>";
            nextButton();
        }
    }  //end IF edited videos

    else
        //special case for EPAATH
        //***************************
        if ($path == "../content/epaath/") {
            $path = $path . "activities/";
            $query = array('ft' => 'EP');
            $epaaths = mongoFind($activities_collection, $query, 'dn', null, null);
            //SORT the found items before sending to client-side
            //$epaaths->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

            echo "<table id='file-table'><tr>";

            foreach ($epaaths as $doc) {
                // display an EPAATH play button
                echo "<td>";
                if ($doc['version'] == 2015) {
                    $file = $doc['fn'];
                    $thumb = "../content/epaath/activities/" . $file . "/thumbnail.jpg";
                    $dn = $doc['dn'];
                    $ndn = $doc['ndn'];
                    if (isset($doc['ndn'])) $ndn = $doc['ndn']; else $ndn = $dn;
                    makeActivityButton("EP", $path, $file, $dn, $ndn, $thumb, "", "", "", "", "", "", "", $doc['version'], null, null,null,null);
                } else {
                    makeActivityButton("EP", "", "", $doc['dn'], $doc['ndn'], $doc['thumb'], "", "", $doc['oleID'], "", "", "", $doc['grade'], $doc['version'], null, null,null,null);
                }
                echo "</td>";
               nextButton();
            }
        } //end if EP

        else
            //special case for SLIDESHOW
            //***************************
            //make buttons for SLIDESHOW directory -- virtual folder, populated from SLIDESHOWS collection in mongoDB
            if ($path == "../content/slideshows/") {   //populate virtual folder of SLIDESHOWs
                //If the folder being filled is the slideshow it fills it using
                //all of the entries from the slideshows collection in the database

                $slideshows = mongoFind($slideshows_collection, [], 'dn', null, null);
                //SORT the found items before sending to client-side
                //$slideshows->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

                echo "<table id='file-table'><tr>";

                foreach ($slideshows as $slideshow) {

                    echo "<td>";
                    $dn = $slideshow['dn'];
                    if (isset($slideshow['ndn'])) $ndn = $slideshow['ndn']; else $ndn = $dn;
                    //$ft = $slideshow['ft'];
                    $data = $slideshow['data'];
                    $author = $slideshow['author'];
                    $date = $slideshow['date'];
                    if (isset($slideshow['thumb'])) $thumb = $slideshow['thumb']; else $thumb = "";
                    //NOTE: for now, fp and fn are concatenated in fn
                    //$path = $slideshow['fp'];

                    $ft = "slideshow";
                    $id = $slideshow['_id'];  //mongoID of the descriptor for this slideshow
                    makeActivityButton($ft, "", "", $dn, $ndn, $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);
                    echo "</td>";
                    nextButton();
                } //end FOREACH slideshow
            }  //end IF slideshows
            else

                //special case for LESSONPLANs
                //***************************
                //make buttons for LESSONPLAN directory -- virtual folder, populated from lessons collection in mongoDB
                if ($path == "../content/lessons/") {   //populate virtual folder of lesson plans

                    $lessons = mongoFind($lessons_collection, [], 'dn', null, null);
                    //SORT the found items before sending to client-side
                    //$lessons->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

                    echo "<table id='file-table'><tr>";

                    foreach ($lessons as $lesson) {

                        if (keyIsSet('ft', $lesson) && ($lesson['ft'] == "lesson")) {  //do not display lesson templates
                            echo "<td>";
                            $dn = $lesson['dn'];
                            $ft = "lesson";
                            $thumb = $path . "/thumbnail.png";
                            $id = $lesson['_id'];  //mongoID of the descriptor for this lesson
                            makeActivityButton($ft, "", "", $dn, "", $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);
                            echo "</td>";
                          nextButton();
                        }
                    } //end FOREACH lesson
                }  //end IF lessons

                else

                    //special case for History Timelines
                    //***************************
                    //make buttons for timelines directory -- virtual folder, populated from histories collection in mongoDB
                    if ($path == "../content/timelines/") {   //populate virtual folder of histories

                        $histories = mongoFind($histories_collection, [], 'title', null, null);
                        //SORT the found items before sending to client-side
                        //$histories->sort(array('title' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

                        echo "<table id='file-table'><tr>";

                        foreach ($histories as $history) {

                            //echo "DEBUG   found history " . $history['dn'] . "<br>";
                            echo "<td>";
                            $dn = $history['title'];
                            if (isset($history['ndn'])) $ndn = $history['ndn']; else $ndn = $dn;
                            $ft = "history";
                            $thumb = $path . $dn . "_thumb.jpg";
                            //$thumb = $path . "/thumbnail.png";
                            $id = $history['_id'];  //mongoID of the descriptor for this history
                            makeActivityButton($ft, "", "", $dn, $ndn, $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);
                            echo "</td>";
                            nextButton();

                        } //end FOREACH history
                    }  //end IF histories

                    else

                        //special case for MAPS
                        //***************************
                        //make buttons for maps directory -- virtual folder, populated from maps collection in mongoDB
                        if ($path == "../content/maps/") {   //populate virtual folder of maps

                            $query = array('ft' => 'map');
                            $maps = mongoFind($activities_collection, $query, 'dn', null, null);
                            //SORT the found items before sending to client-side
                            //$maps->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

                            echo "<table id='file-table'><tr>";

                            foreach ($maps as $map) {

                                echo "<td>";
                                $dn = $map['dn'];
                                $ndn = (isset($map['ndn'])) ? $map['ndn'] : $dn;
                                //$url = $map['url'];
                                $ft = "map";
                                if (isset($map['thumb'])) $thumb = $map['thumb']; else $thumb = $path . "/thumbnail.png";
                                $id = $map['mongoID'];  //mongoID of the descriptor for this map
                                makeActivityButton($ft, "", "", $dn, $ndn, $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);
                                echo "</td>";
                               nextButton();

                            } //end FOREACH map
                        }  //end IF maps

                        else {

                        /********************************/
                        /**********  FILEs  *************/
                        /********************************/

                        /*************** iterate through the regular files in this DIR
                         *************** and make buttons each of the FILES ****************/
                        /*******get their DNs from mondoDB and sort on DN***********/
                        /*************before displaying the results ****************/

                        $list = array();

                            foreach ($files as $file => $info) {
                            //skip ".", "..", and any ".filename" and any filename with '_thumb' in the name
                            if (($file[0] == ".") ||
                                strpos($file, "_thumb") ||
                                $file == "thumbnail.png" ||
                                $file == "images.txt")
                                continue;

                            if (is_file($path . $file)) {
                                $components = pathinfo($path . $file);
                                if (isset($components['extension'])) $ext = $components["extension"]; else $ext="";
                                $base = $components["basename"];  //$base is filename w/o the file extension
                                $mongoID = null;

                                if ($ext === 'lesson') {  //we have some "lessons" that are listed in Teacher Tools directory as pseudo-files
                                    $dn = $components["filename"];
                                    $query = array('dn' => $dn);
                                    $activity = mongoFindOne($activities_collection, $query);
                                    if ($activity) $mongoID = strval($activity['mongoID']);
                                } else {   // look in the database to see if this file has a DISPLAYNAME
                                    $query = array('fn' => $file);
                                    $activity = mongoFindOne($activities_collection, $query);
                                    $dn =  ($activity && keyIsSet('dn', $activity))  ? $activity['dn']  : str_replace($specials, " ", $base);
                                    $ndn = ($activity && keyIsSet('ndn', $activity)) ? $activity['ndn'] : str_replace($specials, " ", $dn);
                                }

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
                                    case "m4a":
                                    case "pdf":
                                    case "html":
                                    case "lesson": //we have some "lessons" that are listed in Teacher Tools directory as pseudo-files
                                        $item['ext'] = $ext;
                                        $item['path'] = $path;
                                        $item['file'] = $file;
                                        $item['dn'] = $dn;
                                        $item['ndn'] = $ndn;
                                        $item['thumb'] = "";
                                        $item['mongoID'] = $mongoID;

                                            $item['page']  = ($activity && keyIsSet('pn', $activity)) ? $activity['pn'] : 1;
                                            $item['zoom'] = ($activity && keyIsSet('zoom', $activity)) ? $activity['zoom'] : 2.2;

                                        $list[] = $item;

                                    break;
                                    default:
                                        // ignore unknown filetypes
                                }  //end SWITCH
                            } else if (isHTML($path . $file)) {
                                $item['ext'] = "html";
                                $item['path'] = $path;
                                $item['file'] = $file . "/index.html";
                                $item['dn'] = $file;
                                $item['ndn'] = "";
                                $item['thumb'] = $file . "/thumbnail.jpg";
                                $item['mongoID'] = "";

                                $list[] = $item;
                            } // end if HTML

                        } //end FOREACH file;

                        if (sizeof($list) > 0) {
                            // sort the list of files by DN
                            $list = alphabetize_by_dn($list);

                            if ($dircount > 0) echo "<hr>";
                            echo "<table id='file-table'><tr>";

                            foreach ($list as $item) {

                            //echo "filemane " . $file . "  dn: " . $item['dn'] . "  ndn: " . $item['ndn'] ;

                                echo "<td>";
                                makeActivityButton($item['ext'], $item['path'], $item['file'], $item['dn'],
                                    $item['ndn'], $item['thumb'], "",
                                    $item['mongoID'], "", "",  $item['page'],  $item['zoom'], "", "", null, null,null,null);
                                echo "</td>";
                                nextButton();
                            }
                        }
                    }
    echo "</tr></table>";
//  };  //if (isEpaath())
?>

    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-library.js"></script>
</body>
