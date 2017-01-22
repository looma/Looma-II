<?php
/*
 * File:		delete.php
 * Description:	This file runs upon deleting a timeline from looma-lesson-open.html
 *				The script recieves a _POST request containing a name and all of the MongoID's
 *				of the relevant timeline, and the ID of the timeline.
 *				As a results, one timeline document will contain
 *				- Mongo ID referring to the Timeline itself
 *				- Name of Timeline Document
 *				- Array of MongoId's for relevant media
 *
 *				delete.php will delete the Mongo document from the timelines.json file
 *				which will act as a repository fo the open.html module.
 *
 *				delete.php also will delete the  Mongo Document from the Mongo collection 'timelines'.
 */

/*Connect to MongoDB*/
require_once 'includes/mongo-connect.php';
require_once 'includes/looma-lesson-utilities.php';

/*Set variables */
$filename = 'timelines.json';

/*Create and Insert Timeline into Database*/
	$info = array("name" => $_POST["itemString"], "itemId" => $_POST["itemId"], "line" => $_POST["line"]);
	// $timelines->insert($info);
	// $info = fixDocId($info);

/*Open and Edit Timeline Repository*/
	$timelinesJSON = file_get_contents($filename);
	$timelinesJSON = json_decode($timelinesJSON, true);
	//echo $file; //Debug

	foreach($timelinesJSON as $key => $value) {
		if (in_array($info["itemId"], $value)) {
			$timelines->remove(array('_id' => new MongoId($info["itemId"])));	// Removes from Mongo
			unset($timelinesJSON[$key]);	// Removes from JSON
			$timelinesJSON = array_values(array_filter($timelinesJSON));	// Resets indices once the item is removed
			echo "Deleted " . $info["name"];
		}
	}
	$timelinesJSON = json_encode($timelinesJSON);
	$timelinesJSON = file_put_contents('timelines.json', $timelinesJSON);



?>