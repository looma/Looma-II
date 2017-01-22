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

// called (from looma-search.php/.js, from lesson-plan.js, etc) using POST with FORMDATA serialized by jquery
// $_POST[] can have these entries: collection, indexes: class, subj, sort, search-term, and type[] (arroy of checked types)



    //Get filetype Parameters
    /* known filetypes are the FT values in Activities collection
     * e.g. 'video', 'audio', 'image', 'pdf', 'textbook', 'text', 'html', 'slideshow'*/

    $fileTypes = array();       //array of FT filetypes to include in the search

    if (!isset($_POST['type'])) $fileTypes =
         array("video", "audio", "image", "pdf", "textbook", "text", "text-template", "html", "slideshow", "lesson", "chapter");
    else foreach ($_POST['type'] as $i) array_push($fileTypes, $i);

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

        case 'lesson':
            array_push($extensions, "lesson");
            break;

        case 'looma':
            array_push($extensions, "looma");
            break;
    };

    //Build Regex to match search term (i is ignore case)
    $regex = new MongoRegex('/' . $_POST["search-term"] . '/i');

    $query = array("dn" => $regex, 'ft' => array('$in' => $extensions));
    $cursor = $dbCollection->find($query);   //->skip($page)->limit(20);

    $result = array();

    if ($cursor -> count() > 0) {
        foreach ($cursor as $d) $result[] = $d;
    };

    echo json_encode($result);

?>

