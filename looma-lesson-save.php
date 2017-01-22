<?php
/*
 * File:		looma-lesson-save.php
 * Description:	This file runs upon saving a timeline from the main web application
 *				The script recieves a _POST request containing a name and all of the MongoID's
 *				of the relevant timeline.
 *				As a results, one timeline document will contain
 *				- Mongo ID referring to the Timeline itself
 *				- Name of Timeline Document
 *				- Array of MongoId's for relevant media
 *
 *				looma-lesson-save.php also will append the generated Mongo Document to the timelines.json file
 *				which will act as a repository for the open.html module.
 */

//Connect to MongoDB//
require_once 'includes/mongo-connect.php';
require_once 'includes/looma-lesson-utilities.php';
//Set variables //

$filename = 'timelines.json';
//Open Timeline Repository
$file = file_get_contents($filename);
$timelineArray = json_decode($file, true); //the true parameter allows the functions to treat the object like an associated array

if(!empty($_POST["timeline_id"]))
	edit();
else
	addNew();

//CASE 1: Editing Existing Timeline//
function edit()
{
	global $timelines;
	global $timelineArray;
	$timelineId = $_POST["timeline_id"];

	//Find the mongo document for the relevant timeline

	try
	{
		echo $_POST["lesson_title"];
		$info = $timelines->findAndModify(
			array("_id" => new MongoId($timelineId)),
			array('$set' => array("name" => $_POST["lesson_title"], "line" => $_POST["items_array"])),
			null,
			array("new" => true)
		);
	} catch (MongoResultException $e) {
		echo "Find and Modify in looma-lesson-save.php did not work";
	}
	$info = fixDocId($info);

	//Edit timeline in timeline.json
	foreach($timelineArray as $key => $value) {
		if (in_array($info["_id"], $value)) {
			$timelineArray[$key] = $info;	// Edits JSON
			//$timelineArray = array_values(array_filter($timelineArray));	// Resets indices once the item is removed
			echo "Edited " . $info["name"];
		}
	}

}

//CASE 2: Create and Insert new Timeline into Database//
function addNew()
{
	global $filename;
	global $timelines;
	global $timelineArray;
	echo "new timeline create";
	$info = array("name" => $_POST["lesson_title"], "line" => $_POST["items_array"]);
	$timelines->insert($info);
	$info = fixDocId($info);

	//Add new timeline information into $file//
	$timelineArray[] = $info;
}

file_put_contents($filename, json_encode($timelineArray), LOCK_EX);

?>
