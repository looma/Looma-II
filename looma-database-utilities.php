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

require_once ('includes/mongo-connect.php');

        // SAVE function

        function save($collection, $insert) {
                $result = $collection->insert($insert);
                echo json_encode($result);
        }; //end SAVE

        //SAVETEXT function
        function saveText($collection, $name, $type, $insert, $activity) {
              // save or update a document in $collection with displayname==$name and ft==$type inserting $insert fields.
              // if $activity is TRUE, also save a document in the Activities Collection

            global $activities_collection;

            $query =array('dn'=>$name,'ft'=>$type);
            $options = array("upsert"=>true, "new"=>true);
            $projection = array('_id' => 1, 'dn' => 1);

            $result = $collection->findAndModify($query, $insert, $projection, $options);

            echo json_encode($result);

        // if $activity param is true, save new document in the activi ties collection or update 'dn' for existing activities pointing to this file
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
                    if (isset($insert['thumb']))  $toinsertToActivities['thumb'] = $insert['thumb'];

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
//  keywordList
//  addChapterID
//  removeChapterID
//  editActivity
//  uploadFile
////////////////////////////////
date_default_timezone_set ( 'UTC');
$date = date("Y.m.d");


function loggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};
$login = loggedin();

if (isset($_REQUEST["collection"])) {

   $collection =  $_REQUEST["collection"];

        //DEBUG
        //echo "cmd is " . $cmd . ", collection is " . $collection . ", ";
        //echo "dn is " . $_POST['dn'] . ", ft is " .  $_POST['ft'];
        //

   switch ($collection) {
       case "activities":    $dbCollection = $activities_collection;    break;
       case "chapters":      $dbCollection = $chapters_collection;      break;
       case "slideshow":
       case "slideshows":    $dbCollection = $slideshows_collection;    break;
       case "text":
       case "text_files":    $dbCollection = $text_files_collection;    break;
       case "lesson":
       case "lessons":       $dbCollection = $lessons_collection;       break;
       case "map":
       case "maps":          $dbCollection = $maps_collection;          break;
       case "history":
       case "histories":     $dbCollection = $histories_collection;     break;
       case "game":          $dbCollection = $games_collection;         break;
       case "games":         $dbCollection = $games_collection;         break;
       case "edited_videos": $dbCollection = $edited_videos_collection; break;

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

    switch ($cmd) {

        ////////////////////////
        // - - - OPEN   - - - //
        ////////////////////////
        case "open":
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);

            //echo "request is " . $query['dn'];
            //echo "filetype is " . $query['ft'];

            //look up this DN (display name) in this collection (dbCollection)
            $file = $dbCollection->findOne($query);  // assumes someone is maintaining this collection with unique DNs (index unique)
            if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
            else echo json_encode(array("error" => "File not found"));  // if not found, return an error object {'error': errormessage}
            return;
        // end case "open"


        ////////////////////////
        // - - - OpenByName   - - - //
        ////////////////////////
        case "openByName":
            $query = array('fn' => $_REQUEST['fn'], 'fp' => $_REQUEST['fp']);

            //echo "request is " . $query['dn'];
            //echo "filetype is " . $query['ft'];

            //look up this DN (display name) in this collection (dbCollection)
            $file = $dbCollection->findOne($query);  // assumes someone is maintaining this collection with unique DNs (index unique)
            if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
            else echo json_encode(array("error" => "File not found"));  // in not found, return an error object {'error': errormessage}
            return;
        // end case "open"


////////////////////////
// - - - OpenByID - - - //
////////////////////////
    case "openByID":
        if ($collection == "chapters") $query = array('_id' => $_REQUEST['id']);
        else                           $query = array('_id' => new MongoID($_REQUEST['id']));
        //look up this ID (mongoID) in this collection (dbCollection)
        $file = $dbCollection->findOne($query);
        if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
        else echo json_encode(array("error" => "File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}
        return;
    // end case "openByID"

////////////////////////
// - - - OpenText - - - //
////////////////////////
    case "openText":
        $query = array();
        //look up this ID (mongoID) in this collection (dbCollection)
        $cursor = $dbCollection->find($query)->skip($_REQUEST['skip']);
        $cursor->next();
        $file = $cursor->current();
        if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
        else echo json_encode(array("error" => "File not found in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}
        return;
    // end case "OpenText"


////////////////////////
    // - - - UpdateByID - - - //
    ////////////////////////
    case "updateByID":  //called with 'collection', 'id', and an update Object

        $query = array('_id' => new MongoID($_REQUEST['id']));
        //update this ID (mongoID) in this collection (dbCollection)

        $update = array('$set' => json_decode($_REQUEST["data"]));

        $result = $dbCollection->update($query, $update);

        if ($result) echo json_encode($result);
        else echo json_encode(array("error" => "File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}

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
        else echo json_encode(array("error" => "File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}

        return;
    //end case "deleteField"


    ////////////////////////
    // - - - SAVE - - - //
    ////////////////////////
    case "save":
        if (($collection == "text") || ($collection == "lesson")) {

            $insert = array(
                "dn" => $_REQUEST["dn"],
                "ft" => $_REQUEST["ft"],  //TYPE can be 'text' or 'text-template'
                "author" => $_COOKIE['login'],
                "date" => gmdate("Y.m.d"),  //using greenwich time
                "data" => $_REQUEST["data"]
            );
            saveText($dbCollection, $_REQUEST['dn'], $_REQUEST['ft'], $insert, $_REQUEST['activity']);
        } else if (($collection == "edited_videos")  || ($collection == "slideshows")) {
            $thumb = isset($_REQUEST['thumb']) ? $_REQUEST['thumb'] : "";
            $insert = array(
                "dn" => $_REQUEST["dn"],
                "ft" => $_REQUEST["ft"],  //TYPE can be 'text' or 'text-template'
                "author" => $_COOKIE['login'],
                "date" => gmdate("Y.m.d"),  //using greenwich time
                "data" => $_REQUEST["data"],
                "thumb" => $thumb
            );
            saveText($dbCollection, $_REQUEST['dn'], $_REQUEST['ft'], $insert, $_REQUEST['activity']);
        } else if ($collection == "activities") {
            $insert = $_REQUEST['data'];
            $insert["date"] = gmdate("Y.m.d");  //using greenwich time
            $insert["author"] = $_COOKIE['login'];

            if (isset($_REQUEST['thumb'])) $insert['thumb'] = $_REQUEST['thumb'];

            save($dbCollection, $insert, false);

        };
        // else handle other collections' specific save requirements
        return;
    // end case "save"


    ////////////////////////
    // - - - RENAME - - - //
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
        $projection = array("_id" => 1, "author" => 1);
        $result = $dbCollection->findOne($query, $projection);
        if ($result) echo json_encode(array("_id" => $result["_id"],
            "author" => (isset($result["author"]) ? $result["author"] : null)));
        else         echo json_encode(array("_id" => ""));
        return;
    // end case "exists"


    ////////////////////////
    // - - - DELETE - - - //
    ////////////////////////
    case "delete":
        $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
        $file = $dbCollection->findOne($query);
        if ($file) {
            $dbCollection->remove($query, array("justOne" => true));
            echo 'Looma-database-utilities.php, deleted file: ' .  $_REQUEST['dn'] . ' of type: ' . $_REQUEST['ft'];

            // delete any references to the file from Activities collection
            $removequery = array('mongoID' => $file['_id']);
            $activities_collection->remove($removequery);  //by default, removes multiple instances
        };
        return;
    // end case "delete"


        ////////////////////////
        // - - - bookList - - - //
        ////////////////////////
        case "bookList":
            // inputs is class
            //    query textbooks collection to get list of textbooks for this class
            //    return a array of JSON documents from textbooks collection

            $query = array('class' => $_REQUEST['class']);
            $books = $textbooks_collection->find($query);
            $response = [];
            foreach ($books as $book) $response[] = $book;

            echo json_encode($response);
            return;


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
            'SS' => 'social studies',
            'H'  => 'health',
            'V'  => 'vocation');

        //echo 'class is ' . $_REQUEST['class'] . '/n subject is ' . $_REQUEST['subject'] . '/n lookup of subject is '. $subjects[$_REQUEST['subject']] . '/n';

        $query = array('class' => 'class' . $_REQUEST['class'], 'subject' => $subjects[$_REQUEST['subject']]);
        //print_r($query);

        $projection = array('_id' => 0, 'prefix' => 1);
        $prefix = $textbooks_collection->findOne($query, $projection);
        //echo "mongo result is "; print_r($prefix);

        if($prefix) {
            $regex = "^" . $prefix['prefix']. "\d";

            //echo "Prefix is $regex"; exit;

            $query = array('_id' => array('$regex' => $regex));
            $chapters = $chapters_collection->find($query);
            foreach ($chapters as $ch) echo "<option value='" . $ch['_id'] . "'>" . $ch['dn'] . "(" . $ch['_id'] . ")</option>";
        }
        return;


/////////////////////////////
// - - - KEYWORDROOT - - - //
/////////////////////////////
    case "keywordRoot":
        // lookup the 'root' document in tags collection and return an array of children keywords
        // format of result is [{name:name, id:id}, ...]  (id will == null if this keyword has no children)

        $query = array('name' => 'root');
        $root = $tags_collection->findOne($query);
        echo json_encode($root['children']);
        return;
// end case "keywordRoot"

/////////////////////////////
// - - - KEYWORDLIST - - - //
/////////////////////////////
    case "keywordList":
        // called with a mongoID. lookup that id in tags collection and return an array of children keywords of that keyword
        // format of result is [{name:name, id:id}, ...]  (id will == null if this keyword has no children)

        $query = array('_id' => new MongoId($_POST['id']));
        $child = $tags_collection->findOne($query);
        echo json_encode($child['children']);
        return;
// end case "keywordList"


    ////////////////////////
    // - - - SEARCH - - - //
    ////////////////////////
    case "search":
        // called (from Xlooma-search2017.js, from lesson-plan.js, etc) using POST with FORMDATA serialized by jquery
        // $_POST[] can have these entries: collection, class, subj, category, sort, search-term,
        // src[] (array of checked items) and type[] (array of checked types)

        //Get filetype Parameters
        /* known filetypes are the FT values in Activities collection
         * e.g. 'video', 'audio', 'image', 'pdf', 'textbook', 'text', 'html', 'slideshow', 'lesson', 'looma'*/

        $filetypes = array();       //array of FT filetypes to include in the search

        if (isset($_REQUEST['type'])) foreach ($_POST['type'] as $i) if ($i != '') array_push($filetypes, $i);

        //echo "types is: "; print_r($filetypes);
        $sources = array();       //array of sources to include in the search

        if (isset($_REQUEST['src'])) foreach ($_POST['src'] as $i) array_push($sources, $i);

        //echo "sources is: "; print_r($sources);

        $extensions = array();
        // build $extensions[] array by pushing filetype names into the array
        foreach ($filetypes as $type)
            switch ($type) {

                case 'video':
                    array_push($extensions, "mp4", "video", "mov", "m4v");
                    break;
                case 'image':
                    array_push($extensions, "image", "jpg", "png", "gif");
                    break;
                case 'audio':
                    array_push($extensions, "mp3", "audio");
                    break;
                case 'html':
                    array_push($extensions, "EP", "html", "htm", "php", "asp");
                    break;
                case 'pdf':
                    array_push($extensions, "pdf", "document");
                    break;
                case 'history':
                case 'slideshow':
                case 'map':
                case 'evi':
                case 'text':
                case 'text-template':
                case 'lesson-template':
                case 'lesson':
                case 'game':
                case 'looma':
                    array_push($extensions, $type);
                    break;
                default: {echo json_encode("ERROR: unknown file type"); return;}
            };

        $areaRegex = null;
        $nameRegex = null;
        $classSubjRegex = null;

        if (isset($_POST['category']) && $_POST['category'] != "All") {
            $areaRegex = new MongoRegex ('/' . $_POST['category'] . '/i');
        };

        //Build Regex to match search term (i is ignore case)
        if (isset($_POST['search-term']) && $_POST['search-term'] |= '')
            $nameRegex = new MongoRegex('/' . $_POST["search-term"] . '/i');

        //if 'class' or 'subj' are specified, build another regex to match class/subj in ch_id
        if (isset($_POST['chapter']) && $_POST['chapter'] != '') {
            $classSubjRegex = $_POST['chapter'];
        } elseif ((isset($_POST['class']) && $_POST['class'] != '') || (isset($_POST['subj']) && $_POST['subj'] != '')) {
            $classSubjRegex = "/";
            //echo 'classSubjRegex is ' . $classSubjRegex;
            if (isset($_POST['class']) && $_POST['class'] != '') $classSubjRegex .= '^' . $_POST['class'];
            //echo 'classSubjRegex is ' . $classSubjRegex;
            if (isset($_POST['subj']) && $_POST['subj'] != '') $classSubjRegex .= $_POST['subj'] . '\d';
            //echo 'classSubjRegex is ' . $classSubjRegex;
            $classSubjRegex = new MongoRegex($classSubjRegex . '/');
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
        if (sizeof($sources) > 0) $query['src'] = array('$in' => $sources);
        if ($areaRegex) $query['area'] = $areaRegex;
        if ($nameRegex) $query['dn'] = $nameRegex;
        if ($classSubjRegex) $query['_id'] = $classSubjRegex;

        // using REGEX with "/i" to get case insensitive search for keywords
        if (isset($_REQUEST['key1']) && $_REQUEST['key1'] != '') {
            $query['key1'] = $_REQUEST['key1'] === 'none'? null : new MongoRegex('/'.$_REQUEST['key1'].'/i');
        };
        if (isset($_REQUEST['key2']) && $_REQUEST['key2'] != '') {
            $query['key2'] = $_REQUEST['key2'] === 'none'? null : new MongoRegex('/'.$_REQUEST['key2'].'/i');
        };
        if (isset($_REQUEST['key3']) && $_REQUEST['key3'] != '') {
            $query['key3'] = $_REQUEST['key3'] === 'none'? null : new MongoRegex('/'.$_REQUEST['key3'].'/i');
        };
        if (isset($_REQUEST['key4']) && $_REQUEST['key4'] != '') {
            $query['key4'] = $_REQUEST['key4'] === 'none'? null : new MongoRegex('/'.$_REQUEST['key4'].'/i');
        };

        //echo "Query is: "; print_r($query);
        //echo '$dbCollection is ' . $dbCollection;

        $cursor = $dbCollection->find($query);   //->skip($page)->limit(20);

        //SORT the found items before sending to client-side
        $cursor->sort(array('dn' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

        $result = array();
        if ($cursor->count() > 0) {
            foreach ($cursor as $d) $result[] = $d;
        };

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
    // -  removeChapterID  - //
    ////////////////////////
    case 'removeChapterID':
        $query = array('_id' => new MongoID($_REQUEST['id']));
        $update = array('$pull' => array('ch_id' => $_REQUEST['data']));
        $result = $dbCollection->update($query, $update);

        echo json_encode($result);
        return;
    // end case "removeChapterID"

    ////////////////////////
    // - - - editActivity - - - //
    ////////////////////////
    case 'editActivity':

        //print_r  ($_REQUEST['activities']);
        $arr = explode(',', $_REQUEST['activities'][0]);

        foreach ($arr as $activity) {

            $query = array('_id' => new MongoID($activity));
            //print_r ($query);

            $changes = []; $unsets = [];
            if ($_REQUEST['dn'])  $changes['dn'] =  $_REQUEST['dn'];
            if ($_REQUEST['src']) $changes['src'] = $_REQUEST['src'];

            // if key1 is specified, then set key1 and either set or reset keys 2,3,4
            if ($_REQUEST['key1']) {
                                       $changes['key1'] = $_REQUEST['key1'];
                if ($_REQUEST['key2']) $changes['key2'] = $_REQUEST['key2']; else $unsets['key2'] = "";
                if ($_REQUEST['key3']) $changes['key3'] = $_REQUEST['key3']; else $unsets['key3'] = "";
                if ($_REQUEST['key4']) $changes['key4'] = $_REQUEST['key4']; else $unsets['key4'] = "";
            }
            //print_r ($changes);
            //print_r ($unsets);
            $update = [];
            if (count($changes) > 0) $update ['$set'] =   $changes;
            if (count($unsets)  > 0) $update ['$unset'] = $unsets;

            if ($_REQUEST['chapter']) $update['$addToSet'] = array('ch_id' => $_REQUEST['chapter']);
            //print_r ($update);

             $result = $dbCollection->update($query, $update);

            echo json_encode($result);
        };  // end foreach()
        return;
    // end case "editActivity"

    ////////////////////////
    // -  uploadFile  - //
    ////////////////////////
    case 'uploadFile':

        // Check for an uploaded file:
       if (isset($_FILES['upload']) && isset($_FILES['upload-thumb'])) {

           $result = 'received ' . $_FILES['upload']['name'];

            // Validate here (file sizes, file types, thumbnail name corresponds to filename, ...)
            if (!$login) { $result = 'ERROR: You are not logged in';}
            else {
                // make sure the directories to store the files exits
                date_default_timezone_set ( 'UTC');
                $year = date("Y");
                $dir = '../content/' . $year;
                if ( ! file_exists($dir)) { mkdir($dir,0777,true); }
                if ( ! file_exists($dir . '/' . $login)) { mkdir($dir . '/' . $login,0777,true); }

                // Move the files to permanent storage
                if (move_uploaded_file($_FILES['upload']      ['tmp_name'], "../content/$year/$login/{$_FILES['upload']['name']}")
                && (move_uploaded_file($_FILES['upload-thumb']['tmp_name'], "../content/$year/$login/{$_FILES['upload-thumb']['name']}")))
                { $result = 'The files have been uploaded'; }
                else { $result = 'ERROR: File upload failed'; };

                // insert ACTIVITY in mongoDB

              $insert = [];
              if ($_REQUEST['dn'])  $insert['dn'] =  $_REQUEST['dn'];
              if ($_REQUEST['src']) $insert['src'] = $_REQUEST['src'];

              if ($_REQUEST['chapter']) $insert['ch_id'] = '[' . $_REQUEST['chapter'] . ']';

              if ($_REQUEST['key1']) $insert['key1'] = $_REQUEST['key1'];
              if ($_REQUEST['key2']) $insert['key2'] = $_REQUEST['key2'];
              if ($_REQUEST['key3']) $insert['key3'] = $_REQUEST['key3'];
              if ($_REQUEST['key4']) $insert['key4'] = $_REQUEST['key4'];

              //print_r ($insert);

               $insert['fn'] = $_FILES['upload']['name'];
               $insert['fp'] = '../content/' . $year . '/' . $login. '/' ;
               $insert['ft'] = $_REQUEST['ft'];
               $insert['thumb'] = '../content/' . $year . '/' . $login. '/' . $_FILES['upload-thumb']['name'];
               $insert["date"] = gmdate("Y.m.d");  // using greenwich time
               $insert["author"] = $_COOKIE['login'];     // set 'author' to currently logged-in user

               $temp = $activities_collection->insert($insert);  //$temp not used for now
            }

        } else {  $result = 'ERROR: Didnt get file and thumbnail'; }

        if ($_FILES['upload-thumb']['error'] > 0) {

            // return a message based upon the error.
            switch ($_FILES['upload-thumb']['error']) {
                case 1:  $result = 'ERROR: The file exceeds the upload_max_filesize setting in php.ini.'; break;
                case 2:  $result = 'ERROR: The file exceeds the MAX_FILE_SIZE setting in the HTML form.';   break;
                case 3:  $result = 'ERROR: The file was only partially uploaded.';  break;
                case 4:  $result = 'ERROR: No file was uploaded.';  break;
                case 6:  $result = 'ERROR: No temporary folder was available.';  break;
                case 7:  $result = 'ERROR: Unable to write to the disk.';  break;
                case 8:  $result = 'ERROR: File upload stopped.';  break;
                default: $result = 'ERROR: A system error occurred.'; break;
            }} // End of switch.

         else if ($_FILES['upload']['error'] > 0) {

            // return a message based upon the error.
            switch ($_FILES['upload']['error']) {
                case 1:  $result = 'ERROR: The file exceeds the upload_max_filesize setting in php.ini.'; break;
                case 2:  $result = 'ERROR: The file exceeds the MAX_FILE_SIZE setting in the HTML form.';   break;
                case 3:  $result = 'ERROR: The file was only partially uploaded.';  break;
                case 4:  $result = 'ERROR: No file was uploaded.';  break;
                case 6:  $result = 'ERROR: No temporary folder was available.';  break;
                case 7:  $result = 'ERROR: Unable to write to the disk.';  break;
                case 8:  $result = 'ERROR: File upload stopped.';  break;
                default: $result = 'ERROR: A system error occurred.'; break;
            } // End of switch.

        } // End of error IF.

        // Delete the uploaded files if still exist:
        if (file_exists ($_FILES['upload']['tmp_name']) && is_file($_FILES['upload']['tmp_name']) )
            unlink ($_FILES['upload']['tmp_name']);
        if (file_exists ($_FILES['upload-thumb']['tmp_name']) && is_file($_FILES['upload-thumb']['tmp_name']) )
            unlink ($_FILES['upload-thumb']['tmp_name']);

        echo json_encode($result);
        return;
        // end case "uploadFile"

        case "getGame":
            $id = new MongoID($_REQUEST["gameId"]);

            $query = array('_id' => $id);
            $cursor = $dbCollection->find($query);
            foreach ($cursor as $doc)
            {
                $game = $doc;
            }
            echo json_encode($game);
            break;

    ///////////////////////////////////////////
    // nothing  (null command for debugging) //
    ///////////////////////////////////////////
     case "nothing":
            echo json_encode(array("received 'nothing' command"));
            return;
        // end case "nothing"

    }; //end switch "cmd"
}
else return; //no CMD given
?>

