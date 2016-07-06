<!--
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentNav-results.php
Description: Connents to MONGO DB Database and grabs activities to show
-->
<?php

//Connents to Mongo DB
$m = new MongoClient();
$fileDB = $m->looma;
$activities = $fileDB -> activities;

//Get Query and Page To Load
$request = $_GET["q"];
$page = $_GET["page"] * 10;

//Get Search Parameters
$fileTypes = array();
$showVideo = $_GET["videosChecked"];
$showAudio = $_GET["audioChecked"];
$showImages = $_GET["imagesChecked"];
$showWebpages = $_GET["webpagesChecked"];
$showPdfs = $_GET["pdfsChecked"];

//Append Relevant File Types
if ($showVideo == "true") {
	array_push($fileTypes, "mp4", "video", "mov");
}
if ($showAudio == "true") {
	array_push($fileTypes, "mp3", "audio");
}
if ($showImages == "true") {
	array_push($fileTypes, "image", "jpg", "png", "gif");
}
if ($showWebpages == "true") {
	array_push($fileTypes, "EP", "html", "htm", "php", "asp");
}
if ($showPdfs == "true") {
	array_push($fileTypes, "pdf");
}

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
	include 'looma-contentNav-result.php';
}

?>
