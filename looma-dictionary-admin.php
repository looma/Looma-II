<!doctype html>
<!--
Name: Justin Cardozo
Email: justin.cardozo@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 06
Revision: Looma 2.0.0
File: contentNavigator.php
Description:  Interacts with Mongo to let the user select a collection to edit
-->

<?php
include ('includes/mongo-connect.php');
?>

<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Random Generator</title>
</head>
<body>
	<?php
	echo "<h3>Adding random fields and ensuring indexing on randomization</h3>";
	$count = 0;
	$dictionary = $dictionary_collection -> find();
	foreach ($dictionary as $d)
	{
		$count += 1;
		$d_id = array_key_exists('_id', $d) ? $d['_id'] : null;
		$random = (float)rand()/(float)getrandmax();
		$newdata = array('$set' => array("rand" => $random));
		$dictionary_collection->update(array("_id" => new MongoId("$d_id")), $newdata);
		$d_en = array_key_exists('en', $d) ? $d['en'] : null;
		$d_np = array_key_exists('np', $d) ? $d['np'] : null;
		$d_r = array_key_exists('rand', $d) ? $d['rand'] : null;
		echo "<p>Dictionary entry: <b>$d_en</b> [nepali: $d_np] assigned random index: $d_r</p>";
	}
	echo "<h3>Processed $count dictionary entries</h3>";
	echo "<h3>Ensuring database index on RAND runs asynchronously - may not complete for a while after this page terminates</h3>";
	$dictionary_collection->createIndex(array('rand' => 1));	//index DICTIONARY for random search	
	$dictionary_collection->createIndex(array('ch_id' => 1));	//index DICTIONARY for search on CH_ID
	$dictionary_collection->createIndex(array('en' => 1));	    //index DICTIONARY for search on EN (english word) "lookup"
	 ?>
</body>
</html>