<?php
function populateResults($title, $text) {
	include 'looma-contentNav-result.php';
}

//Connents to Mongo DB
$m = new MongoClient();
$fileDB = $m->looma;
$activities = $fileDB -> activities;

$request = $_GET["q"];
$page = $_GET["page"] * 10;

$regex = new MongoRegex("/^$request/i");
$query = array("dn" => $regex); //note the single quotes around '$gt'
$cursor = $activities->find($query)->skip($page)->limit(10);

//If count returns less than ten stop updating the database unless query changes
$count = 0;

foreach ($cursor as $d)
{
	$count += 1;
	$d_id = array_key_exists('_id', $d) ? $d['_id'] : null;
	$newdata = array('$set' => array("rand" => $random));
	$d_title = array_key_exists('dn', $d) ? $d['dn'] : null;
	$d_description = "sample text";
	populateResults($d_title, $d_description);
}

?>
