<?php 
	$regex = new MongoRegex("/^$request/i");
	$query = array("title" => $regex); //note the single quotes around '$gt'
	$cursor = $files->find($query);
?>