<?php

/**
 *	Author: Colton Conley and Nikhil Singhal
 *  Date: 7/28/16
 *	Filename: looma-dictionary-autogen-utilities.php
 *
 *	Description:
 *	This file contains the functions necessary to interact with the looma
 *	database and staging database to retrieve and store dictionary entries.
 *	It also interacts with the various apis necessary to retrieve translations
 *	and definitions to create new entries.  The main functions intended for use
 *	by other files are as follows:
 *
 *	createEntry - this function creates a new entry in the staging database given
 *	a word.
 *
 *	readStagingDatabase - this function returns a page of results in the staging
 *	database, as specified by the arguments passed to it
 *
 * 	Find Definition with ID - this function takes an ID and looks for a matching
 *	entry first in the staging database, then in the looma database, and returns
 *	false if it finds nothing.
 *
 * 	findDefinitonsForSingleWordLooma - this function finds all the definitions
 * 	for a given word in the Looma database, returning an array with all the
 * 	entries found
 *
 * 	publish - this function publishes all the accepted changes to the looma
 *  database
 *
 *	updateStaging - this function saves a document to the staging database.  If
 * 	the document already exists, then it is overwritten by the new doc
 *
 * 	There are also functions to create connections to each database, and a
 * 	function to check login
 *
 */

set_time_limit(300); // prevent timeout due to a large file. 5 minutes of direct php ops

date_default_timezone_set('UTC');

//contains the methods to access google translate
require 'looma-dictionary-autogen-translator.php';

//edit this value to determine how many words will be assigned to each page
$wordsPerPage = 7;

//    *************************************    //
//    *******  DATABASE CONNECTIONS *******    //
//    *************************************    //
// set up MONGO DATABASE(s) CONNECTIONS
//     this code uses 3 database collections:
//          $loomaConnection is the "dictionary" collection in db="looma"  - the main Looma Dictionary
//          $stagingCollection is the "staging" collection in db="staging" - the temporary DB for staging words being edited
//          $appCollecton is the "app" collection in db="staging"          - stores data used by this app, specifically the "progress" infor

//FOR LOCALHOST usage:

$loomaAddress =      'localhost';       //Change to reflect Looma computer host name
$loomaDB =           'looma';          //Change to reflect Looma database name
$loomaCollection =   'dictionary';     //change to reflect the collection within the looma database

$stagingAddress =    'localhost';       //Change to reflect staging computer host name
$stagingDB =         'staging';        //Change to reflect staging database name
$stagingCollection = 'staging';        //change to reflect the collection within the staging database

// NOTE: the "app" database is a temp db used to store the progress of a PDF upload, then deleted (can be on localhost)
$appAddress =        'localhost';      //Change to reflect app computer host name
$appDB =             'staging';        //change to reflect app database name
$appCollection =     'app';            //change to reflect the collection within the app database

//    *************************************    //
//    *************************************    //

/**
 *	Dummy function to always return true
 */
function checkLogin ($login){
    return true;
}

/**
 *Returns a connection to the staging database.  the address still needs to be specified
 */
function createConnectionToStaging($login){
    if(checkLogin($login))
    {
        global $stagingAddress;
        //default is localhost, insert parameters to specify address of database
        return new MongoClient($stagingAddress);
    }
    return null;
}

/**
 * returns true when either a string 'true' or a boolean true is entered
 */
function checkTrue ($bool){
    if ($bool === true or $bool == 'true'){
        return true;
    }
    else {
        return false;
    }
}

/**
 *Returns a connection to the looma database.  the address still needs to be specified
 */
function createConnectionToLooma($login){
    if(checkLogin($login))
    {
        global $loomaAddress;

        return new MongoClient($loomaAddress);
    }
    return null;
}

/**
 *Returns a connection to the app database.  the address still needs to be specified
 */
function createConnectionToApp($login){
    if(checkLogin($login))
    {
        global $appAddress;

        return new MongoClient($appAddress);
    }
    return null;
}




/**
 * Creates an uploadProgressSession by storing the length and current position (0) in the
 * 'app' collection of the database.
 * @param integer $length The length to store
 * @param unknown $appConnection The connection to the app database
 * @param unknown $user The user who owns the session
 */
function createUploadProgressSession($length, $appConnection, $user) {
    global $appDB;
    global $appCollection;
    $session = array("position" => 0, "length" => $length, "user" => $user);
    $collection = $appConnection->selectDB($appDB)->selectCollection($appCollection);
    $collection->remove(array("user" => $user));
    $collection->insert($session);
}


/**
 * Updates the current position of the progress session
 * @param unknown $position The new position
 * @param unknown $appConnection The connection to the app database
 * @param unknown $user The user
 */
function updateUploadProgressSession($position, $appConnection, $user) {
    global $appDB;
    global$appCollection;
    $search = array("user" => $user);
    $change = array('$set' => array("position" => $position));

    $appConnection->selectDB($appDB)->selectCollection($appCollection)->update($search, $change);
}


/**
 * Gets the progress of the upload from the session database entry referenced by the user
 * @param unknown $appConnection The connection to the app database
 * @param unknown $user The user
 * @return session object in the form: {"position": (int), "length": (int)}
 * or null if it didn't exist
 */
function getUploadProgress($appConnection, $user) {
    global $appDB;
    global $appCollection;
    $query = array("user" => $user);
    return $appConnection->selectDB($appDB)->selectCollection($appCollection)->findOne($query);
}


/**
 * Closes the upload session referenced by the user by removing it from the database
 * @param unknown $appConnection The connection to the app database
 * @param unknown $user The user
 */
function closeUploadProgress($appConnection, $user) {
    global $appDB;
    global $appCollection;
    $query = array("user" => $user);
    $appConnection->selectDB($appDB)->selectCollection($appCollection)->remove($query);
}


/**
 * Looks up the word in the pearson longman's wordwise dictionary and returns it formatted
 * @param unknown $word The word to look up
 * @return a list of objects with the following properties: def, rw, pos
 */
function lookUpWord($word) {
    $url = "http://api.pearson.com/v2/dictionaries/wordwise/entries?limit=100&headword=" . rawurlencode($word);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    $response = curl_exec($ch);
    curl_close($ch);
    $obj = json_decode($response, true); //true converts stdClass to associative array.
    $messyList = $obj['results'];
    if($messyList == null) {
        error_log("messy list null for word: $word");
        $messyList = array();
    }
    $ans = array();
    foreach($messyList as $messy) {
        if(strpos($messy["headword"], " ") === false && strpos($messy["headword"], "-") === false) { // no phrase definitions, only word. Allows for unconjugated form
            $senses = isset($messy["senses"]) ? $messy["senses"] : array();
            foreach($senses as $sense) {
                $def = array();
                $hw = strtolower($messy["headword"]);

                $def["word"] = $word;
                $def['def'] = isset($sense['definition']) ? $sense['definition'] : "";
                $def['pos'] = ($messy["part_of_speech"] != null) ? $messy["part_of_speech"] : "";
                $def['rw'] = '';

                if($hw == $word) {
                    $ans[] = $def;
                } else {
                    // has a separate root word. Definition and pos are now inaccurate and
                    // should be user-defined relative to rw definition.
                    $new = array();
                    $new["word"] = $word;
                    $new['def'] = "<TODO>" . $def['def'];
                    $new['pos'] = "<TODO>" . $def['pos'];
                    $new['rw'] = $hw;
                    $ans[] = $new;
                    // also add the root word, in case it hasn't already been defined
                    // deal with duplicates later
                    $def = array();
                    $def["word"] = $hw;
                    $def["def"] = isset($sense['definition']) ? $sense['definition'] : "";
                    $def['pos'] = ($messy["part_of_speech"] != null) ? $messy["part_of_speech"] : "";
                    $def['rw'] = true; // signal that this is a root word
                    $ans[] = $def;
                }
            }
        }
    }
    return $ans;
}


//this method should be replaced depending on the format and type of data being entered
/**
 * Creates definitions for the given word and adds them all to the staging dictionary
 * @param unknown $word the word to create entries for
 * @param unknown $officialConnection The official database connection
 * @param unknown $stagingConnection the staging database connection
 * @param unknown $user the user
 * @return int: -1 for completely skipped, 0 for already existed, so doesn't count as skipped,
 * 1 if a definition was skipped, 2 for at least one entry contained empty required fields,
 * 3 for complete success. The earlier statuses are returned with higher priority.
 */
function createEntry($word, $officialConnection, $stagingConnection, $user) {
    if(checkForSimilarDefinition($word["word"], $stagingConnection, $officialConnection)) {
        return 0; // doesn't count as skipped since it existed
    }


    $dictionaryData = lookUpWord($word["word"]);

    $status = 3;
    $oneGood = false;

    foreach($dictionaryData as $definition) {

        $result = createIndividualDefinition($word, $definition, $officialConnection, $stagingConnection, $user);
        $oneGood |= $result > 0;
        if($result == -1 and $status > 1) {
            $status = 1;
        } else if($result == 1 and $status > 2) {
            $status = 2;
        }
    }
    return $oneGood ? $status : -1;
}

/**
 * Creates a definition (one document in the database) and adds it to the staging database
 * @param unknown $word the word to define
 * @param unknown $definition The definition object to be put into the database
 * @param unknown $officialConnection The connection to the official database
 * @param unknown $stagingConnection The connection to the staging database
 * @param unknown $user the user responsible
 * @return int: -1 for skipped, 0 if added but shouldn't count toward success of total word,
 * 1 for added but required fields left empty, 2 for complete success.
 */
function createIndividualDefinition($word, $definition, $officialConnection, $stagingConnection, $user) {

    if($definition["rw"] === true and checkForDuplicateDefinition($definition, $stagingConnection, $officialConnection)) {
        // root word definition added only in case it wasn't there, so skip, but don't count as skip
        return 0;
    }

    $success = true;

    //get definition(find api)
    $def = $definition['def'];
    if($def == "") {
        $success = false; // skipped, but still add the word
    }

    //get translation
    $np = translateToNepali($definition["word"]);
    if($np == null) {
        $np = "";
        $success = false; // skipped, but still add the word
    }

    //get the rw (hopefully this will be included in the dictionary api)
    $rw = $definition['rw'];
    if($rw === true) {
        $rw = ''; // it is a rw definition, so it is its own root word
    }

    //get the POS
    $POS = $definition['pos'];

    //get the date and time
    $dateCreated = gmdate("Y.m.d");  // using greenwich time

    //generate random number
    $random = generateRandomNumber(16);

    //put everything into a doc
    $doc = array( "wordData" => array(
        "en" => $definition["word"],
        "ch_id" => $word["ch_id"],
        "rw" => $rw,
        "np" => $np,
        "part" => $POS,
        "def" => $def,
        "plural" => $plural,
        "rand" => $random,
        "date_entered" => $dateCreated,
        "mod" => $user),
        "stagingData" => array(
            'added' => true, 'modified' => false, 'accepted' => false,
            'deleted' => false
        )
    );

    global $stagingDB;
    global $stagingCollection;
    // insert the doc into the database
    $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->save(moveWordDataUpLevel($doc));

    if($rw === true) {
        return 0;
    } else if($success) {
        return 2;
    } else {
        return 1;
    }
}

/**
 *	Generates a random number given a certain number of digits
 */
function generateRandomNumber ($numDigits){
    $multiplier = 10 * $numDigits;
    $random = rand(0, $multiplier) / $multiplier;

    return $random;
}


//change database and connection names depending on database being used
/**
 *   finds a definition with the specified object id.  If it is stagin, it
 *	returns that one.  If not, it looks for it in the looma database.  If no
 *	such object exists, it returns false.  Takes the object id as a string,
 *	a connection to the looma database, and a connection to the staging database
 */
function findDefinitionWithID ($_id, $loomaConnection, $stagingConnection) {
    global $stagingDB;
    global $stagingCollection;
    global $loomaDB;
    global $loomaCollection;
    //first look for the entry in the staging databse
    $stagingDefinition = $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->findOne(array('_id' => new MongoId($_id['$id'])));

    if ($stagingDefinition != null){
        return compileSingleSimpleWord($stagingDefinition);
    }

    //since the entry wasn't in the staging database, check the Looma database
    //fix database and collection names
    /*  ##############  */
    $loomaDefinition = $loomaConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->findOne(array('_id' => new MongoId($_id['$id'])));

    if ($loomaDefinition != null){
        return compileSingleLoomaWord($loomaDefinition);
    }

    //this means an object with the specified id could not be found.
    return false;

}





//edit this to make sure the array contains all the necessary info
/**
 *	Creates an array of entries to be displayed on a single page of the website
 *
 *	takes an array of arguments specifying the page number and search query
 *  Also takes a connection to the staging database
 *
 *	returns an array of all the words for that page
 */
function readStagingDatabaseOLD ($args, $stagingConnection){
    global $wordsPerPage;
    global $stagingDB;
    global $stagingCollection;

    //get all elements that match the criteria
    $collection = $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection);

    $wordsArray = $collection->distinct("en", stagingCriteriaToMongoQuery($args));

    //use find().skip().limit() instead of distinct?
    //$wordsArray = $collection->find("en", stagingCriteriaToMongoQuery($args));

    sort($wordsArray);
    //figure out how many total pages
    $numTotalWords = count($wordsArray);
    $numPages = intval(($numTotalWords + $wordsPerPage - 1) / $wordsPerPage);

    if($numPages < 1){
        $numPages = 1;
    }

    $page = intval($args['page']);
    if($page < 1) {
        $page = 1;
    } elseif ($page > $numPages) {
        $page = $numPages;
    }

    $wordsArray = array_slice($wordsArray, ($page - 1) * $wordsPerPage, $wordsPerPage);

    $stagingCursor = $collection->find(array("en" => array('$in' => $wordsArray)));

    // put the words in an array. This time these are word objects. Should not be
    // limited by wordsPerPage, since that has already been taken into account
    $wordsArray = compileStagingWordsArray($stagingCursor);
    //create array with appropriate metadata in the beginning
    $finalArray = array( "page"=> $page, "maxPage" => $numPages, "words" => $wordsArray);

    return $finalArray;
}

function readStagingDatabase ($args, $stagingConnection){
    global $wordsPerPage;
    global $stagingDB;
    global $stagingCollection;

    //get all elements that match the criteria
    $collection = $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection);

    //$wordsArray = $collection->distinct("en", stagingCriteriaToMongoQuery($args));

    //use find().skip().limit() instead of distinct?
    //$wordsArray = $collection->find("en", stagingCriteriaToMongoQuery($args));

    //sort($wordsArray);
    //figure out how many total pages
    $numTotalWords = $stagingCursor = $collection->count(stagingCriteriaToMongoQuery($args));
    $numPages = intval(($numTotalWords + $wordsPerPage - 1) / $wordsPerPage);

    if($numPages < 1){
        $numPages = 1;
    }

    $page = intval($args['page']);
    if($page < 1) {
        $page = 1;
    } elseif ($page > $numPages) {
        $page = $numPages;
    }

    //$options = array ("skip" => ($page - 1) * $wordsPerPage, "limit" => $wordsPerPage);

    //$wordsArray = array_slice($wordsArray, ($page - 1) * $wordsPerPage, $wordsPerPage);
    $stagingCursor = $collection->find(stagingCriteriaToMongoQuery($args))->sort(array('en'=> 1))->skip(($page - 1) * $wordsPerPage)->limit($wordsPerPage);

    // put the words in an array. This time these are word objects. Should not be
    // limited by wordsPerPage, since that has already been taken into account
    $wordsArray = compileStagingWordsArray($stagingCursor);
    //create array with appropriate metadata in the beginning
    $finalArray = array( "page"=> $page, "maxPage" => $numPages, "words" => $wordsArray);

    return $finalArray;
}

/**
 *
 */
function getDefinitionsFromStaging ($args, $connection) {
    global $stagingDB;
    global $stagingCollection;

    //get all elements that match the criteria
    $stagingCursor = $connection->selectDB($stagingDB)->selectCollection($stagingCollection)->find(stagingCriteriaToMongoQuery($args));

    //put the words in an array
    //remember to add in staging parameters
    $stagingWordsArray = compileStagingWordsArray($stagingCursor);

    return $stagingWordsArray;
}

/**
 *	Searches the Looma database and finds all the definitions it contains for
 *	a single word but removes all duplicates already in the staging database
 *
 *	Takes the desired word and a connection to the Looma database
 *
 *  Also takes $overwritten, which, if true, specifies that overwritten entries should be shown
 *
 *	Returns an array with all the definitions found
 */
function findDefinitonsForSingleWordLooma ($word, $loomaConnection, $stagingConnection, $overwritten) {
    global $loomaDB;
    global $loomaCollection;
    //get all elements that match the criteria
    //FIX COLLECTION AND DATABASE NAMES
    /*  ##############  */
    //$loomaCursor = $loomaConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->find(array('en' => $word));

    //$loomaCursor = $loomaConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->find((object) ['$or' => array('en' => $word, 'plural' => $word) ]);

    $regex = array('$regex' => new MongoRegex("/" . $word . "/is"));

    $loomaCursor = $loomaConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->find(
        [ '$or' => [
            [ 'en' => $regex ],
            [ 'plural' => $regex ]
        ]
        ] );

    //put the words in an array
    $loomaWordsArray = compileLoomaWordsArray($loomaCursor);


    if(checkTrue($overwritten)) {
        $loomaArray = $loomaWordsArray;
    } else {
        //find all entries in the staging database
        $stagingArray = getDefinitionsFromStaging(array("text" => $word), $stagingConnection);

        //remove overwritten definitions
        $loomaArray = removeOverwrittenEntries($loomaWordsArray, $stagingArray);
    }


    //make sure indecies are consecutive
    return $loomaArray;
}

/**
 *	Removes all entries in one array that appear in the other
 *	@param array $betaArray an array in staging database format to be overwritten
 *	@param array $dominantArray an array in staging database format
 *
 *	Returns the betaArray without the overwritten entries
 */
function removeOverwrittenEntries ($betaArray, $dominantArray){
    //nested for each loop, compare object ids and overwrite entires in the beta array
    $betaCount = count($betaArray);
    $dominantCount = count($dominantArray);
    for($indexDominant = 0; $indexDominant < $dominantCount; $indexDominant++) {
        for ($indexBeta=0; $indexBeta < $betaCount; $indexBeta++) {

            //make sure the key for object id is correct
            if (isset($dominantArray[$indexDominant]['wordData'])  &&
                isset($dominantArray[$indexDominant]['wordData']['_id']) &&
                isset($betaArray[$indexBeta]['wordData'])  &&
                isset($betaArray[$indexBeta]['wordData']['_id']))
            {
                if ($betaArray[$indexBeta]['wordData']['_id']->{'$id'} == $dominantArray[$indexDominant]['wordData']['_id']->{'$id'}) {
                    unset($betaArray[$indexBeta]);
                }
            }
        }
    }
    return array_merge($betaArray);
}


/**
 * Creates a query array representing the advanced search options given in the string
 * @param unknown $text The string of advanced search options
 */
function createAdvancedTextQuery($text) {
    $ans = createAdvancedAndOrQuery($text, false);
    return $ans;
}

/**
 * Creates a query assuming that the next lowest priority operator to parse is & or |
 * @param unknown $text The text to parse
 * @param unknown $and True if & is the next lowest priority, false if | is
 * @return unknown[] a mongodb style query
 */
function createAdvancedAndOrQuery($text, $and) {
    $list = explode($and ? "&" : "|", $text);
    foreach($list as $index => $val) {
        if($and) {
            $list[$index] = createAdvancedBaseQuery($val);
        } else {
            $list[$index] = createAdvancedAndOrQuery($val, true);
        }
    }
    return array(($and ? '$and' : '$or') => $list);
}

/**
 * Creates a query assuming that the next lowest priority operator to parse is key:value
 * @param unknown $text The text to parse
 * @return unknown[] a mongodb style query
 */
function createAdvancedBaseQuery($text) {
    $new = explode(":", $text);
    if(count($new) != 2) {
        error_log("incorrect syntax in search: extra colon and value. Ignoring extras");
        return array('en' => 1 );
    }
    return array(trim($new[0]) => array('$regex' => new MongoRegex("/" . trim($new[1]) . "/is")));
}

/**
 * Creates a MongoDB query that can be used to search for the given arguments. Should be
 * replaced if the front end sends different arguments than for the Dictionary Editor
 * @param unknown $args The arguments to parse. expects the following fields:
 * text: (string)
 * added: (boolean or null)
 * modified: (boolean or null)
 * accepted: (boolean or null) (when true, should search for accepted OR deleted, since both are
 * publishable)
 */
function stagingCriteriaToMongoQuery($args)
{
    if (strpos($args["text"], ":") === false) {// regular search
        if ( !$args["text"] || $args["text"] == "") //$condition = array();
              $condition = array("en" => array('$regex' => new MongoRegex("/.*/")));
        else  $condition = array("en" => array('$regex' => new MongoRegex("/" . $args["text"] . "/is")));
    } else {
        // advanced search
        $condition = createAdvancedTextQuery($args["text"]);
    }
/*
    $added =    isset($args['added'])    ? checkTrue($args['added']) :    false;
    $modified = isset($args['modified']) ? checkTrue($args['modified']) : false;
    $accepted = isset($args['accepted']) ? checkTrue($args['accepted']) : false;
    $deleted =  isset($args['deleted'])  ? checkTrue($args['deleted']) :  false;

    if ($added || $modified || $accepted || $deleted) {
        $tags = array();
        $tags[] = array("stagingData.deleted" => $deleted);
        if ($added) {
            $tags[] = array("stagingData.added" => true);
        }
        if ($modified) {
            $tags[] = array("stagingData.modified" => true);
        }
        if ($accepted) {
            $tags[] = array("stagingData.accepted" => true);
        }
    }*/

    if (checkTrue($args['deleted']) ||
        checkTrue($args['added']) ||
        checkTrue($args['modified']) ||
        checkTrue($args['accepted']))
    {

      // echo "deleted is: " . $args['deleted'] . "\r\n";
       // echo "added is: " . $args['added'] . "\r\n";
       // echo "modified is: " . $args['modified'] . "\r\n";
       // echo "accepted is: " . $args['accepted'] . "\r\n";

       /* if (isset($args['deleted']) && $args['deleted'] === 'true')
             $del = array("stagingData.deleted" => true);
        else $del = array("stagingData.deleted" => false);
       */

        $del = array("stagingData.deleted" => checkTrue($args['deleted'])?true:false);

        $tags = array();

        if (checkTrue($args['accepted'])) $tags[] = array("stagingData.accepted" => true);
        if (checkTrue($args['modified'])) $tags[] = array("stagingData.modified" => true);
        if (checkTrue($args['added'])) $tags[] = array("stagingData.added" => true);
        // if (checkTrue($args['modified'])) $tags["stagingData.modified"] = true;
        //if (checkTrue($args['added']))    $tags[] = array("stagingData.added"    => true);
//        if (isset($args['modified']) && $args['modified'] === 'true') $tags = array("stagingData.modified" => true);
//        if (isset($args['added']) && $args['added'] === 'true') $tags = array("stagingData.added" => true);

        if ($tags == array()) $filter = $del;
        else {
            if (checkTrue($args['deleted'])) {
                $tags[] = ["stagingData.deleted" => true];
                $filter = ['$or'  => $tags];
            }
            else
                $filter = ['$and' => [$del, ['$or'  => $tags]]];
                // $filter = array('$and' => array($del, array('$or'  => $tags)));
        }

        $result = ['$and' => [$condition, $filter]];
    }
    else $result = $condition;

    //print_r($result);

    return $result;
}


/**
 *  creates an array with all the words and their data for
 *  entry in the final array of data for simplified view
 *  takes a cursor to elements in the staging database
 *	returns the array of all the words and their data
 */
function compileStagingWordsArray ($stagingCursor){
    $wordsArray = array();
    while($stagingCursor->hasNext()){
        array_push ($wordsArray, compileSingleSimpleWord($stagingCursor->getNext()));
    }

    return $wordsArray;
}


/**
 *  creates an array with all the words and their data for
 *  entry in the final array of data for simplified view
 *  takes a cursor to elements in the staging database
 *	returns the array of all the words snd their data
 */
function compileLoomaWordsArray ($loomaCursor){
    $wordsArray = array();
    for ($i = 0; $i < $loomaCursor->count(); $i = $i + 1){
        if($loomaCursor->hasNext())
            array_push ($wordsArray, compileSingleLoomaWord($loomaCursor->getNext()));
    }

    return $wordsArray;
}

/**
 *  compiles all the data necessary for a single word in simplified view in preparation for entry in the word array
 *  takes all the word's data (from the database)
 *  returns the array for that word
 */
function compileSingleSimpleWord($allWordData){
    $singleWord = array('wordData' => compileSimpleWordData($allWordData), 'stagingData' => $allWordData['stagingData']);

    return $singleWord;
}

/**
 *  compiles all the data necessary for a single word in simplified view in *preparation for entry in the word array
 *  takes all the word's data (from the database)
 *  returns the array for that word
 */
function compileSingleLoomaWord($allWordData){
    $singleWord = array('wordData' => compileSimpleWordData($allWordData), 'stagingData' => generateBlankStagingData());

    return $singleWord;
}

//make sure all the necessary fields are included
/**
 *  creates an array with all the word data required for the simplified view
 *  takes an array with all the data needed
 *  returns the completed array
 */
function compileSimpleWordData ($allWordData){

    //NOTE: this code could be: unset($allWordData['stagingData']; return $allWordData;

    return array(
        '_id' =>   isset($allWordData['_id']) ?    $allWordData['_id'] : null,
        'ch_id' => isset($allWordData['ch_id']) ?  $allWordData['ch_id'] : null,
        'plural'=> isset($allWordData['plural']) ? $allWordData['plural'] : null,
        'en' =>    isset($allWordData['en']) ?     $allWordData['en'] : null,
        'rw' =>    isset($allWordData['rw']) ?     $allWordData['rw'] : null,
        'part' =>  isset($allWordData['part']) ?   $allWordData['part'] : null,
        'np' =>    isset($allWordData['np']) ?     $allWordData['np'] : null,
        'def' =>   isset($allWordData['def']) ?    $allWordData['def'] : null,
        'rand' =>  isset($allWordData['rand']) ?   $allWordData['rand'] : null,
        'mod' =>   isset($allWordData['mod']) ?    $allWordData['mod'] : null,
        'date_entered' => isset($allWordData['date_entered']) ? $allWordData['date_entered'] : null
    );
}


/**
 *  takes a cursor for the staging database, the search arguments, the max
 *  number of pages, and the total number of words the cursor can iterate through
 *
 *  skips the cursor over the appropriate number of entries.
 */
function skipToAppropriateLocation ($stagingCursor, $args, $numPages, $numTotalWords){
    global $wordsPerPage;
    global $stagingDB;
    global $stagingCollection;

    if($numPages <= 1){
        //do nothing
        return $args['page'];
    }
    else if ($args['page'] <= $numPages){
        $amount = ($args['page'] - 1 ) * $wordsPerPage;
        $stagingCursor->skip($amount);
        return $args['page'];
    }
    //this means it is above the max
    else{
        $stagingCursor->skip(($numPages - 1) * $wordsPerPage);
        return $numPages;
    }
}


/**
 * Moves an entry from the looma database to the staging database
 * Takes a connection to each database, as well of the id of the object to be
 * moved and the user requesting to move the object
 * Returns true
 */
function moveEntryToStaging ($stagingConnection, $loomaConnection, $_id, $user){
    global $stagingDB;
    global $stagingCollection;
    global $loomaDB;
    global $loomaCollection;
    /*  ##############  */
    $doc = $loomaConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->findOne(array('_id' => new MongoId($_id['$id'])));

    $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->save(moveWordDataUpLevel(compileSingleLoomaWord($doc)));

    //Do NOT remove the entry, since it will be replaced upon publishing. this way,
    // if the user reverts the change, the old version will still exist
    //$loomaConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->remove($doc);

    return true;
}



//transfer the data from the staging database to the Looma database
/**
 * transefers all the accepted changes from the staging database to the looma database
 * also removes all deleted items from the staging database
 * takes a connection to the staging database and a connection to the looma database
 * returns true
 */
function publish($stagingConnection, $loomaConnection, $user) {

    global $stagingDB;
    global $stagingCollection;
    global $loomaDB;
    global $loomaCollection;

    // (minor) bug in original code:
    // $stagingCursor = $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->find(stagingCriteriaToMongoQuery(array("text" => "", "added" => false, "modified" => false, "accepted" => true, "deleted" => true)));
    // should be:
    $stagingCursor = $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->find(
        ['$or' => [ [ "accepted" => true ], [ "deleted" => true ] ] ] );


    foreach($stagingCursor as $doc){
        if (checkTrue($doc['stagingData']['deleted']))
        {
            //remove from staging
            $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->remove($doc);

            // remove from official
            // NOTE: following code line removed July 2018 by Skip.
            // for now, lets not remove words that are "deleted" in staging from the permanent dictionary
            //
            //$loomaConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->remove(array("_id" => $doc["_id"]));
        }
        else if(checkTrue($doc['stagingData']['accepted']))
        {
            //convert to correct format
            $newDoc = convertFromStagingToLooma(compileSingleSimpleWord($doc), $user);

            //remove from staging
            $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->remove($doc);

            //adjust database and collection name!!!
            $loomaConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->save($newDoc);

        }
    }

    return true;
}


//edit this function if you would like to adapt this function for something other than dictionary words
/**
 *converts a doc from the staging version to the version entered into the looma database
 *takes the doc in staging database form
 *returns that doc with the information required for entry into the Looma database
 */
function convertFromStagingToLooma($doc, $user)
{
    $dateEntered = getDateAndTime();

    $doc = $doc['wordData'];

    return array (
        '_id' => $doc['_id'],
        "ch_id" => $doc['ch_id'],
        //'primary' => $doc['primary'],
        'plural' => $doc['plural'],

        "en" => $doc["en"],
        "rw" => $doc["rw"],
        "np" => $doc["np"],
        "part" => $doc["part"],
        "def" => $doc["def"],
        "rand" => $doc["rand"],
        //     "mod" => $user,   // removed july 2018 [skip] we do not record author in permanent dictionary
        "date_entered" => $dateEntered
    );
}

/**
 *Takes the new document to be incorporated into the staging
 *database, a connection to that database, and a string with the user modifying
 *the entry
 *
 *Returns true if successful
 */
function updateStaging($new, $connection, $user, $modified, $deleteToggle)
{
    global $stagingDB;
    global $stagingCollection;
    $collection = $connection->selectDB($stagingDB)->selectCollection($stagingCollection);

    //update user and modified status
    $new['wordData']['mod'] = $user;
    $new['wordData']['date_entered'] = getDateAndTime();

    if ($deleteToggle) {
        $new['stagingData']['deleted'] = ! $new['stagingData']['deleted'];

    } else if($modified) {  //some field of the entry is being modified
        $new['stagingData']['modified'] = true;
        $new['stagingData']['accepted'] = false;
        $new['stagingData']['added']    = false;  //added by Skip

    } else {         // status button was clicked, but no fields are being changed
        if ($new['stagingData']['modified']) {
            $new['stagingData']['modified'] = false;
            $new['stagingData']['accepted'] = true;
            $new['stagingData']['added'] = false;

        } else {
            $new['stagingData']['modified'] = true;
            $new['stagingData']['accepted'] = false;
            $new['stagingData']['added'] = false;
        }

    }


    //save it to the collection
    $collection->save(moveWordDataUpLevel($new));

    return true;
}


/**
 * Takes the timezone to be used in the generation of the timestamp
 * returns a string with the date and time in the specified format
 */
function getDateAndTime() {
    // now using GMT timezone - set at top of this file
    //date_default_timezone_set($timezone);
    return $dateEntered = gmdate("Y.m.d");  // using greenwich time
}



/**
 *	Converts a document from the looma databse into the format used in the staging databse
 *
 *	Returns an array with wordata and stagingData
 */
function convertFromLoomaToStaging ($doc){
    $finalArray = array('wordData' => $doc, 'stagingData' => generateBlankStagingData());

    return $finalArray;
}

/**
 *	Generates an array with staging data where all fields are false
 *	Returns the array of staging data
 */
function generateBlankStagingData () {
    return array(
        'added' => false, 'modified' => false, 'accepted' => false,
        'deleted' => false
    );
}

/**
 *	Removes an object with a certain id from the staging database
 *	@param string $id the id of the object to be removed
 *	@param mongodb connection $stagingConnection a connection with
 */
function removeStaging ($_id, $stagingConnection) {
    global $stagingDB;
    global $stagingCollection;
    //remove object with id
    $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->remove(array("_id" => new MongoId($_id['$id'])));
}

/**
 * Checks if the word has already been defined and therefore the new definition should be
 * canceled
 * @param unknown $word The word to check
 * @return boolean True if the entry exists, false if it doesn't
 */
function checkForSimilarDefinition ($word, $stagingConnection, $officialConnection) {
    global $stagingDB;
    global $stagingCollection;
    global $loomaDB;
    global $loomaCollection;
    $query = array("en" => $word );
    if($stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->count($query) > 0) {
        return true;
    }
    return $officialConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->count($query) > 0;
}

/**
 * Checks if a definition has already been defined and therefore the new definition should
 * be canceled. Checks more strictly than checkForSimilarDefinition
 * @param unknown $def The definition object to check
 * @param unknown $stagingConnection The connection to the staging database
 * @param unknown $officialConnection The connection to the official database
 * @return boolean True if there is a duplicate, false if not
 */
function checkForDuplicateDefinition($def, $stagingConnection, $officialConnection) {
    global $stagingDB;
    global $stagingCollection;
    global $loomaDB;
    global $loomaCollection;
    $query = array("en" => $def["word"], "part" => $def["pos"], "def" => $def["def"]);
    if($stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->count($query) > 0) {
        return true;
    }
    return $officialConnection->selectDB($loomaDB)->selectCollection($loomaCollection)->count($query) > 0;
}

/**
 * Moves the word data to the same level as the staging data. (aka turn it from backend
 * version to database version)
 * @param unknown $word The word to modify
 */
function moveWordDataUpLevel($word) {
    $ans = array();
    foreach($word['wordData'] as $key => $val) {
        $ans[$key] = $val;
    }
    $ans['stagingData'] = array();
    foreach($word['stagingData'] as $key => $val) {
        $ans['stagingData'][$key] = $val;
    }
    return $ans;
}

/**
 * Clears the staging database of all words (technically the collection), and returns a boolean depending on whether it was
 * successful.
 * @param mongodb connection $stagingConnection The connection to the stagign database
 * @return boolean True if the database was cleared, false if it still has contents
 */
function clearStagingDatabase ($stagingConnection){
    global $stagingDB;
    global $stagingCollection;

    $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->remove(array());

    $cursor = $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->find();
    if ($cursor->hasNext()) {
        return false;
    }else{
        return true;
    }
}


/**
 * Adds a single word to the staging database.  Only the 'en,' 'rand,' 'date_entered,' 'mod,'
 * and 'stagingData' fields are populated
 * @param mongodb connection $stagingConnection The connection to the stagign database
 * @param string $word The word to be entered
 * @return string $user The user entering the word
 */
function addSingleWord ($stagingConnection, $word, $user) {
    global $stagingDB;
    global $stagingCollection;

    //get the date and time
    $dateCreated = getDateAndTime("America/Los_Angeles");

    //generate random number
    $random = generateRandomNumber(16);

    //put everything into a doc
    $doc = array( "wordData" => array(
        "en" => $word,
        "ch_id" => '',
        "rw" => '',
        "np" => '',
        "part" => '',
        "def" => '',
        "plural" => '',
        //'primary' => false,
        "rand" => $random,
        "date_entered" => $dateCreated,
        "mod" => $user),
        "stagingData" => array(
            'added' => true, 'modified' => false, 'accepted' => false,
            'deleted' => false
        )
    );

    $stagingConnection->selectDB($stagingDB)->selectCollection($stagingCollection)->save(moveWordDataUpLevel($doc));

    return true;
}

/**
 * Checks that the internet is working and can get correct data from the dictionary and
 * translator.
 * @return true if no problem, false if the program should cancel.
 */
function checkLookupConnections() {
    $translateCheck = translateToNepali("test") === null;
    $lookupCheck = count(lookUpWord("test")) == 0;
    error_log($translateCheck);
    error_log($lookupCheck);
    return !($translateCheck or $lookupCheck);
}

?>
