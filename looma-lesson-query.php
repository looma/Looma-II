<?php

/*
 	File:			looma-lesson-query.php
 	Description:	This file runs upon clicking the "Search" button
 					in the "Query" module in the main web application.

 					FILTER
 					The "filter" function has 5 options:
						1. Grade
						2. Subject
						3. Chapter
						4. Section
						5. Type of media
					The filter returns a JSON string for the Front-End Application to then parse

					SEARCH
					The "search" function will take the search query and do a simple text search through
					the mongo document returned by the filter
 */

require_once('includes/mongo-connect.php');

///////
// Test out mongoquery with extra shit
//////
$gscs_array = gscsQuery();
$cnt_gscs = count($gscs_array);

$ft_array = fileTypeQuery();
$cnt_ft = count($ft_array);

$final_array = array();

// Create foor loop to merge the query arrays and search mongo

for ($i=0; $i<$cnt_gscs; $i++) {
	for ($j=0; $j<$cnt_ft; $j++) {
		if(empty($ft_array[$j]))
		{
			$gscs_ft_array = $gscs_array[$i];
		}
		else
		{
			$gscs_ft_array = array_merge($gscs_array[$i], $ft_array[$j]);
		}

		$mongo_doc_arrays = queryMongo($gscs_ft_array);
		for ($k=0; $k<count($mongo_doc_arrays); $k++){
			$mongo_doc_arrays[$i] = fixDocArray($mongo_doc_arrays[$i]);
		}

		if($i == 0)
		{
			$final_array["chapters"] = $mongo_doc_arrays[0];
		}
		else if($i == 1)
		{
			$final_array["textbooks"] = $mongo_doc_arrays[1];
		}
		else if($i == 2)
		{
			$final_array["activities"] = $mongo_doc_arrays[2];
		}
		else if ($i == 3)
		{
			$final_array["dictionary"] = $mongo_doc_arrays[3];
		}
	}
}
echo json_encode($final_array);

//Function: gscsQuery
//	Input: n/a (it receives info from GET requests)
// 	Return: Array of documents matching
//	NOTE: "gscs" stands for Grade,Subject,Chapter,Section, the only filter inputs we deal with in this function
	function gscsQuery()
	{
		global $filterword;
	    $filterword	= "";
		if(isset($_GET["grade"]) && $_GET["grade"] != '')
		{
			$filterword .= $_GET["grade"];
		}
		else
		{
			//Match any grade, 1-8
			$filterword .= "[1-8]";
		}


		if(isset($_GET["subject"]) && $_GET["subject"] != '')
		{
			// $filterword .= "^[^%]*" . $_GET['subject'] . "[^%]*$";
			$filterword .= $_GET["subject"];

		}
		else
		{
			//Match any Subject of One or More Letters
			$filterword .= "[A-Za-z]+";
		}


		if(isset($_GET["chapter"]) && $_GET["chapter"] != '')
		{
			$filterword .= "([^\.1-9]" . $_GET["chapter"] . ")|([^\.]0" . $_GET["chapter"] . ")";

			/*
			if($_GET["subject"] == "S") {
				//If searching for Science, don't match Social Studies
				$filterword = "($|)";
			}
			else {
				$filterword = "";
			}
			*/
		}
		else
		{
			// $filterword.= "([0-9][0-9]?)?";

			//Match Any chapter from 0-99
			//Assuming double digit chapter numbers


			// echo $filterword;
			if($_GET["subject"] == "S") {
				//If searching for Science, don't match Social Studies
				$filterword.= "($|([0-9][0-9]?))";
			}
			else {
				$filterword.= "([0-9][0-9]?)?";
			}

		}


		if(isset($_GET['section']) && $_GET["section"] != '')
		{
			$filterword .= "\." . $_GET['section'];


			/*
			if($_GET["subject"] == "S") {
				//If searching for Science, don't match Social Studies
				$filterword = "($|)";
			}
			else {
				$filterword = "";
			}
			*/
		}
		else
		{
			//Auto match section with lack of section -- this code doesn't matter!
		}

		// echo " regex: " . $filterword;

		//Construct a query by placing regex into relevant array
		//NOTE: using regex to do a case insensitive search for the filterword
		$chapter_query = array('_id' => new MongoRegex("^$filterword/i"));
		$text_query = array('prefix' => new MongoRegex("^$filterword/i"));
		$act_query = array('ch_id' => new MongoRegex("^$filterword/i"));
		$dict_query = array('ch_id' => new MongoRegex("^$filterword/i"));

		$final_array = array();
		array_push($final_array, $chapter_query, $text_query, $act_query, $dict_query);
		return $final_array;
	}


//Function: fileTypeQuery
//
//		Input: n/a (It receives info from GET requests)
//		Return: Array of documents that matches search array by file type

	function fileTypeQuery()
	{
		// $mediatype = "";
		// if(isset($_GET["ft"]) && $_GET["ft"] != '')
		// {
		// 	$mediatype = $_GET["ft"];
		// }
		// else
		// {
		// 	$final_array = array();
		// 	return array_push($final_array, array());
		// }

		// $final_array = array();
		// array_push($final_array, array('ft' => new MongoRegex("^$mediatype/i")));

		// return $final_array;



		$mediatype = "";
		$combo = false;
		if($_GET["image"] === 'true')
		{
			$mediatype .= "(gif|jpg|png|pdf)";
			$combo = true;
		}
		if($_GET["video"] === 'true')
		{
			//Match any grade, 1-8
			if($combo)
			{
				$mediatype .="|";
			}
			$mediatype .= "(mov|mp4|mp5|gif)";
			$combo = true;

		}
		if($_GET["audio"] === 'true')
		{
			if($combo)
			{
				$mediatype .="|";
			}
			$mediatype .= "(mp3)";
			$combo = true;
		}
		if($_GET["misc"] === 'true')
		{
			if($combo)
			{
				$mediatype .="|";
			}
			$mediatype .= "(EP|html)";
			$combo = true;
		}
		if ($mediatype == "")
		{
			$final_array = array();
			return array_push($final_array, array());
		}

		$final_array = array();
		array_push($final_array, array('ft' => new MongoRegex("^$mediatype/i")));

		return $final_array;


	}


//Function: queryMongo
//
//		Input: Array of search values
//		Return: Array of documents that matches search array
	function queryMongo($searchArray) {
		global $activities, $textbooks, $dictionary, $chapters, $timelines;

		$chapter_cursor = $chapters->find($searchArray);
		$textbook_cursor = $textbooks->find($searchArray);
		$activities_cursor = $activities->find($searchArray);
		$dictionary_cursor = $dictionary->find($searchArray);

		$docArrays = array();
		$chapterArray = array();
		$textbookArray = array();
		$actArray = array();
		$dictArray = array();
		// $i = 0;

		foreach($chapter_cursor as $doc) {
			if(isset($doc)) {
				array_push($chapterArray, $doc);
				// $chapterArray[] = $doc;
				// echo ("ADDINGCHAPTER!!!");
				// echo json_encode($chapterArray);
			}
		}
		foreach($textbook_cursor as $doc) {
			if(isset($doc)) {
				array_push($textbookArray, $doc);
				// echo ("textbooks");
			}
		}
		foreach($activities_cursor as $doc) {
			if(isset($doc)) {
				array_push($actArray, $doc);
			}
		}
		foreach($dictionary_cursor as $doc) {
			if(isset($doc)) {
				array_push($dictArray, $doc);
			}
		}


		// foreach($activities_cursor as $doc)
		// {
		// 	if(isset($doc))
		// 	{
		// 		$actArray[$i] = $doc;
		// 		// echo json_encode($doc);
		// 		$i++;
		// 	}
		// }
		// $i = 0;
		// foreach($dictionary_cursor as $doc)
		// {
		// 	if(isset($doc))
		// 	{
		// 		$dictArray[$i] = $doc;
		// 		// echo json_encode($doc);
		// 		$i++;
		// 	}
		// }
		// $i = 0;
		// foreach($textbook_cursor as $doc)
		// {
		// 	if(isset($doc))
		// 	{
		// 		$textbookArray[$i] = $doc;
		// 		//echo json_encode($doc);
		// 		$i++;
		// 	}
		// }
		// $i = 0;
		// foreach($chapter_cursor as $doc)
		// {
		// 	if(isset($doc))
		// 	{
		// 		$chapterArray[$i] = $doc;
		// 		//echo json_encode($doc);
		// 		$i++;
		// 	}
		// }
		// $docArrays[] =
		// echo json_encode($docArrays);
		array_push($docArrays, $chapterArray, $textbookArray, $actArray, $dictArray);	// This is an array of arrays
		// echo json_encode($chapterArray);
		return $docArrays;
	}



?>
