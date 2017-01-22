<?php

/*
 	File:		looma-lesson-open.php
 	Description:This file runs upon opening a specific timeline from the
 				main web application, or what will be the "open" module.
				The script receives a _POST variable from loona-lesson-open.html,
				containing the MongoID of the timeline being opened.
				As a result, the code
				- Searches Mongo and gets the saved timeline array (of
					relevant Mongo IDs) using the timeline's ID
				- Creates an array to hold all the relevant timeline documents,
				- Loads the array with the timeline documents
 */

require_once 'includes/mongo-connect.php';
require_once 'includes/looma-lesson-utilities.php';

	// make variable for the timeline ID
	$thisID = $_POST['$id'];

	// Find a specific timeline using the Mongo ID
	$line = $timelines->findOne(array('_id' => new MongoId($thisID)));
	echo json_encode($line);
?>
