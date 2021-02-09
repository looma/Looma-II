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
include '../Looma/includes/mongo-connect.php';

//Get Query and Page To Load
$request = $_GET["q"];
$page = $_GET["page"] * 20;

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

//Build Regex .* is anything and i is ignore case
$regex = new MongoRegex('/^.*' . $request . '/i');

//Query For Item
$query = array("dn" => $regex, 'ft' => array('$in' => $fileTypes));
$cursor = $activities_collection->find($query)->skip($page)->limit(20);


foreach ($cursor as $d)
{
	// $d_id = $cursor['_id'];
	// $d_title = $cursor['dn'];
	// $chid = $cursor['ch_id'];
	//Grab The ID, Title, and description
	$d_id = array_key_exists('_id', $d) ? $d['_id'] : null;
	$d_title = array_key_exists('dn', $d) ? $d['dn'] : null;
	$chid = array_key_exists('ch_id', $d) ? $d['ch_id'] : null;
	$d_description = "sample text";

	//Add the search result
	// echo "
	// <div class='row'>
	// 	<div class='well well-sm individualResult' dbid='$d_id' title='$d_title' chid='$chid'>
	// 		<h4> $d_title </h4>
	// 		<div class='limitedResult'></div>
	// 	</div>
	// </div>
	// ";
	echo "
	<tr>
		<td class='individualResult' dbid='$d_id' title='$d_title' chid='$chid'>
			<h4> <b> $d_title </b> </h4>
		</td>
	</tr>
	";
}

?>
