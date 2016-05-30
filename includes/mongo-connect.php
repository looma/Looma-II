<?php
	//Name: Skip
	//Email: skip@stritter.com
	//Owner: VillageTech Solutions (villagetechsolutions.org)
	//Date: 2015 03
	//Revision: Looma 2.0.0
	//File: includes/mongo-connect.php
	//Description:  for Looma 2

	$dbhost = 'localhost';
	$dbname = 'looma';

//	$m = new MongoClient("mongodb://$dbhost");
	$m = new MongoClient();
	$loomaDB = $m -> $dbname;


	$activities_collection = $loomaDB -> activities;
	$chapters_collection =   $loomaDB -> chapters;
	$textbooks_collection =  $loomaDB -> textbooks;
	$dictionary_collection = $loomaDB -> dictionary;
?>
