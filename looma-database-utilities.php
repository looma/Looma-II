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
require_once('includes/looma-utilities.php');

////////////////////////
///****************************************
  /// some of these utility functions should be allowed only for "logged in" users
  /// need to add that check to deleteField, updateByID, rename, delete, keywordadd,
  /// addchapterid, removechapterid, editactivities
  ///
///****************************************

  /////////////////////////////////
  // commands supported:
  //
  //       many of these functions are specialized. they should be re-used and generalized when possible
  //
  //  search    ****** needs to access "looma" and "loomalocal" databases
  //  searchChapters
  //  open
  //  openByID
  //  openByName
  //  openText
  //  deleteField
  //  updateByID
  //  save
  //  copytext
  //  rename
  //  exists    ****** needs to access "looma" and "loomalocal" databases
  //  delete
  //  textBookList
  //  textChapterList
  //  textSubjectList
  //  gameSubjectList
  //  bookList
  //  bookChapterList
  //  keywordList
  //  keywordAdd
  //  addChapterID
  //  chapterExists
  //  removeChapterID
  //  editActivity
  //  uploadFile
  //  download
  /// sendMail
  /// getLogData
  /// getLogLocations
  ////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////////
    //////  auxiliary functions. not in API for looma-database-utilities.php ////////
    /////////////////////////////////////////////////////////////////////////////////

    // SAVEACTIVITY function
        function saveActivity($collection, $insert) {
                $result = mongoInsert($collection, $insert);
                echo json_encode($result);
        } //end SAVEACTIVITY

        //saveToMongo function
        function saveToMongo($dbcollection, $name, $type, $insert, $activitycollection) {
              // save or update a document in $db database [$db is either 'looma' or 'loomalocal']
              // in collection $collections[$type] or $localcollections[$type]
              // with displayname==$name and ft==$type inserting $insert fields.
              // if $activitycollection is not NULL it is the db/collection to save corresponding activity document

            //global $activities_collection, $local_activities_collection;
            global $db, $collections, $localcollections;

            $query =array('dn'=>trim($name),'ft'=>$type);

            //NOTE: using findAndModify here so that we get the _id of the updated document to use in following activity save
            // later versions of MONGO may have a simpler way to get back the _id


            $result = mongoFindAndModify($dbcollection, $query, array('$set' => $insert));
            $result1 = null;

            if ($activitycollection) {  // if $activity param is true
                // save new document in the activities collection or
                // update existing activities pointing to this file
                $resultId = $result['_id'];
                $mongoID = mongoId($resultId); // mongoID of document we just saved
                $query = array("ft" => $insert['ft'], "mongoID" => $mongoID);

                $toinsert = array(
                    "ft"      => $insert['ft'],
                    "mongoID" => $mongoID,
                    "dn"      => $insert['dn'],
                    "db"      => $_REQUEST['db']
                     );
                if (isset($insert['thumb']))  $toinsert['thumb'] = $insert['thumb'];


                if ( $db === 'loomalocal') $collectionForActivity = $localcollections['activities'];
                else                       $collectionForActivity = $collections['activities'];

                //echo "saving activity for lesson " . $name . " in DB/collection " . $collectionForActivity . "   DB is " . $db; exit;


                $result1 = mongoFindAndModify($collectionForActivity, $query, array('$set' => $toinsert));;
            }

            return(array('item' => $result, 'activity'=> $result1));

        }  //end saveToMongo()


        function changename($collection, $activitycollection, $oldname, $newname, $ft, $activity) {

                $query = array('dn' => $oldname, 'ft' => $ft);
                $update = array('$set' => array('dn' => $newname));
                //$projection = array('_id' => 1, 'dn' => 1);
                //$options = array('new' => True);
                $result = mongoFindAndModify($collection, $query, $update);

                echo json_encode($result);

        //  AND update 'dn' for existing activities pointing to this text file
            if ($activity) {
                $id = $result['_id'];
                $id = mongoId($id); // mongoID of the text we just saved
                $query =   array("ft" => $ft, "mongoID" => $id);
                $update =  array('$set' => array('dn' => $newname));
                //$options = array('multiple' => true);

                $result1 = mongoUpdateMany($activitycollection, $query, $update);

                echo json_encode($result1);
            }
        } //end CHANGENAME)

        function hasLesson($ch_id) {

    ////// needs to be updated to look in 'loomalocal' database in addition to 'looma'

            global $activities_collection;
            $r = mongoRegex((string) $ch_id);
            $lesson = mongoFindOne($activities_collection,array('ft' => 'lesson', 'ch_id'=> $r));

            if( isset($lesson) && !isset($lesson['db'])) $lesson['db'] = 'looma';
            return $lesson;
        };  // end hasLesson()

      function formatDate($utc,$timeframe) {

          $utc = max($utc,1633046400);  //looma epoch time is strtotime('October 1,2021')

          switch ($timeframe) {
              case "hours":  $formatted = date("Y:m:W:d:H", $utc);
              case "days":   $formatted = date("Y:m:W:d",   $utc);
              case "weeks":  $formatted = date("Y:m:W",     $utc);
              case "months": $formatted = date("Y:m",       $utc);
              default:       $formatted = date("Y:m:W:d:H", $utc);
          };
          return $formatted;
      } // end formatDate()

        function increment($utc,$timeframe) {
            // WARNING: UTC values in PHP are in SECONDS, in JS they are in MILLIseconds
            $utc = max($utc,1633046400);  //looma epoch time is strtotime('October 1,2021')

            //    echo ' - - - - - incrementing '. $utc.' to '.$utc+60*60;
            switch ($timeframe) {
                case "hours":  return $utc +           60 * 60;
                case "days":   return $utc +      24 * 60 * 60;
                case "weeks":  return $utc +  7 * 24 * 60 * 60;
                case "months": return $utc + 30 * 24 * 60 * 60;
                default:       return 0;
            }
        } // end increment()

        function fillLogData ($data, $timeframe) {
            $temp = []; $temp[] = $data[0];
            $earlierUTC = isset($data[0]['utc']) ? $data[0]['utc'] : 1633046400; // 1633046400 is Oct 1, 2021

            for ($i=1; $i< count($data); $i++)
            if (isset($data[$i]['utc'])) {

                $UTC = max($data[$i]['utc'], 1633046400); //looma epoch time is strtotime('October 1,2021')
                $formatted = formatDate($UTC,$timeframe);

                $nextUTC = increment($earlierUTC,$timeframe);  // in UTC
                $nextFormatted = formatDate($nextUTC, $timeframe);

              //  while ($nextFormatted < $formatted) {
                if ($timeframe !== 'months') while ($nextUTC < $UTC && $nextFormatted !== $formatted) {
                    $filler = [];
                    $filler['visits'] = 0;
                    $filler['uniques']=0;
                    $filler['utc'] = $nextUTC;
                    $filler['time'] = $nextFormatted;
                    $temp[] =$filler;

                    $nextUTC =    increment($nextUTC, $timeframe);
                    $nextFormatted = formatDate($nextUTC, $timeframe);
                };
                $earlierUTC = $UTC;
                $temp[] = $data[$i];
            };

            //print_r($data); echo '<br>'; print_r($temp);echo '<br>'; exit;
            return $temp;
        }  // end fillLogData()

/*****************************/
/****   main code here    ****/
/*****************************/

  if      ($_SERVER['SERVER_NAME'] === 'learning.cehrd.edu.np')
            $LOOMA_SERVER = 'CEHRD';
  else if ($_SERVER['SERVER_NAME'] === '54.214.229.222' || $_SERVER['SERVER_NAME'] === 'looma.website')
            $LOOMA_SERVER = 'looma';
  else      $LOOMA_SERVER = 'looma local';

  date_default_timezone_set ( 'UTC');
  $date = date("Y.m.d");

  $login =       (isset($_COOKIE['login']) ?       $_COOKIE['login'] : null);
  $login_team =  (isset($_COOKIE['login-team']) ?  $_COOKIE['login-team'] : null);
  $login_level = (isset($_COOKIE['login-level']) ? $_COOKIE['login-level'] : null);

  // caller specifies DB ['looma' or 'loomalocal'] and COLLECTION ['activities', 'lessons', 'text_files', etc]
  if (isset($_REQUEST['db'])) $db = $_REQUEST['db'];

  if (isset($_REQUEST["collection"])) {  // text name of collection, like "activities", "lessons"
      $collection =  $_REQUEST["collection"];
      if ( isset($db) && $db === 'loomalocal') {  // use 'loomalocal' database
          $dbCollection =       $localcollections[$collection];
          $activitycollection = (isset($_REQUEST['activity']) && $_REQUEST['activity'] === 'true') ?
              $localcollections['activities'] : null;
      } else {  // use 'looma' database [default]
          $dbCollection =       $collections[$collection];
          $activitycollection = (isset($_REQUEST['activity']) && $_REQUEST['activity'] === 'true') ?
              $collections['activities'] : null;
      }
    }

  if ( isset($_REQUEST["cmd"]) ) {
    $cmd =  $_REQUEST["cmd"];
    //accepted commands are "open", "openByName", "openByID","openText","save","copytext","updateByID","rename", "exists", "delete","deleteField",
      // "textBookList","textSubjectList","textChapterList","bookList","bookChapterList","keywordRoot","keywordList","search","searchChapters",
      // "keywordAdd", "addChapterID","removeChapterID","editActivity","uploadFile", "download", "sendMail"


      switch ($cmd) {
        ////////////////////////
        // - - - OPEN   - - - //
        ////////////////////////
        case "open":

            $query = array("dn" => trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)));

            if ($_REQUEST['ft']) {
                $ft = $_REQUEST['ft'];
                if ($ft ==='video') $query['ft'] = array('$in' => ['video','mp4','mov']);
                else $query['ft'] = $_REQUEST['ft'];
            }

            //look up this DN (display name) in this collection (dbCollection)
            $file = mongoFindOne($dbCollection, $query);  // assumes this collection with unique DNs (index unique)
            if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
            else echo json_encode(array("error" => "File not found"));  // if not found, return an error object {'error': errormessage}
            return;
        // end case "open"


        ////////////////////////
        // - - - OpenByName   - - - //
        ////////////////////////
        case "openByName":
            $query = array('dn' => $_REQUEST['dn']);

            //echo "request is " . $query['dn'];
            //echo "filetype is " . $query['ft'];

            //look up this DN (display name) in this collection (dbCollection)
            $file = mongoFindOne($dbCollection, $query);  // assumes someone is maintaining this collection has unique DNs (index unique)
            if ($file) echo json_encode($file);     // if found, return the contents of the mongo document
            else echo json_encode(array("error" => "File not found"));  // in not found, return an error object {'error': errormessage}
            return;
        // end case "openByName"


////////////////////////
// - - - OpenByID - - - //
////////////////////////
    case "openByID":
        if (isset($_REQUEST['id']) && $_REQUEST['id']) {
                if ($collection == "chapters") $query = array('_id' => $_REQUEST['id']);
                else                           $query = array('_id' => mongoId($_REQUEST['id']));
                //look up this ID (mongoID) in this collection (dbCollection)
                $file = mongoFindOne($dbCollection, $query);

                //echo 'using ' . $dbCollection . ' found ' . $file . '  with ' . $query; exit;

                ////////////// for chapter, add in some information from the textbook collection
                if ($file && $collection == "chapters") {
                    $query = array('prefix' => prefix($file['_id']));
                    $textbook = mongoFindOne($textbooks_collection, $query);
                    $file['fp'] = $textbook['fp'];
                    $file['fn'] = $textbook['fn'];
                    $file['nfn'] = $textbook['nfn'];
                }

                if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
                else       echo json_encode(array("dn" => "File not found",
                                                        "ft" => "none",
                                                        "thumb" => "images/alert.jpg"));
            } else {
                echo json_encode(array("dn" => "File not found",
                    "ft" => "none",
                    "thumb" => "images/alert.jpg"));
            }
            return;

    // end case "openByID"

////////////////////////
// - - - OpenText - - - //
////////////////////////
    case "openText":
        $query = array();
        if (isset($_REQUEST['filter']) && $_REQUEST['filter'] != "")
            $query = array('dn' => mongoRegexOptions($_REQUEST['filter'],'i'));

        else if (isset($_REQUEST['id']))
            $query = array('_id'=> mongoId($_REQUEST['id']));

        //look up this ID (mongoID) in this collection (dbCollection)
            //print_r($query);return;
       // function mongoFind($collection, $filter, $sort, $skip, $limit)
        $texts = mongoFind($dbCollection, $query, null, (integer) $_REQUEST['skip'], 1);

        if ($texts) foreach($texts as $text) echo json_encode($text);        // if found, return the contents of the mongo document
        else echo json_encode(array("error" => "File not found in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}
        return;
    // end case "OpenText"


////////////////////////
    // - - - UpdateByID - - - //
    ////////////////////////
    case "updateByID":  //called with 'collection', 'id', and an update Object

        $query = array('_id' => mongoId($_REQUEST['id']));
        //update this ID (mongoID) in this collection (dbCollection)

        $update = array('$set' => json_decode($_REQUEST["data"]));

        $result = mongoUpdate($dbCollection, $query, $update);

        if ($result) echo json_encode($result);
        else echo json_encode(array("error" => "File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}

        return;
    // end case "updateByID"


    ////////////////////////
    // - - - deleteField - - - //
    ////////////////////////
    case "deleteField":

        $query = array('_id' => mongoId($_REQUEST['id']));
        $update = array('$unset' => json_decode($_REQUEST["data"]));

        $result = mongoUpdate($dbCollection, $query, $update);

        if ($result) echo json_encode($result);
        else echo json_encode(array("error" => "File not found " . $_REQUEST['id'] . " in collection  " . $dbCollection));  // in not found, return an error object {'error': errormessage}

        return;
    //end case "deleteField"


    ////////////////////////
    // - - - SAVE - - - ////
    ///////////////////////
    case "save":
        if ( ($collection == "text") || ($collection == "text_files")) {
            $save_dn = trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES));

            $insert = array(
                "dn" => $save_dn,
                "ft" => $_REQUEST["ft"],
                "date" => gmdate("Y.m.d")  //using greenwich time
            );

            if (isset($_REQUEST['translator'])) {
                 $insert['translator'] = $_REQUEST['translator'];
            }
            else {
                $insert['author'] = $login;
                if (!($login_level==='admin' || $login_level==='exec' || $login_level === 'teacher' || $login_team === 'teacher') ) {
                    $insert['team'] = $login_team;
                }
            }

            if (isset($_REQUEST['nepali']))
                 $insert['nepali'] = $_REQUEST['nepali'];
            else $insert['data']   = $_REQUEST['data'];

            $result = saveToMongo($dbCollection, $save_dn, $_REQUEST['ft'], $insert, $activitycollection);
            echo json_encode($result);
        }
        else if ( ($collection == "lesson") || ($collection == "lessons")) {
            //NOTE: historical artifact, some JS may set collection to 'lesson', some to 'lessons'
            // THIS SHOULD BE CLEANED UP sometime
            $save_dn = trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES));

            $insert = array(
                "dn" => $save_dn,
                "ft" => 'lesson',
                "db" => $_REQUEST['db'],
                "date" => gmdate("Y.m.d"),  //using greenwich time
                "data" => array_values($_REQUEST["data"])
            );

            if (isset($_REQUEST['author'])) $insert['author'] = $_REQUEST['author'];
            if (isset($_REQUEST['editor'])) $insert['editor'] = $_REQUEST['editor'];

/*
            if (isset($_REQUEST['author'])) $insert['editor'] = $login;
            else                            $insert['author'] = $login;
*/


            if (!($login_level==='admin' ||
                  $login_level==='exec' ||
                  $login_team === 'teacher') ) { $insert['team'] = $login_team;};

    //echo "saving lesson " . $save_dn . " in DB/collection " . $dbCollection; exit;

            $result = saveToMongo($dbCollection, $save_dn, 'lesson', $insert, true);

            echo json_encode($result);
        }
        else if (($collection == "edited_videos")  || ($collection == "slideshows")) {
            //$thumb = isset($_REQUEST['thumb']) ? $_REQUEST['thumb'] : "";
            $insert = array(
                "dn" => trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)),
                "ft" => $_REQUEST["ft"],  //TYPE can be 'text' or 'text-template'
                "author" => $_COOKIE['login'],
                "date" => gmdate("Y.m.d"),  //using greenwich time
                "data" => $_REQUEST["data"]
            );
            if (isset($_REQUEST['thumb'])) $insert['thumb'] = $_REQUEST['thumb'];

            $result = saveToMongo($dbCollection, trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)), $_REQUEST['ft'], $insert, $activitycollection);
            echo json_encode($result);
        }
        else if ($collection == "activities") {
            $insert = $_REQUEST['data'];
            $insert["date"] = gmdate("Y.m.d");  //using greenwich time
            $insert["author"] = $_COOKIE['login'];
            if (isset($_REQUEST['thumb'])) $insert['thumb'] = $_REQUEST['thumb'];

            saveActivity($dbCollection, $insert);
        }
        else if ($collection == "new_content") {
            $insert = $_REQUEST['data'];
            $insert["date"] = gmdate("Y.m.d");  //using greenwich time
            $insert["author"] = $_COOKIE['login'];

            $result = mongoInsert($dbCollection, $insert);

            echo json_encode($result);
        }

        // included handling recordedvideos, still need new collection so that everything saves correctly
        else if ($collection == "recorded_videos"){
            $insert = array(
                "dn" => trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)),
                "ft" => $_REQUEST["ft"],  //TYPE is video
                "author" => $_REQUEST['data'],
                "date" => gmdate("Y_m_d"),  //using greenwich time
                //"data" => $_REQUEST["data"],
                "fp" => '../content/recorded_videos/',
                "fn" => trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)).'.mp4'
            );

            $result = saveToMongo($dbCollection,
                                     trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)), $_REQUEST['ft'],
                                     $insert,
                $activitycollection);
            echo json_encode($result);

        }
        // else handle other collections' specific save requirements
        return;
    // end case "save"

  ////////////////////////
  // - - - COPYTEXT - - - //
  ////////////////////////

     case "copytext":

          // given a mongodb _id for an activity, and a new dn and new filetype
          // make a copy of that activity with given new name and type
              // open the mongo activity
              // if mongoID, open the file it points to
              // change its name
              // save the copy
              // save a new activity
              //return response with _id (activity) and [optional] mongoID (file it points to)
        global $mongo_level;
        $id = $_REQUEST['id'];
        $newname = trim(htmlspecialchars_decode($_REQUEST['dn'], ENT_QUOTES));
           //NOTE PHP random_int() not in php 5.6 (not until php 7)
       if (preg_match("/\(\d\d\d\)/", $newname))
            $newname = preg_replace('/\(\d\d\d\)/', '(' . rand(100, 999) . ')', $newname);
        else $newname = $newname . '(' . rand(100, 999) . ')';

        $newtype = 'text';

        $query = array('_id' => mongoId($id));
        $activity = mongoFindOne($activitycollection, $query);

        $insert = array("dn" => $newname, "ft" => $newtype);

       if (isset($activity['mongoID']) && $activity['mongoID']) {
            // if there is a mongo document for this activity
            // copy it, rename and retype the copy, and save the copy
            $query = array('_id' => ($activity['mongoID']));
            $file = mongoFindOne($text_files_collection, $query);

            $newfile = array('dn' => $newname);
            $newfile["ft"] = $newtype;
            $newfile["data"] = $file["data"];

            $newfile["author"] = $_COOKIE['login'];
            $newfile["date"] = gmdate("Y.m.d");  // using greenwich time

            if ($mongo_level >= 4) {
                $result = mongoInsert($dbCollection, $newfile);
            } else { // for mongodb 2.6
                $result = mongoFindAndModify($dbCollection, array('dn' => $newname), $newfile);
            }
            // now save a new activity for this file
            $newmongoid = mongoGetId($result);  //uses mongo getInsertedId() to get mongoid as string
            $insert['mongoID'] = mongoId($newmongoid); // convert mongoid string to mongoid objectId and save
        };

        if ($mongo_level >= 4) {
            $result1 = mongoInsert($activitycollection, $insert);
        } else { // for mongodb 2.6
            $result1 = mongoFindAndModify($activitycollection, array('dn' => $newname), $insert);
        };

        // return id(activity), dn, and mongoID(textfile)
        echo json_encode((object)array(
            'id' =>  mongoGetId($result1),
            'dn' => $newname,
            'mongoID' => (string)$newmongoid));
        return;
// end case "copytext"


    ////////////////////////
    // - - - RENAME - - - //
    ////////////////////////
    case "rename":
        changename($dbCollection, $activitycollection,
                   trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)),
                   trim(htmlspecialchars_decode($_REQUEST['newname'],ENT_QUOTES)),
                   $_REQUEST['ft'], true);
        return;
    // end case "rename"


    ////////////////////////
    // - - - EXISTS - - - //
    ////////////////////////
          case "exists":

    //find "dn" of type "ft"
    // look in collections[ft] and in localcollections[ft]
    // if found,  return its {_id:id, name:dn, author:author}
    // else return {_id: NULL}

   // echo "in 'exists', dn = " . $_REQUEST['dn']. "ft = " . $_REQUEST['ft']. "collection = " . $_REQUEST['collection'];

        $query = array('dn' => trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)), 'ft' => $_REQUEST['ft']);
        $projection = array("_id" => 1, "author" => 1);

        //////
        $result = mongoFindOne($collections[$_REQUEST['collection']], $query);
        if ($result) {
            echo json_encode(array("_id" => $result["_id"],
                "name" => $result["dn"],
                "author" => (isset($result["author"]) ? $result["author"] : null)));
            return;
         };

        $result = mongoFindOne($localcollections[$_REQUEST['collection']], $query);
        if ($result) {
            echo json_encode(array("_id" => $result["_id"],
                "name" => $result["dn"],
                "author" => (isset($result["author"]) ? $result["author"] : null)));
            return;
        };

        echo json_encode(array("_id" => ""));
        return;
    // end case "exists"


        ////////////////////////
        // - - - DELETE - - - //
        ////////////////////////
        case "delete":
            $query = array('dn' => trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)), 'ft' => $_REQUEST['ft']);
            $file = mongoFindOne($dbCollection, $query);

    //echo 'in DELETE, found file ' . $_REQUEST['dn'] . ' as ' . $file['dn']; return;

            if ($file) {
                mongoDeleteOne($dbCollection, $query);  //, array("justOne" => true));
                echo 'Looma-database-utilities.php, deleted file: ' .  trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES)) . ' of type: ' . $_REQUEST['ft'];

               // echo 'file _id is ' . $file['_id'];

                // delete any references to the file from Activities collection
                $removequery = array('mongoID' => mongoId($file['_id']));

           // echo 'activitycollection is ' . $activitycollection . ' and removequery is ' . $removequery['mongoID'];

                mongoDeleteMany($activitycollection, $removequery);  //removes multiple instances, in case >1 activities point to this file
            }
            return;
        // end case "delete"


        ////////////////////////
        // - - - textBookList - - - //
        ////////////////////////
        case "textBookList":

            // inputs is class
            //    query textbooks collection to get list of textbooks for this class
            //    return a array of JSON documents from textbooks collection

            $query = array('class' => $_REQUEST['class']);
            $books = mongoFind($textbooks_collection, $query, null, null, null);
            $response = [];
            foreach ($books as $book) $response[] = $book;

            echo json_encode($response);
            return;


        /////////////////////////////
        // - - - textSubjectList - - - //
        /////////////////////////////
        case "textSubjectList":
            // input is class
            //    query textbooks collection to get subjects available for this class
            //    return a HTML string containing OPTION elements for a SELECT element

        /*
            $subjects = array(
                'S' => 'science',
                'M' => 'math',
                'EN' => 'english',
                'N' => 'nepali',
                'SS' => 'social studies',
                'H'  => 'health',
                'V'  => 'vocation',
                'SSa' => 'social studies optional', //now used for "Moral Education"
                'Ma' => 'math optional');
        */
            $query = array('class' => 'class' . $_REQUEST['class']);
            //print_r($query);

            $projection = array('_id' => 0, 'subject' => 1);
            $subjects = mongoFind($textbooks_collection, $query, null, null, null);
            foreach ($subjects as $subj) echo "<option value='" . $subj['subject'] . "'>"  . $subj['subject'] . "</option>";
            return;  // end textSubjectList()


          /////////////////////////////
          // - - - gameSubjectList - - - //
          /////////////////////////////
          case "gameSubjectList":
              // input is class
              //    query games and histories collections to get subjects available for this class
              /* $subjects = array(
                      'S' => 'science',
                      'M' => 'math',
                      'EN' => 'english',
                      'N' => 'nepali',
                      'SS' => 'social studies',
                      'H'  => 'health',
                      'V'  => 'vocation',
                      'SSa' => 'social studies optional', //now used for "Moral Education"
                      'Ma' => 'math optional');
              */
              $subjectList = [];
              $query = [];
              $query['cl_lo'] = array('$lte' => (int)substr($_REQUEST['class'],5));
              $query['cl_hi'] = array('$gte' => (int)substr($_REQUEST['class'],5));
            //  $query = array('cl_lo' => array('$lte' => substr($_REQUEST['class'],5)),
              //               'cl_hi' => array('$gte' => substr($_REQUEST['class'],5)));

              $games = mongoFind($games_collection, $query, null, null, null);
              foreach ($games as $game) {
                  //echo "game[subject][index] is " . $game['subject'][$index];
                  if (isset($game['subject'])) foreach ($game['subject'] as $index => $subj) $subjectList[] = $game['subject'][$index];
              }

              $histories = mongoFind($history_collection, $query, null, null, null);
              foreach ($histories as $history)
                  foreach ($history['subject'] as $index => $subj) $subjectList[] = $history['subject'][$index];

              $subjectList[] = 'math';
              $subjectList[] = 'english';

              echo json_encode(array_unique($subjectList));
              return;  // end gameSubjectList()

        /////////////////////////////////
        // - - - textChapterList - - - //
        /////////////////////////////////
        case "textChapterList":

            // inputs are class and subject and [optional] lang ('en' or 'np')
            //    first query textbooks collection to get prefix ( class, subject )
            //    then query chapters collection for chapters whose _id matches the prefix
            //    return a HTML string containing OPTION elements for a SELECT element

            /*
            $subjects = array(
                'S' => 'science',
                'M' => 'math',
                'EN' => 'english',
                'N' => 'nepali',
                'SS' => 'social studies',
                'H'  => 'health',
                'V'  => 'vocation',
                'SSa' => 'social studies optional', //now used for "Moral Education"
                'Ma' => 'math optional');
            */

            $query = array('class' => 'class' . $_REQUEST['class'],
                           'subject' => $_REQUEST['subject']);
                    //print_r($query);

            //$projection = array('_id' => 0, 'prefix' => 1);
            $textbook = mongoFindOne($textbooks_collection, $query);
                    //echo "mongo result is "; print_r($textbook);
                    //echo "prefix is $textbook['prefix']";

            if($textbook) {
                $regex = "^" . $textbook['prefix']. "\d";
                    //echo "regex is $regex";

                if (isset($_REQUEST['lang'])) $lang = $_REQUEST['lang'];
                else                          $lang = 'en';

                    //echo "lang is " . $lang;

              //  $query = array('_id' => array('$regex' => mongoRegex($regex)));
                $query = array('_id' => mongoRegex($regex));
                $chapters = mongoFind($chapters_collection, $query, '_id', null, null);
                foreach ($chapters as $ch) {

                    // check if a lesson exists for this chapter
                    $hasLesson = hasLesson($ch['_id']);

                    //if ($hasLesson && !isset($hasLesson['mongoID'])) { echo 'haslesson with no mongoID: ' . $hasLesson['dn'];}

                    $mark = $hasLesson ? "class='hasLesson'" .
                        "data-mongo='" . $hasLesson['mongoID'] .
                        "' data-db='" . $hasLesson['db'] .
                        "' " : "";

                    if      ($lang === 'en' && isset($ch['dn'])  && $ch['dn'] !== '')
                        echo "<option " . $mark . " value='" . $ch['_id'] . "'>" . "(" . $ch['_id'] . ") " . $ch['dn'] . "</option>";
                    else if ($lang === 'np' &&  isset($ch['ndn']) && $ch['ndn'] !== '') {
                        $nch_id = ( isset($ch['nch_id'])) ? $ch['nch_id'] : $ch['_id'];
                        echo "<option " . $mark . "value='" . $nch_id . "'>" . "(" . $nch_id . ") " . $ch['ndn'] . "</option>";
                    }
                }
            }
            return;  // end textChapterList()

    ////////////////////////
    // - - - bookList - - - //
    ////////////////////////
        case "bookList":
            // inputs is book 'prefix'
            //    query activities collection to get list of books for this class
            //    return a array of JSON documents from activities collection

            $regex = "^" . $_REQUEST['prefix'] . "-";
            $query = array('prefix' => array('$regex' => $regex), 'ft' => 'book');
            $books = mongoFind($activities_collection, $query, null, null, null);

            foreach ($books as $book) echo "<option value='" . $book['prefix'] . "'>"  . $book['dn'] . "</option>";

            return;
        // end bookList()


    /////////////////////////////
    // - - - bookChapterList - - - //
    /////////////////////////////
        case "bookChapterList":
            $regex = "^" . $_REQUEST['book_id'] . "-";
            $query = array('book_id' => array('$regex' => $regex), 'ft' => 'pdf');

            $chapters = mongoFind($activities_collection, $query, null, null, null);
            $chapters->sort(array('book_id' => 1));
            foreach ($chapters as $ch) echo "<option value='" . $ch['book_id'] . "'>" . $ch['dn'] . "(" . $ch['book_id'] . ")</option>";

            return;  // end bookChapterList()




/////////////////////////////
// - - - KEYWORDROOT - - - //
/////////////////////////////
    case "keywordRoot":
        // lookup the 'root' document in tags collection and return an array of children keywords
        // format of result is [{name:name, id:id}, ...]  (id will == null if this keyword has no children)

        $query = array('name' => 'root');
        $root = mongoFindOne($tags_collection, $query);
        echo json_encode($root['children']);
        return;
// end case "keywordRoot"

/////////////////////////////
// - - - KEYWORDLIST - - - //
/////////////////////////////
    case "keywordList":
        // called with a mongoID. lookup that id in tags collection and return an array of children keywords of that keyword
        // format of result is [{name:name, id:id}, ...]  (id will == null if this keyword has no children)

        $query = array('_id' => mongoId($_POST['id']));
        $child = mongoFindOne($tags_collection, $query);
        echo json_encode($child['children']);
        return;
// end case "keywordList"


/////////////////////////////
// - - - KEYWORDADD - - - //
/////////////////////////////
          case "keywordAdd":
              // called with 'level', 'key1','key2','key3', 'newkeyword'
              $key1 =   isset($_POST['key1'])   ? $_POST['key1'] : null;
              $key2 =   isset($_POST['key2'])   ? $_POST['key2'] : null;
              $key3 =   isset($_POST['key3'])   ? $_POST['key3'] : null;
              $level =  isset($_POST['level'])  ? $_POST['level'] : null;
              $newkey = isset($_POST['newkey']) ? $_POST['newkey'] : null;

              // if MOTHER has kids [e.g. is not a leaf]
              // then add newkey as new kid in mother's document
              // else [mother is a leaf] create new doc for mother, backlink to grandmother, add newkey as kid

              //$query = array('_id' => mongoId($_POST['id']));
              //$newkeyword = mongoInsert($tags_collection, $query);
              echo json_encode('added ' . $newkey . ' at level ' . $level);
              return;
// end case "keywordAdd"


    ////////////////////////
    // - - - SEARCH - - - //
    ////////////////////////
    case "search":
        // called (from looma-search.js, from lesson-plan.js, and other "editors") using POST with FORMDATA serialized by jquery
        // $_POST[] can have these entries:
        // cmd = "searchChapters", collection, [class], [subj], [chapter (a ch_id)], sort, search-term,
        // [chapter-language (in 'en'|'np')],
        // key1, key2, key3, key4
        // src[] (array of checked 'sources') and type[] (array of checked 'types')

        // look in collections[ft] and in localcollections[ft]

        // known filetypes are the FT values in Activities collection
        // e.g. 'video', 'audio', 'image', 'pdf', 'textbook', 'text', 'html', 'slideshow', 'lesson', 'looma'

        if (isset($_REQUEST['language'])) $language = $_REQUEST['language']; else $language = 'english';

        $filetypes = array();       //array of FT filetypes to include in the search
        if (isset($_REQUEST['type'])) foreach ($_POST['type'] as $i) if ($i != '') array_push($filetypes, $i);
        //echo "types is: "; print_r($filetypes);

        $sources = array();       //array of sources to include in the search
        if (isset($_REQUEST['src'])) foreach ($_POST['src'] as $i) array_push($sources, $i);

        //echo "sources is: "; print_r($sources);

        $returnLessons = false;

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
                    array_push($extensions, "mp3", "m4a", "audio");
                    break;
                case 'html':
                    array_push($extensions, "EP", "html", "htm", "php", "asp");
                    break;
                case 'pdf':
                    array_push($extensions, "pdf","Document");
                    break;
                case 'lesson':
                    array_push($extensions, "lesson");
                    $returnLessons = true;
                    break;
                case 'history':
                case 'slideshow':
                case 'map':
                case 'text':
                case 'text-template':
                case 'lesson-template':
                case 'game':
                case 'looma':
                    array_push($extensions, $type);
                    break;
                case 'quiz': // filetype "quiz" not implemented yet
                    break;
                default: {echo json_encode("ERROR: unknown file type"); return;}
            }

        //Build Regex to match search term (add 'i' to ignore case)
        if (isset($_POST['search-term']) && $_POST['search-term'] |= '')
            $nameRegex = mongoRegexOptions(trim(preg_quote(htmlspecialchars_decode($_REQUEST['search-term'],ENT_QUOTES))), 'i');
        else
            $nameRegex = null;

        //if 'class' or 'subj' are specified, build another regex to match class/subj in ch_id
        if (isset($_POST['chapter']) && $_POST['chapter'] != '') {
            $classSubjRegex = $_POST['chapter'];
        } elseif ((isset($_POST['class']) && $_POST['class'] != '') || (isset($_POST['subj']) && $_POST['subj'] != '')) {
            $classSubjRegex = "/";
            //echo 'classSubjRegex is ' . $classSubjRegex;
            if (isset($_POST['class']) && $_POST['class'] != '') $classSubjRegex .= '^' . $_POST['class'];
            //echo 'classSubjRegex is ' . $classSubjRegex;
            if (isset($_POST['subj']) && $_POST['subj'] != '') $classSubjRegex .= $_POST['subj'] . '\d';

            $classSubjRegex = mongoRegex($classSubjRegex . '/');
             //echo 'classSubjRegex is ' . $classSubjRegex;
       } else
            $classSubjRegex = null;


        /* DEBUG
        echo 'collection is ' . $_POST['collection'];
        echo 'filetypes are '; print_r($filetypes);
        echo 'source is  '; print_r($sources);
        echo 'extensions are '; print_r($extensions);
        echo 'class is ' . $_POST['class'] . ' and subj is ' . $_POST['subj'] . '       ';
        echo '$nameRegex is ' . $nameRegex . '    and $classSubjRegex is ' . $classSubjRegex;
        return;
         */

        $query = array();
        if (sizeof($extensions) > 0) $query['ft'] = array('$in' => $extensions);  //if filetypes given, search only for them

         else if(isset($_REQUEST['includeLesson']) && $_REQUEST['includeLesson'] == 'false') $query['ft'] = array('$nin' => ['lesson']);

        if (sizeof($sources) > 0) $query['src'] = array('$in' => $sources);

        if ($nameRegex && !$_REQUEST['semantic']) {
        //     if ($language === 'english') $query['dn'] = $nameRegex;
        //     else                         $query['ndn'] = $nameRegex;
        //echo "language is " . $language . "   and regex is " . $nameRegex;

            if (preg_match('/\p{Devanagari}/u', $_POST['search-term']))
            // detects Devanagari characters
            // good tutorial here: https://www.regular-expressions.info/unicode.html
                $query['ndn'] = $nameRegex;
            else
                $query['dn']  = $nameRegex;
        }

        if ($classSubjRegex) $query['_id'] = $classSubjRegex;

        // using REGEX with "/i" to get case insensitive search for keywords
        if (isset($_REQUEST['key1']) && $_REQUEST['key1'] != '') {
           // $query['key1'] = $_REQUEST['key1'] === 'none'? null : mongoRegex('/'.$_REQUEST['key1'].'/i');
            $query['key1'] = $_REQUEST['key1'] === 'none'? null : mongoRegexOptions($_REQUEST['key1'], 'i');
        }
        if (isset($_REQUEST['key2']) && $_REQUEST['key2'] != '') {
            //$query['key2'] = $_REQUEST['key2'] === 'none'? null : mongoRegex('/'.$_REQUEST['key2'].'/i');
            $query['key2'] = $_REQUEST['key2'] === 'none'? null : mongoRegexOptions($_REQUEST['key2'], 'i');
        }
        if (isset($_REQUEST['key3']) && $_REQUEST['key3'] != '') {
            //$query['key3'] = $_REQUEST['key3'] === 'none'? null : mongoRegex('/'.$_REQUEST['key3'].'/i');
            $query['key3'] = $_REQUEST['key3'] === 'none'? null : mongoRegexOptions($_REQUEST['key3'], 'i');
        }
        if (isset($_REQUEST['key4']) && $_REQUEST['key4'] != '') {
            //$query['key4'] = $_REQUEST['key4'] === 'none'? null : mongoRegex('/'.$_REQUEST['key4'].'/i');
            $query['key4'] = $_REQUEST['key4'] === 'none'? null : mongoRegexOptions($_REQUEST['key4'], 'i');
        }

        //echo "query is: "; print_r($query);
        if ($_REQUEST['semantic']) {
            $raw_result = shell_exec("export TRANSFORMERS_CACHE=/tmp/.cache; python3 search.py \"" . $_POST['search-term'] . "\"");
            $qdrant_results = json_decode($raw_result, true);
            $ids = array_column($qdrant_results, 'source_id');
            $qdrant_results_dict = array_combine($ids, $qdrant_results);

            $query["_id"] = array();
            $query["_id"]['$in'] = array_map(function($d) {return mongoId($d["source_id"]);}, $qdrant_results);
        }

        ///// making call to MONGO in 'looma' database //////
        $cursor = mongoFind($collections[$_REQUEST['collection']], $query, 'dn', null, null);   //->skip($page)->limit(20);
        $result = array();
        foreach ($cursor as $d)  {
            $d['db'] = 'looma';
            $result[] = $d;
         };

      //echo "result is ";print_r($result);

        ///// making call to MONGO in 'loomalocal' database //////
        $cursor1 = mongoFind($localcollections[$_REQUEST['collection']], $query, 'dn', null, null);   //->skip($page)->limit(20);

        foreach ($cursor1 as $d)  {
            $d['db'] = 'loomalocal';
            $result[] = $d;
        };

        // removing duplicate results - based on 'fn' and 'fp' being equal
        // this allows for duplicate display names ["dn"] in 'activities' collection

        $unique = array();

        //echo "result is ";print_r($result);

        if (sizeof($result) > 0 ) {

            $result = alphabetize_by_dn($result);
            // after SORT, compare adjacent items for equality and remove duplicates
            $unique[] = $result[0];
            $specials = array('text', 'text-template', 'slideshow', 'looma', 'lesson', 'lesson-template', 'evi', 'history', 'map', 'game');
            for ($i = 1; $i < sizeof($result); $i++) {
                if ($result[$i]['ft'] !== 'quiz') {
                    if ($result[$i]['ft'] !== $result[$i - 1]['ft']) $unique[] = $result[$i];
                    else if ($result[$i]['db'] !== $result[$i - 1]['db']) $unique[] = $result[$i];

                    else if ($result[$i]['ft'] === 'EP' && $result[$i]['version'] == '2019') {
                        if ($result[$i]['dn'] !== $result[$i - 1]['dn'] ||
                            $result[$i]['grade'] !== $result[$i - 1]['grade'])
                            $unique[] = $result[$i];
                    } else if ($result[$i]['ft'] === 'EP' && $result[$i]['version'] == '2022') {
                        if ($result[$i]['dn'] !== $result[$i - 1]['dn'] ||
                            $result[$i]['grade'] !== $result[$i - 1]['grade'])
                            $unique[] = $result[$i];
                    } else if ($result[$i]['ft'] === 'EP' && $result[$i]['version'] == '2015') {
                        if ($result[$i]['dn'] !== $result[$i - 1]['dn'] ||
                            $result[$i]['grade'] !== $result[$i - 1]['grade'])
                            $unique[] = $result[$i];
                    } // for  special filetypes (in $specials) just match on displayname to determine uniqueness
                    else if (in_array($result[$i]['ft'], $specials)) {
                        if ($result[$i]['dn'] !== $result[$i - 1]['dn']) $unique[] = $result[$i];
                    } // for all other filetypes match on filename and fp (if present) to determine uniqueness
                    else if ((isset($result[$i]['fn']) && isset($result[$i - 1]['fn']) && $result[$i]['fn'] !== $result[$i - 1]['fn'])
                        || (isset($result[$i]['nfn']) && isset($result[$i - 1]['nfn']) && $result[$i]['nfn'] !== $result[$i - 1]['nfn'])
                        //  ||   (isset($result[$i]['nfn']) && isset($result[$i-1]['fn'])  && $result[$i]['nfn'] !== $result[$i-1]['fn'])
                        //  ||   (isset($result[$i]['fn'])  && isset($result[$i-1]['nfn']) && $result[$i]['fn']  !== $result[$i-1]['nfn'])
                        || (isset($result[$i]['fp']) && isset($result[$i - 1]['fp']) && $result[$i]['fp'] !== $result[$i - 1]['fp']))
                        $unique[] = $result[$i];
                }
            }
            $numUnique = sizeof($unique);

            if (isset($_REQUEST['pagesz']) && isset($_REQUEST['pageno']))
                $unique = array_slice($unique, ($_REQUEST['pageno'] - 1) * $_REQUEST['pagesz'], $_REQUEST['pagesz']);
        } else $numUnique = 0;

        if ($_REQUEST['semantic']) {
            usort($unique, function($a, $b) use ($qdrant_results_dict) {
//                 error_log(print_r($a, TRUE));
//                 error_log(print_r($qdrant_results_dict, TRUE));
                $indexA = $qdrant_results_dict[(string) $a["_id"]]['score'];
                $indexB = $qdrant_results_dict[(string) $b["_id"]]['score'];
                error_log(print_r($indexA < $indexB, TRUE));
                return $indexA < $indexB;
            });
        }

        //echo json_encode($numUnique);
        echo json_encode(array('count'=> $numUnique, 'list'=>$unique));
        return;
    // end case "search"

    ////////////////////////////////
    // - - - SEARCHCHAPTERS - - - //
    ////////////////////////////////
        case "searchChapters":
            // called (from lesson-search.js, etc) using POST with FORMDATA serialized by jquery
            // $_POST[] can have these entries: cmd (='searchChapters'), collection (='chapters'), class, subj, chapter-language, chapter
            //                and skip, sort, limit

            $subjectcodes = array(
                'science' => 'S',   'math' => 'M',              'english' => 'EN',
                'nepali' => 'N',    'social studies' => 'SS',   'health' => 'H',
                'vocation' => 'V',  'moral education' => 'SSa', 'science optional' => 'Sa',
                'math optional' => 'Ma');

           // if (isset($_REQUEST['search-term'])) $dn = $_REQUEST['search-term']; else $dn = null;
            if (isset($_REQUEST['chapter-language'])) $lang = $_REQUEST['chapter-language']; else $lang = 'en';
            //if (isset($_REQUEST['lang'])) $lang = $_REQUEST['lang']; else $lang = 'en';  //may be 'language' or 'lang'. legal values 'any', 'en', 'np'
            if (isset($_REQUEST['class'])) $class = $_REQUEST['class']; else $class = null;
            if (isset($_REQUEST['subj'])) $subj = $_REQUEST['subj']; else $subj = null;
            if (isset($_REQUEST['chapter'])) $chapter = $_REQUEST['chapter']; else $chapter = null;


            $classSubjRegex = null;
            if (isset($chapter) && $chapter != '') {
                $classSubjRegex = $chapter;
            } elseif ((isset($class) && $class != '') || (isset($subj) && $subj != '')) {
                //$classSubjRegex = "/";
                if (isset($class) && $class != '') $classSubjRegex .= '^' . $class;
                if (isset($subj)  && $subj  != '') $classSubjRegex .= $subjectcodes[$subj] . '\d';
                //$classSubjRegex .= "/";

                $classSubjRegex = mongoRegex($classSubjRegex);
            } else $classSubjRegex = null;

            if ($classSubjRegex) $query = array('_id' =>  $classSubjRegex);
            //$query['_id'] = $classSubjRegex;


            // DEBUG echo "query is "; print_r($query);

            if (isset($_REQUEST['pagesz']))  {
                $skip = (intval($_REQUEST['pageno']) - 1 ) * intval($_REQUEST['pagesz']);
                //if (isset($_REQUEST['pageno'])) $cursor->skip(($_REQUEST['pageno'] - 1 ) * $_REQUEST['pagesz']);
                $limit = intval($_REQUEST['pagesz']);
                //$cursor->limit($_REQUEST['pagesz']);
            }

            // debug $skip = null;$limit=null;
            //$cursor = mongoFind($chapters_collection, $query, "_id", $skip, $limit);
            $cursor = mongoFind($chapters_collection, $query, null, null, null);

            // DEBUG echo "cursor is "; print_r($cursor);

            //SORT the found items before sending to client-side
           //  // $cursor->sort(array('_id' => 1)); //NOTE: this is MONGO sort() method for mongo cursors [not a PHP sort]

                //NOTE: we use an older version of MONGO that doesnt support COLLATION order.
                //  this code should get all the cursor elements into a PHP array and do NATKSORT ( like looma-library.php does)

            $result = array();
           // if ($cursor->count() > 0) {
                foreach ($cursor as $d)  {

                    //echo $d['_id'];

                    $query =  array("prefix" => prefix( $d['_id']));
                    $textbook = mongoFindOne($textbooks_collection, $query);
                    //$d['fn'] = $lang === 'en' ? $textbook['fn'] : $textbook['nfn'];
                    $d['fn'] = $textbook['fn'];
                    $d['nfn'] = $textbook['nfn'];
                    $d['fp'] = $textbook['fp'];

                    // only send back chapters that are in "$lang" language ('en' or 'np')
                    if      ($lang === 'en' && isset($d['dn'])  && $d['dn'] !== '') $result[] = $d;
                    else if ($lang === 'np' && isset($d['ndn']) && $d['ndn'] !== '') $result[] = $d;
                    else if ($lang === 'both') $result[] = $d;
                }
           // }

            echo json_encode(array('count'=> sizeof ($result), 'list'=>$result));
            return;
    // end case "searchChapters"

    //////////////////////////////
    // - - - addChapterID - - - //
    //////////////////////////////
    case 'addChapterID':
        $query = array('_id' => mongoId($_REQUEST['id']));
        $update = array('$addToSet' => array('ch_id' => $_REQUEST['data']));

        $result = mongoUpdate($dbCollection, $query, $update);

        echo json_encode($result);
        return;
    // end case "addChapterID"


          ////////////////////////
          // - - - CHAPTER EXISTS - - - //
          ////////////////////////
          case "chapterExists": //find "_id" in the chapters collection and return its ID if it exists or NULL if doesnt exist

              $query = array('_id' => $_REQUEST['_id']);
              $projection = array("_id" => 1);
              $result = mongoFindOne($dbCollection, $query);
              if ($result) echo json_encode(array("_id" => $result["_id"]));
              else         echo json_encode(array("_id" => ""));
              return;
          // end case "chapterExists"



      ////////////////////////
      // -  removeChapterID  - //
      ////////////////////////
      case 'removeChapterID':
          $query = array('_id' => mongoId($_REQUEST['id']));
          $update = array('$pull' => array('ch_id' => $_REQUEST['data']));
          $result = mongoUpdate($dbCollection, $query, $update);

          echo json_encode($result);
          return;
      // end case "removeChapterID"

      ////////////////////////

    ////////////////////////
    // - - - editActivity - - - //
    ////////////////////////
    case 'editActivity':

        //print_r  ($_REQUEST['activities']);
        //$arr = explode(',', $_REQUEST['activities']);


        $arr = $_REQUEST['activities'];
        $dbs = $_REQUEST['db'];

        foreach ($arr as $index => $activity)
            if($activity) {

                if ($dbs[$index] === 'loomalocal') {
                    $dbCollection = $localcollections[$collection];
                } else {
                    $dbCollection = $collections[$collection];
                };

    //echo '$activity is: ' . $activity;

            $query = array('_id' => mongoId($activity));
            //print_r ($query);

            $changes = []; $unsets = [];
            if (isset($_REQUEST['dn'])  && $_REQUEST['dn'])  $changes['dn'] =  trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES));
            if (isset($_REQUEST['src']) && $_REQUEST['src']) $changes['src'] = $_REQUEST['src'];

            //set cl_lo and cl_hi if they are given (assumes lo > 0, hi <= 10, lo <= hi)
            if (isset($_REQUEST['cl_lo']) && $_REQUEST['cl_hi']) {
                $changes['cl_lo'] = $_REQUEST['cl_lo'];
                $changes['cl_hi'] = $_REQUEST['cl_hi'];
            }

            //set date and editor if they are given
                if (isset($_REQUEST['date']))   $changes['date'] =   $_REQUEST['date'];
                if (isset($_REQUEST['editor'])) $changes['editor'] = $_REQUEST['editor'];

            // if key1 is specified, then set key1 and either set or reset keys 2,3,4
            if (isset($_REQUEST['key1']) && $_REQUEST['key1']) {
                                                                   $changes['key1'] = $_REQUEST['key1'];
                if (isset($_REQUEST['key2']) && $_REQUEST['key2']) $changes['key2'] = $_REQUEST['key2']; else $unsets['key2'] = "";
                if (isset($_REQUEST['key3']) && $_REQUEST['key3']) $changes['key3'] = $_REQUEST['key3']; else $unsets['key3'] = "";
                if (isset($_REQUEST['key4']) && $_REQUEST['key4']) $changes['key4'] = $_REQUEST['key4']; else $unsets['key4'] = "";
            }
            //print_r ($changes);
            //print_r ($unsets);
            $update = [];
            if (count($changes) > 0) $update ['$set'] =   $changes;
            if (count($unsets)  > 0) $update ['$unset'] = $unsets;

                if (isset($_REQUEST['chapter']) && $_REQUEST['chapter'] && isset($_REQUEST['lang']) && $_REQUEST['lang']==='np')
                    $update['$addToSet'] = array('nch_id' => $_REQUEST['chapter']);
                else if (isset($_REQUEST['chapter']) && $_REQUEST['chapter'])
                    $update['$addToSet'] = array('ch_id' => $_REQUEST['chapter']);

                if (isset($_REQUEST['book-chapter']) && $_REQUEST['book-chapter']) $update['$addToSet'] = array('ch_id' => $_REQUEST['book-chapter']);
            //NOTE: bug in lines above
                // $addToSet FAILS if the field already contains a non-array string


            //print_r ($dbCollection);

            $result = mongoUpdate($dbCollection, $query, $update);

            echo json_encode($result);

        }  // end foreach()

        return;
    // end case "editActivity"

    ////////////////////////
    // -  uploadFile  - //
    ////////////////////////
    case 'uploadFile':

        // Check for an uploaded file:
       if (isset($_FILES['upload']) && isset($_FILES['upload-thumb'])) {

           $result = 'received ' . $_FILES['upload']['name'];

           // NOTE: we might add a hidden $_REQUEST parameter to be sure only looma code sends file uploads

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
                else { $result = 'ERROR: File upload failed'; }

                // insert ACTIVITY in mongoDB

              $insert = [];

              if (isset($_REQUEST['dn']))  $insert['dn'] =  trim(htmlspecialchars_decode($_REQUEST['dn'],ENT_QUOTES));
              if (isset($_REQUEST['src'])) $insert['src'] = $_REQUEST['src'];

              if (isset($_REQUEST['chapter'])) $insert['ch_id'] = '[' . $_REQUEST['chapter'] . ']';

              if (isset($_REQUEST['key1'])) $insert['key1'] = $_REQUEST['key1'];
              if (isset($_REQUEST['key2'])) $insert['key2'] = $_REQUEST['key2'];
              if (isset($_REQUEST['key3'])) $insert['key3'] = $_REQUEST['key3'];
              if (isset($_REQUEST['key4'])) $insert['key4'] = $_REQUEST['key4'];

              //print_r ($insert);

               $insert['fn'] = $_FILES['upload']['name'];
               $insert['fp'] = '../content/' . $year . '/' . $login. '/' ;
               $insert['ft'] = $_REQUEST['ft'];
               $insert['thumb'] = '../content/' . $year . '/' . $login. '/' . $_FILES['upload-thumb']['name'];
               $insert["date"] = gmdate("Y.m.d");  // using greenwich time
               $insert['uploaded'] = true; // mark uploaded files
               $insert["author"] = $_COOKIE['login'];     // set 'author' to currently logged-in user

               $temp = mongoInsert($activities_collection, $insert);  //$temp not used for now
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


          ////////////////////////
          // -  download  - //
          ////////////////////////
          case 'download':

              // Check for filename and filepath:
              if (isset($_GET['name']) ) $name = $_GET['name']; else $name = "";
              if (isset($_GET['path']) ) $path = $_GET['path']; else $path = "";

              //Check validity
                if (strpos( $path, "../content/") !== 0 || (!file_exists($path . $name)))
                     $file = 'images/fileNotFound.png';
                else $file = $path . $name;

                $info = getimagesize($file); // gets MIME type to use in 'Content-Type'
                $size = filesize($file);

      //echo 'MIME   ' . $info['mime'] . '    name ' . $name . '    path ' . $path . '    file ' . $file . '    size ' . $size; exit;

                header("Content-Type: {$info['mime']}\n");
                header("Content-Disposition : attachment; filename=\"$name\"\n");
                header("Content-Length: $size\n" );
                readfile($file);

                return;
          // end case "download"

          case "getGame":
            $id = mongoId($_REQUEST["gameId"]);

    // calls to this code should be replaced by openById(collection, id)

            $query = array('_id' => $id);
            //$cursor = mongoFind($dbCollection, $query, null, null, null);
            $game = mongoFindOne($dbCollection, $query, null, null, null);
           /*
            foreach ($cursor as $doc)
            {
                $game = $doc;
            }
           */
            echo json_encode($game);
            return;


          case "getHistory":  //catie cassani

      // calls to this code should be replaced by openById(collection, id)

              $id = mongoId($_REQUEST["id"]);

              $query = array('_id' => $id);
              //$cursor = mongoFind($dbCollection, $query, null, null, null);
              $history = mongoFindOne($dbCollection, $query, null, null, null);
             /*
              foreach ($cursor as $doc)
              {
                  $history = $doc;
              }
             */
              echo json_encode($history);
              return;

    ///////////////////////////////////////////
    ////////////////  sendmail  ///////////////
    ///////////////////////////////////////////
        case "sendmail":
            $msg = json_encode($_REQUEST['data']);

            //echo $msg;

            include_once 'includes/PHPMailer/Exception.php';
            include_once 'includes/PHPMailer/PHPMailer.php';
            include_once 'includes/PHPMailer/SMTP.php';

            // from https://github.com/PHPMailer/PHPMailer
            /*
             //Server settings
                    $mail->SMTPDebug = SMTP::DEBUG_SERVER;                      // Enable verbose debug output
                    $mail->isSMTP();                                            // Send using SMTP
                    $mail->Host       = 'smtp1.example.com';                    // Set the SMTP server to send through
                    $mail->SMTPAuth   = true;                                   // Enable SMTP authentication
                    $mail->Username   = 'user@example.com';                     // SMTP username
                    $mail->Password   = 'secret';                               // SMTP password
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         // Enable TLS encryption; `PHPMailer::ENCRYPTION_SMTPS` encouraged
                    $mail->Port       = 587;                                    // TCP port to connect to, use 465 for `PHPMailer::ENCRYPTION_SMTPS` above

                    //Recipients
                    $mail->setFrom('from@example.com', 'Mailer');
                    $mail->addAddress('joe@example.net', 'Joe User');     // Add a recipient
                    $mail->addAddress('ellen@example.com');               // Name is optional
                    $mail->addReplyTo('info@example.com', 'Information');
                    $mail->addCC('cc@example.com');
                    $mail->addBCC('bcc@example.com');

                    // Attachments
                    $mail->addAttachment('/var/tmp/file.tar.gz');         // Add attachments
                    $mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name

                    // Content
                    $mail->isHTML(true);                                  // Set email format to HTML
                    $mail->Subject = 'Here is the subject';
                    $mail->Body    = 'This is the HTML message body <b>in bold!</b>';
                    $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

                    $mail->send();
             */
            $mail = new PHPMailer\PHPMailer\PHPMailer();
            //$mail->IsSMTP();
            $mail->SMTPDebug = PHPMailer\PHPMailer\SMTP::DEBUG_SERVER;
            $mail->Host = 'smtp.gmail.com';  // sets GMAIL as the SMTP server
            $mail->Port = 587;
            //Set the encryption system to use - ssl (deprecated) or tls
            $mail->SMTPSecure = 'tls';
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;

            $mail->SMTPAuth = true;
            $mail->Username = 'looma.website@gmail.com';// GMAIL username
            $mail->Password = 'nMjtQkpDi2cGz6cVy2';// GMAIL password

            $mail->From = 'looma.website@gmail.com';
            $mail->FromName = 'Looma Content Request';
            //$mail->AddReplyTo('email to reply', 'name to reply');
            $mail->Subject = 'New content request';
            $mail->Body = $msg;
            //$mail->Body = "message here";
            $mail->IsHTML(false);
            $mail->AddAddress('skip@stritter.com', 'skip');

            if(!$mail->Send()){ echo 'Error: ' . $mail->ErrorInfo;}
            else{
                $mail->ClearAddresses();
                $mail->ClearAttachments();
                echo 'Mail sent';
            }

            return;

          ///////////////////////////////////////////
          // getLogData ('timeframe' in {hours, days, weeks, months},
          //             'chunk' = number of points to return,
          //             'prev' = #chunks to skip[from most recent skipping backwards, e.g. "0" means return the latest data points)
          ///////////////////////////////////////////
          case "getLogData":
              global $collections;
              if ($_REQUEST['type'] === 'pages' || $_REQUEST['type'] === 'filetypes') {
                  // get data for Bar Chart of usage of 'type' in {pages, filetypes}
                  $collection = $collections[$_REQUEST['type']];
                  $logdata = mongoFind($collection, array(), 'hits', null, null);

                  $data = [];
                  foreach ($logdata as $datum) $data[] = $datum;

                  $result['data']  = $data;
                  echo json_encode($result);
                  return;
              } else {    // get data for Line Chart of activity in 'type' in {hours, days, weeks, months}
                  $chunk = (integer) $_REQUEST['chunk']; // how many results to return
                  $prev =  (integer) $_REQUEST['prev'];  // how many batches of 'chunk' results to go back in time
                  $timeframe =       $_REQUEST['type'];
                  $timeframes = ['hours', 'days', 'weeks', 'months'];
                  if ( ! in_array($timeframe,$timeframes)) $timeframe = 'hours';  //default to hours
                  $collection = $collections[$timeframe];

                  $logdata = mongoFind($collection, array(), 'utc', null, null);

                  $datatemp = [];

                  $datatemp = iterator_to_array($logdata);

                 // foreach ($logdata as $datum) $datatemp[] = $datum;
                //  for ($i=0;$i<count( (array) $logdata);$i++)  $datatemp[$i] = $logdata[$i];
                        //this code gets all the entries (all the way back in time)
                        //   then fills in missing time periods with visits=0,uniques=0 ("fillLogData()")
                        //   then truncates to the chunk/prev requestes
                        //   there may be a more efficient way to do this
                  if (count($datatemp) > 0) $data = fillLogData($datatemp, $timeframe);
                  else $data = [];

           //       if (count($data) > $chunk*($prev+1)) $data = array_slice($data,-1*($chunk*($prev + 1)), $chunk);
           //       else if (count($data) > $chunk) $data = array_slice($data, -1*$chunk);

          $length = count($data);

          $result['first'] = false; $result['last']  = false;

                   if ($chunk >= $length) {
                        $result['first']=true;
                        $result['last']=true;
                   } else if ($prev === 0) {
                        $data = array_slice($data, -1 * $chunk, $chunk);
                        $result['last']  =  true;
                   } else if ($length < $chunk*($prev+1)) {
                        $data = array_slice($data,0,$length-1*($chunk*($prev)));
                        $result['first'] = true;
                   } else {
                        $data = array_slice($data,-1*($chunk*($prev + 1)), $chunk);
                   }

                  $result['data']  = $data;

                  echo json_encode($result);
                  return;
            };


          ///////////////////////////////////////////
          // getLogLocations ('timeframe' in {hours, days, weeks, months},
          //             'chunk' = number of points to return,
          //             'prev' = #chunks to skip[from most recent skipping backwards, e.g. "0" means return the latest data points)
          ///////////////////////////////////////////
          case "getLogLocations":
              global $collections;
              //$query =array('country'=>'NP');

              //$query = array('$or' => array( 'country' => 'NP', 'country' => 'Nepal'));
              $query = [
                  '$or' => [
                      ['country' => 'NP'],
                      ['country' => 'Nepal']]];

              $collection = $collections['users'];
              $logdata = mongoFind($collection, $query, null, null, null);

              $data = [];
              foreach ($logdata as $datum) $data[] = $datum;

              $result = $data;
              echo json_encode($result);
              return;  // end case getLogLocations

          ///////////////////////////////////////////
      // nothing  (null command for debugging) //
      ///////////////////////////////////////////
          case "nothing":
              echo json_encode(array("received 'nothing' command"));
              return;
          // end case "nothing"

      } //end switch "cmd"
}

else return; //no CMD given
?>

