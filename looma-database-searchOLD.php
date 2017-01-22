<?php
/*
Filename:  looma-databse-search.php
Description: server side code for SEARCH commands to mongoDB
Programmer : Skip
Adapted from: looma-contentNav-results.php by Ian Costello
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Nov 2016
Revision: 1.0
*/

include ('includes/mongo-connect.php');

/*****************************/
/****   main code here    ****/
/*****************************/

// called (from looma-search.php/.js) using POST with FORMDATA serialized by jquery
// $_POST[] can have these collection, indexes: class, subj, sort, search-term, and type[] (arroy of checked types)

    $collection =  $_REQUEST["collection"];

    switch ($collection) {
       case "text":
           $dbCollection =  $text_files_collection;
           break;
       case "activities":
           $dbCollection =  $activities_collection;
           break;
       default: return;
    };

    //Get filetype Parameters
    /* known filetypes are the FT values in Activities collection
     * e.g. 'video', 'audio', 'image', 'pdf', 'textbook', 'text', 'html', 'slideshow'*/

    $fileTypes = array();       //array of FT filetypes to include in the search

    if (!isset($_POST['type'])) $fileTypes = array("video", "audio", "image", "pdf", "textbook", "text", "text-template", "html", "slideshow");
    else { foreach ($_POST['type'] as $i) array_push($fileTypes, $i);};


    //DEBUG
    //print_r($_POST['type']); echo "<br><br>";
    //echo "extensions to search for:  ";
    //foreach($fileTypes as $e) echo $e . "<br>";


    $extensions = array();
    // build $extensions[] array by pushing filetype names into the array
    foreach ($fileTypes as $type)
    switch ($type) {

        case 'video':
            array_push($extensions, "mp4", "video", "mov");
            break;

        case 'audio':
            array_push($extensions, "mp3", "audio");
            break;

        case 'image':
            array_push($extensions, "image", "jpg", "png", "gif");
            break;

        case 'html':
            array_push($extensions, "EP", "html", "htm", "php", "asp");
            break;

        case 'pdf':
            array_push($extensions, "pdf");
            break;

        case 'text':
            array_push($extensions, "text");
            break;

        case 'text-template':
            array_push($extensions, "text-template");
            break;

        case 'textbook':
            array_push($extensions, "textbook");
            break;

        case 'slideshow':
            array_push($extensions, "slideshow");
            break;
    };


    //DEBUG
    //echo "extensions to search for:  ";
    //foreach($extensions as $e) echo $e . "   ";


    //Build Regex .* is anything and i is ignore case
    $regex = new MongoRegex('/' . $_POST["search-term"] . '/i');

    //Query For Item
    $query = array("dn" => $regex, 'ft' => array('$in' => $extensions));
    $cursor = $dbCollection->find($query);   //->skip($page)->limit(20);

        //DEBUG
        //print_r($cursor);

    echo "<table>";

    if ($cursor -> count() > 0) {
    foreach ($cursor as $d)
    {
        //Grab The ID, Title, and description
        $d_id    = array_key_exists('_id', $d) ? $d['_id'] : null;
        $d_title = array_key_exists('dn', $d) ? $d['dn'] : null;
        $d_file  = array_key_exists('fn', $d) ? $d['fn'] : null;
        $d_ft    = array_key_exists('ft', $d) ? $d['ft'] : null;
        $d_path  = array_key_exists('fp', $d) ? $d['fp'] : null;
        $chid    = array_key_exists('ch_id', $d) ? $d['ch_id'] : null;
        $html    = array_key_exists('html', $d) ? $d['html'] : null;
        $date    = array_key_exists('date', $d) ? $d['date'] : null;
        $author  = array_key_exists('author', $d) ? $d['author'] : null;

        //send each result back to client-side
        echo "
        <tr>
            <td  >
                <button class='result' data-id='$d_id' title='$d_title' data-chid='$chid'>
                    <h4> <b> $d_title </b> </h4>
                    <h6> Author: $author $date</h6>
                    <div class='result-html'>$html</div>
                </button>
            </td>
        </tr>
       ";
    }}
    else {//no results
        echo "
        <tr>
            <td >
              <button id='cancel-results'>
                <h4> <b> No files found - Cancel</b> </h4>
              </button>
           </td>
        </tr>
       ";
    };

    echo "</table>";
?>

