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
function saveText($collection, $name, $insert, $activity) {
      // save a document in $collection with displayname $name inserting $insert fields.
      // if $activity is TRUE, also save a document in the Activities Collection

    global $activities_collection;

    $query =array('dn'=>$name);
    $options = array("upsert"=>True, "new"=>True);
    $projection = array('_id' => 1, 'dn' => 1);

    $result = $collection->findAndModify($query, $insert, $projection, $options);

    echo json_encode($result);

// if $activity param is true, save new document in the activities collection or update 'dn' for existing activities pointing to this file
    if ($activity  == "true") {

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


/////////////////////////////////
// commands supported:
//
//       many of these functions are specialized. they should be re-used and generalized when possible
//
//  search
//  open
//  openByID
//  updateByID
//  save
//  rename
//  exists
//  delete
//  deleteField
//  chapterList
//  addChapterID
//  removeChapterID
////////////////////////////////

if (isset($_REQUEST["collection"])) {

   $collection =  $_REQUEST["collection"];

        //DEBUG
        //echo "cmd is " . $cmd . ", collection is " . $collection . ", ";
        //echo "dn is " . $_POST['dn'] . ", ft is " .  $_POST['ft'];
        //

   switch ($collection) {
       case "activities":  $dbCollection = $activities_collection;  break;
       case "chapters":    $dbCollection = $chapters_collection;    break;
       case "slideshow":   $dbCollection = $slideshows_collection;  break;
       case "text":        $dbCollection = $text_files_collection;  break;
       case "lessons":     $dbCollection = $lessons_collection;     break;
       case "lesson":      $dbCollection = $lessons_collection;     break;
       case "edited_videos":$dbCollection = $edited_videos_collection; break;

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


 ////////////////////////
 // - - - OPEN   - - - //
 ////////////////////////
        case "open":
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);

            //echo "request is " . $query['dn'];
            //echo "filetype is " . $query['ft'];

           //look up this DN (display name) in this collection (dbCollection)
           $file = $dbCollection -> findOne($query);  // assumes someone is maintaining this collection with unique DNs (index unique)
           if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
           else echo json_encode(array("error" =>"File not found"));  // in not found, return an error object {'error': errormessage}
           return;
            // end case "open"


 ////////////////////////
 // - - - OpenByID - - - //
 ////////////////////////
        case "openByID":
            if ($collection == "chapters") $query = array('_id' =>             $_REQUEST['id']);
            else                           $query = array('_id' => new MongoID($_REQUEST['id']));
           //look up this ID (mongoID) in this collection (dbCollection)
           $file = $dbCollection -> findOne($query);
           if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
           else echo json_encode(array("error" =>"File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}
           return;
            // end case "openByID"

        ////////////////////////
        // - - - OpenText - - - //
        ////////////////////////
        case "openText":
            $query = array();
            //look up this ID (mongoID) in this collection (dbCollection)
            $cursor = $dbCollection -> find($query) -> skip($_REQUEST['skip']);
            $cursor->next();
            $file = $cursor->current();
            if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
            else echo json_encode(array("error" =>"File not found in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}
            return;
        // end case "openByID"


        ////////////////////////
 // - - - UpdateByID - - - //
 ////////////////////////
        case "updateByID":  //called with 'collection', 'id', and an update Object

           $query = array('_id' => new MongoID($_REQUEST['id']));
           //update this ID (mongoID) in this collection (dbCollection)

           $update = array('$set' => json_decode($_REQUEST["data"]));

           $result = $dbCollection->update($query, $update);

           if ($result) echo json_encode($result);
           else echo json_encode(array("error" =>"File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}

           return;
            // end case "updateByID"


 ////////////////////////
 // - - - deleteField - - - //
 ////////////////////////
        case "deleteField":

           $query = array('_id' => new MongoID($_REQUEST['id']));
           //update this ID (mongoID) in this collection (dbCollection)

           $update = array('$unset' => json_decode($_REQUEST["data"]));

           $result = $dbCollection->update($query, $update);

           if ($result) echo json_encode($result);
           else echo json_encode(array("error" =>"File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}

            return;
            //end case "deleteField"


 ////////////////////////
 // - - - SAVE - - - //
 ////////////////////////
       case "save":
            if (($collection == "text") || ($collection == "lesson")){

                $insert = array(
                    "dn"     => $_REQUEST["dn"],
                    "ft"     => $_REQUEST["ft"],  //TYPE can be 'text' or 'text-template'
                    "author" => $_COOKIE['login'],
                    "date"   => gmdate("Y.m.d"),  //using greenwich time
                    "data"   => $_REQUEST["data"]
                    );
                saveText($dbCollection, $_REQUEST['dn'], $insert, $_REQUEST['activity']);
            }
            else if ($collection == "edited_videos") {
              $thumb = isset($_REQUEST['thumb']) ? $_REQUEST['thumb'] : "";
              $insert = array(
                    "dn"     => $_REQUEST["dn"],
                    "ft"     => $_REQUEST["ft"],  //TYPE can be 'text' or 'text-template'
                    "author" => $_COOKIE['login'],
                    "date"   => gmdate("Y.m.d"),  //using greenwich time
                    "data"   => $_REQUEST["data"],
                    "thumb"  => $thumb
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


 ////////////////////////
 // - - - RENAMME - - - //
 ////////////////////////
       case "rename":
            changename($dbCollection, $_REQUEST['dn'], $_REQUEST['newname'], true);
            return;
            // end case "rename"


 ////////////////////////
 // - - - EXISTS - - - //
 ////////////////////////
        case "exists": //find "dn" in the collection and return its ID if it exsits or NULL if doesnt exist
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
            $projection = array("_id" => 1,"author" => 1);
            $result = $dbCollection->findOne($query, $projection);
            if ($result) echo json_encode(array("_id" => $result["_id"],
                                            "author" => (isset($result["author"]) ? $result["author"] : null)) );
            else         echo json_encode(array("_id" => ""));
            return;
            // end case "exists"


 ////////////////////////
 // - - - DELETE - - - //
 ////////////////////////
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


 ////////////////////////
 // - - - chapterList - - - //
 ////////////////////////
          case "chapterList":
            //echo "<option>One</option><option>Two</option>";

            // inputs are class and subject
            //    query textbooks collection to get prefix ( class, subject )
            //    query chapters collection to get all chapters whose ch_id matches the prefix
            //    return a HTML string containing OPTION elements for a SELECT element

            $subjects = array(
                 'S' => 'science',
                 'M' => 'math',
                 'EN' => 'english',
                 'N' => 'nepali',
                 'SS' => 'social studies');

            $query = array ('class' => 'class' . $_REQUEST['class'], 'subject' => $subjects[$_REQUEST['subject']]);

            $projection = array('_id' => 0, 'prefix' => 1);
            $prefix = $textbooks_collection -> findOne($query, $projection);

                //echo "prefix is "; print_r($prefix);

            $regex = "^" . $prefix['prefix'] . "[0-9]";
            $query = array('_id' => array('$regex' => $regex));
            $chapters = $chapters_collection -> find($query);
            foreach ($chapters as $ch) echo "<option value='" . $ch['_id'] . "'>" . $ch['dn'] . "(" . $ch['_id'] . ")</option>";

            return;

 ////////////////////////
 // - - - SEARCH - - - //
 ////////////////////////
        case "search":
            // called (from looma-search.js, from lesson-plan.js, etc) using POST with FORMDATA serialized by jquery
            // $_POST[] can have these entries: collection, class, subj, category, sort, search-term,
            // src[] (array of checked items) and type[] (array of checked types)

            //Get filetype Parameters
            /* known filetypes are the FT values in Activities collection
             * e.g. 'video', 'audio', 'image', 'pdf', 'textbook', 'text', 'html', 'slideshow', 'lesson', 'looma'*/

            $filetypes = array();       //array of FT filetypes to include in the search

            if (isset($_REQUEST['type'])) foreach ($_POST['type'] as $i) array_push($filetypes, $i);

                     //echo "types is: "; print_r($filetypes);

            $sources = array();       //array of sources to include in the search

            if (isset($_REQUEST['src'])) foreach ($_POST['src'] as $i) array_push($sources, $i);

                    //echo "sources is: "; print_r($sources);

            $extensions = array();
            // build $extensions[] array by pushing filetype names into the array
            foreach ($filetypes as $type)
            switch ($type) {
                case 'pdf':
                    array_push($extensions, "pdf"); break;
                case 'video':
                    array_push($extensions, "mp4", "video", "mov", "m4v"); break;
                case 'image':
                    array_push($extensions, "image", "jpg", "png", "gif"); break;
                case 'history':
                    array_push($extensions, "history"); break;
                case 'slideshow':
                    array_push($extensions, "slideshow"); break;
                case 'map':
                    array_push($extensions, "map"); break;
                case 'evi':
                    array_push($extensions, "evi"); break;
                case 'audio':
                    array_push($extensions, "mp3", "audio"); break;
                case 'text':
                    array_push($extensions, "text"); break;

                // the rest {html, templates, lesson and looma are not activities for now
                case 'html':
                    array_push($extensions, "EP", "html", "htm", "php", "asp"); break;
                case 'text-template':
                    array_push($extensions, "text-template"); break;
                case 'lesson-template':
                    array_push($extensions, "lesson-template");break;
                case 'lesson':
                    array_push($extensions, "lesson"); break;
                case 'looma':
                    array_push($extensions, "looma"); break;
            };

            $areaRegex = null; $nameRegex = null; $classSubjRegex = null;

            if (isset($_POST['category']) && $_POST['category'] != "All") {
                $areaRegex = new MongoRegex ('/' . $_POST['category'] . '/i');
            };

            //Build Regex to match search term (i is ignore case)
            if (isset($_POST['search-term'])  && $_POST['search-term'] |= '')
                $nameRegex = new MongoRegex('/' . $_POST["search-term"] . '/i');

            //if 'class' or 'subj' are specified, build another regex to match class/subj in ch_id
            if (isset($_POST['chapter']) && $_POST['chapter'] != '') {
                $classSubjRegex = $_POST['chapter'];
            }
            elseif ((isset($_POST['class']) && $_POST['class'] != '') || (isset($_POST['subj'])  && $_POST['subj'] != '')) {
               $classSubjRegex = "/";
                      //echo 'classSubjRegex is ' . $classSubjRegex;
               if (isset($_POST['class']) && $_POST['class'] != '') $classSubjRegex .= '^' . $_POST['class'];
                      //echo 'classSubjRegex is ' . $classSubjRegex;
               if (isset($_POST['subj'])  && $_POST['subj']  != '') $classSubjRegex .= $_POST['subj'] . '\d';
                      //echo 'classSubjRegex is ' . $classSubjRegex;
               $classSubjRegex = new MongoRegex( $classSubjRegex . '/');
            };

                    /* DEBUG
                    echo 'collection is ' . $_POST['collection'];
                    echo 'filetypes are '; print_r($filetypes);
                    echo 'extensions are '; print_r($extensions);
                    echo 'class is ' . $_POST['class'] . ' and subj is ' . $_POST['subj'] . '       ';
                    echo '$nameRegex is ' . $nameRegex . '    and $classSubjRegex is ' . $classSubjRegex;
                    */

            $query = array();
            if (sizeof($extensions) > 0) $query['ft'] = array('$in' => $extensions);
            if (sizeof($sources)   > 0) $query['src'] = array('$in' => $sources);
            if ($areaRegex)          $query['area']   = $areaRegex;
            if ($nameRegex)          $query['dn']     = $nameRegex;
            if ($classSubjRegex)     $query['_id']  = $classSubjRegex;

                //echo "Query is: "; print_r($query);
                //echo '$dbCollection is ' . $dbCollection;

            $cursor = $dbCollection->find($query);   //->skip($page)->limit(20);

            //SORT the found items before sending to client-side
            $cursor->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]



            $result = array();
            if ($cursor -> count() > 0) { foreach ($cursor as $d) $result[] = $d; };

                //echo "    result item " . $d;

 /*           if (in_array('looma', $filetypes)) {
                // for Looma Pages activities, dont filter with class/subject
                $query = array('ft' => 'looma');
                $cursor = $dbCollection->find($query);
                if ($cursor -> count() > 0) { foreach ($cursor as $d) $result[] = $d; };
            };
*/
            // search for CHAPTERS if requested
/*            if (in_array('chapter', $filetypes)) {

                $query = array('ft' => 'chapter');
                if ($classSubjRegex) $query['_id'] = $classSubjRegex;
                if ($nameRegex)      $query['$or']    = array(
                                        array("dn" => $nameRegex),
                                        array("ndn" => $nameRegex)
                                              );

                $query =  array("_id" => $classSubjRegex,
                                '$or' => array(
                                      array("dn" => $nameRegex),
                                      array("ndn" => $nameRegex)
                                              )
                                );

                $cursor = $chapters_collection->find($query);
                if ($cursor -> count() > 0) { foreach ($cursor as $d) $result[] = $d; };
            };
*/
            echo json_encode($result);
            return;
            // end case "search"


 ////////////////////////
 // - - - addChapterID - - - //
 ////////////////////////
        case 'addChapterID':
                $query = array('_id' => new MongoID($_REQUEST['id']));
                $update = array('$addToSet' => array('ch_id' => $_REQUEST['data']));
                $result = $dbCollection->update($query, $update);

                echo json_encode($result);
            return;
            // end case "addChapterID"


 ////////////////////////
 // - - - removeChapterID - - - //
 ////////////////////////
        case 'removeChapterID':
                $query = array('_id' => new MongoID($_REQUEST['id']));
                $update = array('$pull' => array('ch_id' => $_REQUEST['data']));
                $result = $dbCollection->update($query, $update);

                echo json_encode($result);
            return;
            // end case "removeChapterID"
    }; //end switch "cmd"
}
else return; //no CMD given
?>

