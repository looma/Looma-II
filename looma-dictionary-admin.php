<!doctype html>
<!--
Name: Justin Cardozo
Email: justin.cardozo@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 06
Revision: Looma 2.0.0
File: contentNavigator.php
Description:  updates all dictionary entries with random value in "rand" field
-->

<?php
include ('includes/mongo-connect.php');
function keyIsSet($key, $array) { return isset($array[$key]);} //compatibility shiv for php 5.x "keyIsSet()"

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
	$dictionary = mongoFind($dictionary_collection, [], null, null, null);
	foreach ($dictionary as $d)
	{
		$count += 1;
		$d_id = keyIsSet('_id', $d) ? $d['_id'] : null;
		$random = (float)rand()/(float)getrandmax();
		$newdata = array('$set' => array("rand" => $random));
		mongoUpdate($dictionary_collection, array("_id" => $d_id), $newdata);

		echo "<p>Dictionary entry: <b>" . $d['en'] .
             "</b> [nepali: " . $d['np'] .
              " assigned random index: " . $d['rand'] . "</p>";
	}
    echo "<h3>Processed $count dictionary entries</h3>";

    /*
     *
    echo "<h3>Ensuring database index on RAND runs asynchronously - may not complete for a while after this page terminates</h3>";
    $dictionary_collection->createIndex(array('rand' => 1));	//index DICTIONARY for random search
    $dictionary_collection->createIndex(array('ch_id' => 1));	//index DICTIONARY for search on CH_ID
    $dictionary_collection->createIndex(array('en' => 1));	    //index DICTIONARY for search on EN (english word) "lookup"
     */
	?>
</body>
</html>
