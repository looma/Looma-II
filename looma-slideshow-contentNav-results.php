<!--
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-slideshow-contentNav-results.php
Description: Connents to MONGO DB Database and grabs activities to show

Modified by Thomas Woodside for use in Looma Picture Player.
-->
<?php
include "looma-slideshow-contentPreview.php";
//Connents to Mongo DB
$m = new MongoClient();
$fileDB = $m->looma;
$activities = $fileDB -> activities;

//Get Query and Page To Load
$request = $_GET["q"];
$page = $_GET["page"] * 10;

$fileTypes = array();
//Append Relevant File Types
array_push($fileTypes, "image", "jpg", "jpeg", "png", "gif");

//Search Database and Get Cursor
$regex = new MongoRegex("/^$request/i");
$query = array("dn" => $regex, 'ft' => array('$in' => $fileTypes));
$cursor = $activities->find($query)->skip($page)->limit(10);


foreach ($cursor as $d)
{
	//Grab The ID, Title, and description
	$d_id = array_key_exists('_id', $d) ? $d['_id'] : null;
	$d_title = array_key_exists('dn', $d) ? $d['dn'] : null;
	$chid = array_key_exists('ch_id', $d) ? $d['ch_id'] : null;
	$d_description = "sample text";

	//Add the search result
	include 'looma-slideshow-contentNav-result.php';
}

?>
