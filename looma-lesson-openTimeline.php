<?php

/*
File:			looma-lesson-openTimeline.php
Description:	This will take the array of timeline element
				object IDs and retrieves it from the mongo
				database.
				It returns the information in an array.
*/

require_once 'includes/mongo-connect.php';
require_once 'includes/looma-lesson-utilities.php';

$timelineID = $_GET['$id'];		// the post is coming from looma-lesson-lesosnplan.js

/* Function:        getTimelineElements
 * Description:     Input   - Mongo ID of a Timeline Object
 *                  Return  - Array of MongoDB Documents from the associated timeline
 */
function getTimelineElements ($timelineID) {

    global $activities, $textbooks, $dictionary, $chapters, $timelines;

    // Create an array with the IDs of the elements
    $timelineDoc = $timelines->findOne(array('_id' => new MongoId($timelineID)));

    // Create array to hold the timeline element JSONs
    $timelineElementsArray = array();
    $cntelements = count($timelineDoc['line']);
    for ($i=0; $i<$cntelements; $i++)
    {
        $mongoID = $timelineDoc['line'][$i];    // placeholder for the mongoID we're searching for
        $document = searchMongo($mongoID);      // searchMongo() searches the collection for the right

        if ($document == null) {
            error_log("There is no document with this ID!", 0);
            // We should make a real error log .......
            // error_log("You messed up!", 3, "/var/tmp/my-errors.log");
            break;
        }
        $timelineElementsArray[$i] = $document;     // find the document! yay! key =
    }
    return $timelineElementsArray;
}



$timelineElementsArray = getTimelineElements($timelineID);
$timelineElementsArray = fixDocArray($timelineElementsArray);
echo json_encode($timelineElementsArray);

// // Create array to hold document data
// $timelineData = array();
// $cnt = count($timelineIDs["elements"]);
// for ($i=0; $i<$cnt; $i++) {
// 	$timelineData[$i] = searchMongo($timelineIDs["elements"][$i]);	// searchMongo() is in mongoSetup.php
// }
// return $timelineData;

?>
