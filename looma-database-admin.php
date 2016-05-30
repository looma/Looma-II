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
	<title>Looma Database Admin program</title>
</head>
<body>
	<?php
	echo "<h3>Looma Database Admin program</h3>";
	echo "<h3>this program will index heavily used database fields for faster database performance</h3>";
	echo "<h4>Note: if you have modified the Dictionary collection in the database, please also run looma-dictionary-admin.php</h4>";
	echo "<h3>Indexing the database runs asynchromously - may not complete for a while after this page terminates</h3>";
	$activities_collection->createIndex(array('ch_id' => 1));	
	$activities_collection->createIndex(array('fn' => 1));	
	//$chapters_collection->createIndex(array('_id' => 1));	 //not necessary, primary key for CHAPTERS is _id in ch_id format
	//$textbooks_collection->createIndex(array('' => 1)); //not necessary, TEXTBOOKS collection is too small to bother indexing		
	?>
</body>
</html>