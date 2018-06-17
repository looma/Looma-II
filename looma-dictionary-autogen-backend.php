<?php
/*
 * File: looma-dictionary-autogen-backend.php
 * Author: Nikhil Singhal
 * Date: July 28, 2016
 *
 * Provides the intermediate backend functionality for looma-dictionary-autogen-editor.php
 *
 * This code relies on looma-dictionary-autogen-utilities.php, which in turn relies on other php files,
 * however the methods in this file only depend upon the methods in looma-dictionary-autogen-utilities.php
 *
 * This file was designed to communicate securely with js/looma-dictionary-autogen-editor.js, but will also
 * work with anything else that sends correctly formatted data.
 *
 * The user will soon be required to log in to use this service, functionality that
 * will be provided through includes/login_page.php (unfinished), however for now
 * the login information provided is assumed to be correct. The connections to the
 * database are secure even from other php files attempting to require it because
 * it generates the connections using the user's login information and closes and unsets
 * the connections at the end of the script body, so they can't be reused.
 *
 *
 * requires the user to input data in the following way for each of the following requests.
 * Only one type of the following may be made per request.
 *
 * EXPECTED ARGUMENTS:
 *
 * all requests:
 * post/get {
 * 		loginInfo: {
 * 						user: username (string),
 * 						[other information not yet determined. will be defined by
 * 							includes/login_page.php]
 * 					}
 * }
 *
 * add list of words:
 *
 * post {
 * 		wordList: JSON encoded string representing an array of words  in the following form
 * 				{word: the word, ch_id: the word's ch_id}
 * }
 *
 * search staging:
 *
 * get {
 * 		staging: true or "true"
 * 		searchArgs: {
 * 						text: text to search for (string)
 * 						added: search for added words (boolean/string rep of boolean)
 * 						modified: search for modified words (boolean/string rep of boolean)
 * 						accepted: search for accepted words (boolean/string rep of boolean)
 * 						page: the page of data to search on (int)
 * 					}
 * }
 *
 * search official:
 *
 * get {
 * 		staging: false or "false"
 * 		searchArgs: {
 * 						word: the word to search for (string),
 * 						overwritten: true if should show overwritten entries too
 * 					}
 * }
 *
 *
 * publish:
 *
 * get {
 * 		publish: any value that will return as true from isset()
 * }
 *
 * modify:
 *
 * get {
 * 		mod: {
 * 				wordId: id string of the word to modify (string)
 * 				field: the name of the field to modify (will use front end names:
 * 						word, stat, delete, cancel, root, pos, nep, def) (string)
 * 				new: the new value in the edited field. may be empty if the field
 * 						was a toggle rather than text (string)
 * 				deleteToggled: if true, negates delete and ignores other mod data (boolean)
 * 			}
 * }
 *
 *
 * move from official to staging database:
 * get {
 * 		moveId: id of the word to move (string)
 * }
 *
 *
 * getting the progress session:
 * get {
 * 		progress: anything
 * }
 *
 *
 * reverting all staging data
 *
 * get {
 * 		revertAll: anything
 * }
 *
 * cancel upload
 *
 * get {
 * 	cancelUpload: anything
 * }
 *
 *
 * Passes back the data in the following format for varying requests and outcomes. All
 * data returned is in JSON format.
 *
 * RETURNED DATA:
 *
 * error:
 * {
 * 		status: {
 * 					type: 'error',
 * 					value: 'Not logged in' or 'publishing failed' or 'modifying failed'
 * 							or 'moving failed' or 'invalid request'
 * 					[request: the request sent (string). only present for 'invalid request']
 * 				}
 * }
 *
 * add word list:
 * {
 * 		status: {
 * 					type: 'success'
 * 				},
 * 		canceled: (optional) list of words skipped because of a canceled upload
 * 		noCon: (optional) list of words skipped because couldn't connect to dictionary or translator
 * 		fullSkip: (optional) list of words skipped completely due to an unknown error
 * 		exists: (optional) list of words skipped because they already existed
 * 		partSkip: (optional) list of words where a definition, but not all, were skipped
 * 		partMissing: (optional) list of words where a definition is missing a required field
 * 		success: (optional) list of words successfully added as far as the system can tell
 * }
 *
 * search staging:
 * {
 * 		data: {
 * 				page: page number (int)
 * 				maxPage: the highest page number for this search (int)
 * 				words: list of word objects in staging format (defined in BackendFunctions)
 * 			}
 * }
 *
 * search official:
 * {
 * 		data: list of word objects in staging format (defined in BackendFunctions.php)
 * }
 *
 *
 * publishing or modifying or moving:
 * {
 * 		status: {
 * 				type: 'success'
 * 		}
 * }
 *
 *
 * getting the progress session:
 * {
 * 		progress: {
 * 				position: (int),
 * 				length: (int)
 * 		}
 * }
 *
 * reverting all staging data:
 * status: {
 * 		type: 'success' or 'error'
 * }
 *
 *
 * cancel upload
 * [no special response]
 *
 *
 *
 */

set_time_limit(300); // prevent timeout due to a large file. 5 minutes of direct php ops

require "looma-dictionary-autogen-utilities.php";


/**
 * list of fields in wordData that need to be converted from backend to front.
 * in the form array(backend, frontend). If a field isn't in the list, it will not be
 * transfered (aka it will be deleted)
 */
$wordDataConversions = array(array("_id", "id"), array("en", "word"), array("rw", "root"),
    array("np", "nep"), array("part", "pos"), array("def", "def"),
    array("rand", "rand"), array("date_entered", "date"),
    array("mod", "mod"), array("ch_id", "ch_id"),
    array("plural", "plural"));


/**
 * Converts the word either to or from front/back end versions
 * @param unknown $word The word to convert
 * @param unknown $toBackend True if should be converted to backend, false if to front end
 * @return the converted word
 */
function convertWord($word, $toBackend) {
    global $wordDataConversions;
    // in case $toBackend's boolean value as an int isn't 1/0
    $from = $toBackend ? 1 : 0;
    $to = $toBackend ? 0 : 1;

    $new = array("wordData" => array(), "stagingData" => $word["stagingData"]);
    foreach ($wordDataConversions as $conversion) {
        $new["wordData"][$conversion[$to]] = $word["wordData"][$conversion[$from]];
    }
    return $new;
}

/**
 * Converts all words in the list using the convertWord() function. The original list should
 * be modified, but for some reason isn't
 * @param unknown $list The list to convert
 * @param unknown $toBackend True if should be converted to backend, false if to front end
 * @return the converted list
 */
function convertWordList($list, $toBackend) {
    foreach ($list as $key => $word) {
        $list[$key] = convertWord($word, $toBackend);
    }
    return $list;
}



/*
 * The following wrapper methods are designed such that any formatting of front end
 * data can be separated out from the response code as well as the  looma-dictionary-autogen-utilities.php
 * general code. Wrappers that currently seem useless should be kept in case changes are
 * necessary and for consistency with the others that require wrappers.
 */






/**
 * Creates new dictionary entries with the given word
 * @param string $word The word to create entries fors
 * @param connection $officialConnection the connection to the official database
 * @param connection $stagingConnection the connection to the staging database
 * @param string $user the name of the user
 * @return boolean true if the entry was created successfully, false otherwise
 */
function createEntryWrapper($word, $officialConnection, $stagingConnection, $user) {
    $word["word"] = strtolower($word["word"]);
    if(!isLegalValue("word", $word["word"]) || !isLegalValue("ch_id", $word["ch_id"])) {
        return false; // shouldn't add since the word or ch_id is invalid
    }
    return createEntry($word, $officialConnection, $stagingConnection,
        $user);
}

/**
 * Reads entries from the staging database that match the given parameters
 * @param unknown $args The parameters for the search
 * @param unknown $stagingConnection The connection to the staging database
 * @return object in the following format: {page: (int), maxPage: (int),
 * 											words: frontend word array}
 */
function readStagingWrapper($args, $stagingConnection) {
    $out = readStagingDatabase($args, $stagingConnection);
    $out["words"] = convertWordList($out["words"], false);

    return $out;
}

/**
 * Reads entries from the official database that match the given parameters
 * @param unknown $args The parameters for the search
 * @param unknown $officialConnection The connection to the official database
 * @param unknown $stagingConnection The connection to the staging database
 * @return array of frontend words
 */
function readOfficialWrapper($args, $officialConnection, $stagingConnection) {
    return convertWordList(findDefinitonsForSingleWordLooma($args['word'],
        $officialConnection, $stagingConnection,
        $args['overwritten']), false);
}

/**
 * Publishes all accepted and deleted changes to the official database
 * @param connection $officialConnection The connection to the official database
 * @param connection $stagingConnection The connection to the staging database
 * @param string $user The user
 * @return boolean True if publishing succeeded, false otherwise
 */
function publishWrapper($officialConnection, $stagingConnection, $user) {
    return publish($stagingConnection, $officialConnection, $user);
}

/**
 * Updates the staging database with the given changes
 * @param array $change an array containing information about the change in the following
 * format: { wordId: the id of the word to change (string), field: name of field to change
 * (string, uses frontend names, which don't always correspond to backend names),
 * new: the new value of the field (string, may not be relevant), deleteToggled: true if
 * 'deleted' should be toggled, in which case all else will be ignored (boolean)}
 * @param connection $officialConnection The connection to the Permanent Dictionary
 * @param connection $stagingConnection The connection to the Staging Dictionary
 * @param string $user the user
 * @return false if the update failed, true if successful
 */
function updateStagingWrapper($change, $officialConnection, $stagingConnection, $user) {
    $former = findDefinitionWithID($change["wordId"], $officialConnection,
        $stagingConnection);
    $former = convertWord($former, false);

    $modified = false;

    if($change["deleteToggled"] == "true") {
        $former["stagingData"]["deleted"] = !$former["stagingData"]["deleted"];
    } elseif($change["field"] == "cancel") {
        removeStaging($change["wordId"], $stagingConnection);
        return true;
    } elseif ($change["field"] == "stat") {
        $former["stagingData"]["accepted"] = !$former["stagingData"]["accepted"];
  //  } elseif($change["field"] == "plural") {
  //      $former["wordData"]["plural"] = !$former["wordData"]["plural"];
  //      $modified = true;
    } elseif (in_array($change["field"],
        array("word", "root", "nep", "pos", "def", "ch_id", "plural"))) {
        if($change["field"] == "word") {
            $change["new"] = strtolower($change["new"]);
        }
        // get rid of potentially dangerous whitespace (would throw off exact searches)
        $change["new"] = trim($change["new"]);

        // for all of these the value just needs to be updated to $change["new"]
        $former["wordData"][$change["field"]] = $change["new"];

        // verify that this change is legal first:
        if(!isLegalValue($change["field"], $change["new"])) {
            return false;
        }
        $modified = true;
    } else {
        // illegal update attempt
        return false;
    }
    $out = convertWord($former, true);
    // assumes that updateStaging will take care of changing the modifier, date modified,
    // and all staging data, since these are general tasks.
    return updateStaging($out, $stagingConnection, $user, $modified);
}

/**
 * Wrapper for copying an entry from the official database to the staging database so
 * it can be edited. While to the user it looks like it is being moved, the entry is only
 * copied in order to preserve its original state until publishing
 * @param unknown $moveId The id of the object to move
 * @param unknown $officialConnection The connection to the official database
 * @param unknown $stagingConnection The connection to the staging database
 * @param unknown $user The user responsible
 * @return true if successful, false otherwise
 */
function moveToStagingWrapper($moveId, $officialConnection, $stagingConnection, $user) {
    return moveEntryToStaging($stagingConnection, $officialConnection, $moveId, $user);
}

/**
 * Wrapper for getting the progress session of the current user.
 * @param unknown $appConnection The connection to the app database
 * @param unknown $user The user requesting the session
 * @return {"position": how many words have been parsed, "length": how many total}
 */
function getProgressWrapper($appConnection, $user) {
    return getUploadProgress($appConnection, $user);
}

/**
 * Wrapper for closing the current upload session. This will stop an ongoing upload
 * and also prevent contamination of the next upload's progress bar
 * @param unknown $appConnection The connection to the app database
 * @param unknown $user The user requesting the end of the session
 */
function closeUploadProgressWrapper($appConnection, $user) {
    return closeUploadProgress($appConnection, $user);
}

/**
 * Wrapper for removing all entries from the staging database
 * @param unknown $stagingConnection The staging connection
 * @return True if successful, false if failed
 */
function revertAllStagingWrapper($stagingConnection) {
    return clearStagingDatabase($stagingConnection);
}

/**
 * Wrapper for adding a single word to the staging database. ONLY ADDS THE ENGLISH part
 * of it, not even adding definition or part of speech
 * @param unknown $word The word to add (string)
 * @param unknown $stagingConnection The connection to the staging database
 * @param unknown $user The user (string)
 * @return true if successful, false otherwise
 */
function addSingleWordWrapper($word, $stagingConnection, $user) {
    $word = strtolower($word);
    if(!isLegalValue("word", $word)) {
        return false;
    }
    return addSingleWord($stagingConnection, $word, $user);
}

/**
 * Checks that the value is legal for the field.
 * @param unknown $field The field to check
 * @param unknown $value The value to check
 */
function isLegalValue($field, $value) {
    // fields: "word", "root", "nep", "pos", "def", "ch_id"
    if(in_array($field, array("word", "root"))) {
        return strpos($value, ' ') === false; // only fails if multiple words
    } else if($field == "pos") {
        return (in_array($value,
                array("noun","verb","adverb","adjective","preposition","conjunction","pronoun","contraction","article","title","interjection","proper name")));
    } else if($field == "def" or $field == "nep" or $field == "plural") {
        return true; // all definitions should be valid
    } else if($field == "ch_id") {
        return preg_match('/^(([1-9]|10)((M|N|S|SS|EN|H|V)(([0-9][0-9]\.)?[0-9][0-9])?)?)?$/', $value) === 1;
    }
}

$officialConnection;
$stagingConnection;
$appConnection;

if(!isset($_REQUEST['loginInfo'])) { // no login data means not logged in
    $response['status'] = array( 'type' => 'error', 'value' => 'Not logged in');
} else {
    // attempt to create connections using the login data provided
    $officialConnection =  createConnectionToLooma($_REQUEST['loginInfo']);
    $stagingConnection = createConnectionToStaging($_REQUEST['loginInfo']);
    $appConnection = createConnectionToApp($_REQUEST['loginInfo']);

    if($officialConnection == null or $stagingConnection == null) {
        $response['status'] = array('type' => 'error', 'value' => 'Can\'t open database');

    } else if ($_SERVER['REQUEST_METHOD'] == 'POST' and isset($_REQUEST['wordList'])) {
        // adds all definitions for all words in 'wordsList' to the staging dictionary

        $list = json_decode($_REQUEST['wordList'], true);

        // creates a session that allows the front end to check progress
        createUploadProgressSession(count($list), $appConnection,
            $_REQUEST['loginInfo']['user']);

        $canceled = false;
        $noConnection = false;

        if(!checkLookupConnections()) {
            $noConnection = true;
        }


        try {
            foreach ($list as $index => $word) {

                // check that session was not canceled
                if(!$canceled and !$noConnection and
                    getProgressWrapper($appConnection, $_REQUEST['loginInfo']['user'])
                    == null) {
                    // canceled
                    $canceled = true;
                }


                // if canceled, never a success
                if($canceled) {
                    $output = -3;
                    $key = "canceled";
                } else if($noConnection) {
                    $output = -2;
                    $key = "noCon";
                } else {
                    $output = createEntryWrapper($word,
                        $officialConnection, $stagingConnection,
                        $_REQUEST['loginInfo']['user']);
                    $key = array("fullSkip", "exists", "partSkip", "partMissing", "success")[$output + 1];
                }


                if(!isset($response[$key])) {
                    $response[$key] = array();
                }
                $response[$key][] = $word["word"];
                updateUploadProgressSession($index + 1, $appConnection,
                    $_REQUEST['loginInfo']['user']);
            }
        } catch(Exception $e) {
            error_log($e->getMessage());
        } finally {
            closeUploadProgressWrapper($appConnection, $_REQUEST['loginInfo']['user']);
        }



        //NOTE: the code below determines what operation to perform based on whether certain known variables are set
        //      TODO: should change this to the 'cmd' based operations used in looma-database-utilities.php and others
        //
        
        // always considered successful, but may skip words
        $response['status'] = array('type' => 'success');
    } elseif ($_SERVER['REQUEST_METHOD'] == 'GET' and isset($_REQUEST['searchArgs'])) {
        // searches for the definitions specified by the 'searchArgs' and returns results
        if ($_REQUEST['staging'] == "true") {
            $response['data'] = readStagingWrapper($_REQUEST['searchArgs'],
                $stagingConnection);
        } else {
            $response['data'] = readOfficialWrapper($_REQUEST['searchArgs'],
                $officialConnection, $stagingConnection);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] == 'GET' and isset($_REQUEST['publish'])) {
        // publishes accepted changes to the official database
        $success = publishWrapper($officialConnection, $stagingConnection,
            $_REQUEST['loginInfo']['user']);
        if($success) {
            $response['status'] = array('type' => 'success');
        } else {
            $response['status'] = array('type' => 'error', 'value' => 'publishing failed');
        }
    } elseif($_SERVER['REQUEST_METHOD'] == 'POST' and isset($_REQUEST['mod'])) {
        // modifies the definition in the way specified by the 'mod'
        $success = updateStagingWrapper($_REQUEST['mod'], $officialConnection,
            $stagingConnection, $_REQUEST['loginInfo']['user']);
        if($success) {
            $response['status'] = array('type' => 'success');
            // if successful, also return the new value of the word
            $response['new'] = $success;
        } else {
            // if failed, don't return a new value, since the old value is still valid
            $response['status'] = array('type' => 'error',
                'value' => 'modifying failed');
        }
    } elseif($_SERVER['REQUEST_METHOD'] == 'GET' and isset($_REQUEST['moveId'])) {
        $success = moveToStagingWrapper($_REQUEST['moveId'], $officialConnection,
            $stagingConnection, $_REQUEST['loginInfo']['user']);
        if($success) {
            $response['status'] = array('type' => 'success');
        } else {
            $response['status'] = array('type' => 'error', 'value' => 'moving failed');
        }
    } elseif($_SERVER['REQUEST_METHOD'] == 'GET' and isset($_REQUEST['progress'])) {
        $response['progress'] = getProgressWrapper($appConnection, $_REQUEST['loginInfo']['user']);
    } elseif($_SERVER['REQUEST_METHOD'] == 'GET' and isset($_REQUEST['revertAll'])) {
        $response['status'] = array('type' =>
            revertAllStagingWrapper($stagingConnection) ? 'success' : 'error');
    } elseif($_SERVER['REQUEST_METHOD'] == 'GET' and isset($_REQUEST['newWord'])) {
        $response['status'] = array('type' =>
            addSingleWordWrapper($_REQUEST['newWord'], $stagingConnection,
                $_REQUEST['loginInfo']['user']) ? 'success' : 'error');
    } elseif($_SERVER['REQUEST_METHOD'] == 'GET' and isset($_REQUEST['cancelUpload'])) {
        closeUploadProgressWrapper($appConnection, $_REQUEST['loginInfo']['user']);
    } else {
        // the arguments didn't match any acceptable requests
        $response['status'] = array('type' => 'error', 'value' => 'invalid request',
            'request' => json_encode($_REQUEST));
    }
}
unset($officialConnection);
unset($stagingConnection);

//return json encoded response
$encoded = json_encode($response);
header('Content-type: application/json');
exit($encoded);

?>
