<?php
/*
 *
Filename: looma-databse-utilities.php
Description: server side code for SAVE, OPEN, DELETE, EXISTS? commands to mongoDB
Programmer : Skip
Adapted from: looma-slideshow-save.php by Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Nov 2016
Revision: 1.0
*/

include ('includes/mongo-connect.php');

// SAVE function

function save($collection, $insert) {
        $result = $collection->insert($insert);

        echo json_encode($result);
}; //end SAVE

//SAVETEXT function
function saveText($collection, $name, $insert, $activity) {  // save a document in $collection with displayname $name inserting $insert fields.
                                                         // if $activity is TRUE, also save a document in the Activities Collection

    global $activities_collection;

    $query =array('dn'=>$name);
    $options = array("upsert"=>True, "new"=>True);
    $projection = array('_id' => 1, 'dn' => 1);

    $result = $collection->findAndModify($query, $insert, $projection, $options);

    echo json_encode($result);

// if $activity param is true, save new document in the activities collection or update 'dn' for existing activities pointing to this file
    if ($activity) {

        $id = $result['_id'];
        //echo "ID is " . $id;

        $id = new MongoID($id); // mongoID of document we just saved
        $query = array("ft" => $insert['ft'], "mongoID" => $id);
        $toinsertToActivities = array(
            "ft"      => $insert['ft'],
            "mongoID" => $id,
            "dn"      => $insert['dn']
             );
        $options = array("upsert" => True, "multi" => True);

        //DEBIUG echo 'updating activities with ' . $id . ' and ' . $_REQUEST['dn'];

    try {
            $result1 = $activities_collection->update($query, $toinsertToActivities, $options);
            //echo json_encode($result1);
        }
    catch(MongoConnectionException $e)
        {
            //echo "Mongo Error writing to Activities collection";
            echo json_encode(array('error'=>'Mongo error writing Activities collection'));
        };



    };
};  //end SAVETEXT()

function changename($collection, $oldname, $newname, $activity) {
        global $activities_collection;

        $query = array('dn' => $oldname, 'ft' => $_REQUEST['ft']);
        $update = array('$set' => array('dn' => $newname));
        $projection = array('_id' => 1, 'dn' => 1);
        $options = array('new' => True);
        $result = $collection->findAndModify($query, $update, $projection, $options);

        echo json_encode($result);

//  AND update 'dn' for existing activities pointing to this text file
    if ($activity) {
        $id = $result['_id'];

        $id = new MongoID($id); // mongoID of the text we just saved
        $query =   array("ft" => $_REQUEST['ft'], "mongoID" => $id);
        $update =  array('$set' => array('dn' => $newname));
        $options = array('multiple' => true);

        $result1 = $activities_collection->update($query, $update, $options);

        //echo "coll is " . $collection . ", ft is " . $_RESULT['ft'] . ", id is " . $id . ", newname is " . $newname;

        echo json_encode($result1);
    };
}; //end CHANGENAME)

/*****************************/
/****   main code here    ****/
/*****************************/

if (isset($_REQUEST["collection"])) {

   $collection =  $_REQUEST["collection"];

        //DEBUG
        //echo "cmd is " . $cmd . ", collection is " . $collection . ", ";
        //echo "dn is " . $_POST['dn'] . ", ft is " .  $_POST['ft'];
        //

   switch ($collection) {
       case "text":        $dbCollection = $text_files_collection;  break;
       case "activities":  $dbCollection = $activities_collection;  break;
       case "lesson":      $dbCollection = $lessons_collection;     break;
       case "chapters":    $dbCollection = $chapters_collection;    break;
       case "slideshow":   $dbCollection = $slideshows_collection;  break;
       case "text":        $dbCollection = $text_files_collection;  break;
       case "edited_video":$dbCollection = $edited_videos_collection; break;

       default: echo "unknown collection: " . $collection;        return;
       };

   /* NOTE: mongoDB collections list:
    $activities_collection    = $loomaDB -> activities;
    $chapters_collection      = $loomaDB -> chapters;
    $textbooks_collection     = $loomaDB -> textbooks;
    $dictionary_collection    = $loomaDB -> dictionary;
    $logins_collection        = $loomaDB -> logins;
    $history_collection       = $loomaDB -> histories;
    $slideshows_collection    = $loomaDB -> slideshows;
    $lessons_collection       = $loomaDB -> lessons;
    $text_files_collection    = $loomaDB -> text_files;
    $edited_videos_collection = $loomaDB -> edited_videos;
    */
    };

if ( isset($_REQUEST["cmd"]) ) {
    $cmd =  $_REQUEST["cmd"];
    //accepted commands are "open", "save", "rename", "exists", "delete"

    switch ($cmd)
    {
        case "open":
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
           //look up this DN (display name) in this collection (dbCollection)
           $file = $dbCollection -> findOne($query);  // assumes someone is maintaining this collection with unique DNs (index unique)
           if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
           else echo json_encode(array("error" =>"File not found"));  // in not found, return an error object {'error': errormessage}
           return;
            // end case "open"

        case "openByID":
            if ($collection == "chapters") $query = array('_id' =>             $_REQUEST['id']);
            else                           $query = array('_id' => new MongoID($_REQUEST['id']));
           //look up this ID (mongoID) in this collection (dbCollection)
           $file = $dbCollection -> findOne($query);
           if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
           else echo json_encode(array("error" =>"File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}
           return;
            // end case "openByID"

        case "updateByID":  //called with 'collection', 'id', and an update Object

           $query = array('_id' => new MongoID($_REQUEST['id']));
           //update this ID (mongoID) in this collection (dbCollection)

           $update = array('$set' => json_decode($_REQUEST["data"]));

           $result = $dbCollection->update($query, $update);

           if ($result) echo json_encode($result);
           else echo json_encode(array("error" =>"File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}

           return;
            // end case "updateByID"

        case "deleteField":

           $query = array('_id' => new MongoID($_REQUEST['id']));
           //update this ID (mongoID) in this collection (dbCollection)

           $update = array('$unset' => json_decode($_REQUEST["data"]));

           $result = $dbCollection->update($query, $update);

           if ($result) echo json_encode($result);
           else echo json_encode(array("error" =>"File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}

            return;
            //end case "deleteField"
        case "save":
            if ($collection == "text") {

                $insert = array(
                    "dn"     => $_REQUEST["dn"],
                    "ft"     => $_REQUEST["ft"],  //TYPE can be 'text' or 'text-template'
                    "author" => $_COOKIE['login'],
                    "date"   => gmdate("Y.m.d"),  //using greenwich time
                    "data"   => $_REQUEST["data"]
                    );
                saveText($dbCollection, $_REQUEST['dn'], $insert, $_REQUEST['activity']);
            }
            else if ($collection == "activities") {
                $insert = $_REQUEST['data'];
                $insert["date"] = gmdate("Y.m.d");  //using greenwich time
                $insert["author"] = $_COOKIE['login'];

                save($dbCollection, $insert, false);

            };
            // else handle other collections' specific save requirements
            return;
            // end case "save"

       case "rename":
            changename($dbCollection, $_REQUEST['dn'], $_REQUEST['newname'], true);
            return;
            // end case "rename"

        case "exists": //find "dn" in the collection and return its ID if it exsits or NULL if doesnt exist
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
            $projection = array("_id" => 1);
            $result = $dbCollection->findOne($query, $projection);
            if ($result) echo json_encode(array("_id" => $result["_id"]));
            else         echo json_encode(array("_id" => ""));
            return;
            // end case "exists"

        case "delete":
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
            $file = $dbCollection -> findOne($query);
            if ($file) {
                $dbCollection->remove($query, array("justOne" => true));
                echo array('deleted' => $dn);

                // delete any references to the file from Activities collection
                $removequery = array('mongoID' => $file['_id']);
                $activities_collection -> remove($removequery);  //by default, removes multiple instances
            };
            return;
            // end case "delete"

        case "chapterList":
            //echo "<option>One</option><option>Two</option>";

            // inputs are class and subject
            //    query textbooks collection to get prefix ( class, subject )
            //    query chapters collection to get all chapters whose ch_id matches the prefix
            //    return a HTML string containing OPTION elements for a SELECT element

            $query = array ('class' => $_REQUEST['class'], 'subject' => $_REQUEST['subject']);

            $projection = array('_id' => 0, 'prefix' => 1);
            $prefix = $textbooks_collection -> findOne($query, $projection);

            $regex = "^" . $prefix['prefix'] . "[0-9]";
            $query = array('_id' => array('$regex' => $regex));
            $chapters = $chapters_collection -> find($query);
            foreach ($chapters as $ch) echo "<option value='" . $ch['_id'] . "'>" . $ch['dn'] . "(" . $ch['_id'] . ")</option>";

            return;

        case "search":
            // called (from looma-search.js, from lesson-plan.js, etc) using POST with FORMDATA serialized by jquery
            // $_POST[] can have these entries: collection, indexes: class, subj, sort, search-term, and type[] (arroy of checked types)

            //Get filetype Parameters
            /* known filetypes are the FT values in Activities collection
             * e.g. 'video', 'audio', 'image', 'pdf', 'textbook', 'text', 'html', 'slideshow', 'lesson', 'looma'*/

            $fileTypes = array();       //array of FT filetypes to include in the search

            if (!isset($_REQUEST['type'])) $fileTypes =
                 array("video", "audio", "image", "pdf", "textbook", "text", "text-template", "html", "slideshow", "lesson" /* , "chapter" */);
            else foreach ($_POST['type'] as $i) array_push($fileTypes, $i);

            $extensions = array();
            // build $extensions[] array by pushing filetype names into the array
            foreach ($fileTypes as $type)
            switch ($type) {
                case 'video':
                    array_push($extensions, "mp4", "video", "mov"); break;
                case 'audio':
                    array_push($extensions, "mp3", "audio"); break;
                case 'image':
                    array_push($extensions, "image", "jpg", "png", "gif"); break;
                case 'html':
                    array_push($extensions, "EP", "html", "htm", "php", "asp"); break;
                case 'pdf':
                    array_push($extensions, "pdf"); break;
                case 'text':
                    array_push($extensions, "text"); break;
                case 'text-template':
                    array_push($extensions, "text-template"); break;
                case 'textbook':
                    array_push($extensions, "textbook"); break;
                case 'slideshow':
                    array_push($extensions, "slideshow"); break;
                case 'lesson':
                    array_push($extensions, "lesson"); break;
                //case 'looma':
                //    array_push($extensions, "looma"); break;
            };

            $nameRegex = null; $classSubjRegex = null;

            //Build Regex to match search term (i is ignore case)
            if (isset($_POST['search-term'])  && $_POST['search-term'] |= '')
                $nameRegex = new MongoRegex('/' . $_POST["search-term"] . '/i');

            //if 'class' or 'subj' are specified, build another regex to match class/subj in ch_id
            if ((isset($_POST['class']) && $_POST['class'] != '') || (isset($_POST['subj'])  && $_POST['subj'] != '')) {
               $classSubjRegex = "/";
                      //echo 'classSubjRegex is ' . $classSubjRegex;
               if (isset($_POST['class']) && $_POST['class'] != '') $classSubjRegex .= '^' . $_POST['class'];
                      //echo 'classSubjRegex is ' . $classSubjRegex;
               if (isset($_POST['subj'])  && $_POST['subj']  != '') $classSubjRegex .= $_POST['subj'] . '\d';
                      //echo 'classSubjRegex is ' . $classSubjRegex;
               $classSubjRegex = new MongoRegex( $classSubjRegex . '/');
            };


        //NOTE
        //should fix above code so that search for ft=looma doesnt filter on class & subject
        //

                    /* DEBUG
                    echo 'collection is ' . $_POST['collection'];
                    echo 'filetypes are '; print_r($fileTypes);
                    echo 'extensions are '; print_r($extensions);
                    echo 'class is ' . $_POST['class'] . ' and subj is ' . $_POST['subj'] . '       ';
                    echo '$nameRegex is ' . $nameRegex . '    and $classSubjRegex is ' . $classSubjRegex;
                    */

            $query = array('ft' => array('$in' => $extensions));
            if ($nameRegex)      $query['dn']    = $nameRegex;
            if ($classSubjRegex) $query['ch_id'] = $classSubjRegex;

                 //echo "Query is: "; print_r($query);

           // NOTE: dont need to do this 'find' if $extensions.length == 0
            $cursor = $dbCollection->find($query);   //->skip($page)->limit(20);

            $result = array();
            if ($cursor -> count() > 0) { foreach ($cursor as $d) $result[] = $d; };

            if (in_array('looma', $fileTypes)) {
                // for Looma Pages activities, dont filter with class/subject
                $query = array('ft' => 'looma');
                $cursor = $dbCollection->find($query);
                if ($cursor -> count() > 0) { foreach ($cursor as $d) $result[] = $d; };
            };

            // search for CHAPTERS if requested
            if (in_array('chapter', $fileTypes)) {

                $query = array('ft' => 'chapter');
                if ($classSubjRegex) $query['_id'] = $classSubjRegex;
                if ($nameRegex)      $query['$or']    = array(
                                        array("dn" => $nameRegex),
                                        array("ndn" => $nameRegex)
                                              );

                /*$query =  array("_id" => $classSubjRegex,
                                '$or' => array(
                                      array("dn" => $nameRegex),
                                      array("ndn" => $nameRegex)
                                              )
                                );
                */
                $cursor = $chapters_collection->find($query);
                if ($cursor -> count() > 0) { foreach ($cursor as $d) $result[] = $d; };
            };

            echo json_encode($result);
            return;
            // end case "search"
    }; //end switch "cmd"
}
else return; //no CMD given
?>

