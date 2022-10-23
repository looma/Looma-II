<?php
header("Access-Control-Allow-Origin: *\n");
$page_title = 'Looma';

/**
 *Name: Justin Cardozo, skip, Charlotte
 *Email: justin.cardozo@menloschool.org
 *Owner: VillageTech Solutions (villagetechsolutions.org)
 *Date: 2015 03, 2017 08, 2021 07
 *Revision: 2.1
 * for Looma 3.0
 *File: looma-dictionary-utilities.php
 */

/**
 *called by AJAX
 *		sample call (jQuery):
 *			   $.getJSON("looma-dictionary.php", {"cmd":"lookup", "word": word}, function(result) {wordObj = result;});
 *		LOOKUP: looks up $_REQUEST['word'] to match 'en' filed in dictionary and
 * 				 returns a JSON object {en:"word", np:"nepaliword", defn:"definition", img: "filename of picture"}
 *				other properties (phonetic, useinsentence, partofspeech, hom, ant, syn) to be added later
 *		REVERSELOOKUP: looks up $_REQUEST['word'] to match 'np' field in dictionary and
 * 				returns a JSON object {en:"word", np:"nepaliword", defn:"definition", img: "filename of picture"}
 *				other properties (phonetic, useinsentence, partofspeech, hom, ant, syn) to be added later
 *		LIST: takes an object {class, subject, [ch_id], [count], [boolean]} and returns an array of english words
 *				matching the filter criteria,
 *				length=count and randomized if boolean=true
 *		ADD:    takes a JSON object {en:"word", np:"nepaliword", defn:"definition", img: "filename of picture"}
 *				validates properties and inserts the word in the database
 *				and returns success: TRUE or FALSE
 * 		DELETE: deletes the document corresponding to the word's ID
 * 		UPDATE: updates the document corresponding to the word's ID
 *
 */
include ('includes/mongo-connect.php');
function keyIsSet($key, $array) { return isset($array[$key]);} //compatibility shiv for php 5.x "keyIsSet()"

$DEFAULT_NUM = 25;
$MAX_NUM = 250;

if (isset($_REQUEST["cmd"])) {
	// accepted CMDs are 'lookup', 'reverselookup', 'list', 'add', 'delete', 'update'
	$cmd = $_REQUEST["cmd"];
	switch ($cmd) {

////////////////////////////
////// command LOOKUP   ////
////////////////////////////

	    // cmd = 'lookup', param 'word' = word to lookup
		case "lookup":
			// lookup $_REQUEST["word"] in the dictionary and return the dictionary document for the word
			if(isset($_REQUEST["word"]) && $_REQUEST["word"] != "")
			{   $englishWord = trim($_REQUEST["word"]);

				$query = array('en' => mongoRegexOptions("^$englishWord$",'i'));
				//NOTE: using regex to do a case insensitive search for the word
				$word = mongoFindOne($dictionary_collection, $query);

				if (! $word) {  // if the WORD is not found, see if it is a PLURAL
					$query = array('plural' => mongoRegexOptions("^$englishWord$",'i'));
					$word = mongoFindOne($dictionary_collection, $query);
					if ($word) {
						$word['part'] = 'Plural of noun: ' . $word['en'];
						$word['en'] = $word['plural'];
					}
				}
				if($word != null)
				{   //Add fields with blanks to avoid errors on code that receives words

					if (file_exists('../content/dictionary images/' . $word['en'] . '.jpg')) $word['img'] = $word['en'];

					if(!keyIsSet('np', $word))    $word['np'] = '';
					if(!keyIsSet('en', $word))    $word['en'] = '';
					if(!keyIsSet('rw', $word))    $word['rw'] = '';
					if(!keyIsSet('part', $word))  $word['part'] = '';
					if(!keyIsSet('def', $word))   $word['def'] = '';
					if(!keyIsSet('meanings', $word))   $word['meanings'] = '';
					if(!keyIsSet('ch_id', $word)) $word['ch_id'] = '';
					$word = json_encode($word);
					echo $word . "\n";  //probalby should/could remove "\n"
				}
				else
				{   $failed = array('en' => $englishWord,'np' => '', 'ch_id' => '', 'def' => 'Word not found','phon' => '','img' => '');
					$failed = json_encode($failed);
					echo "$failed";  // need to standardize PHP error returns -> {'error' : 'reason'}
				}
			}
			else
			{   $failed = array('en' => '','np' => '', 'ch_id' => '', 'def' => 'word not found','phon' => '','img' => '');
				$failed = json_encode($failed);
				echo "$failed";
			}
			exit(); //end LOOKUP cmd


////////////////////////////
/// command REVERSELOOKUP ///
////////////////////////////

		// cmd = 'reverselookup', param 'word' = Nepali word to lookup
		case "reverselookup":
			// lookup Nepali word in the dictionary and return an object describing the word
			if(isset($_REQUEST["word"]) && $_REQUEST["word"] != "")
			{   $nativeWord = trim($_REQUEST["word"]);

				$query = array('np' => mongoRegexOptions("^$nativeWord$",'i'));
				$word = mongoFindOne($dictionary_collection, $query);

				if($word != null)
				{   //Add fields with blanks to avoid errors on code that receives words

					if (file_exists('../content/dictionary images/' . $word['en'] . '.jpg')) $word['img'] = $word['en'];


					if(!keyIsSet('np', $word))    $word['np'] = '';
					if(!keyIsSet('en', $word))    $word['en'] = '';
					if(!keyIsSet('rw', $word))    $word['rw'] = '';
					if(!keyIsSet('part', $word))  $word['part'] = '';
					if(!keyIsSet('def', $word))   $word['def'] = '';
					if(!keyIsSet('meanings', $word))   $word['meanings'] = '';
					if(!keyIsSet('ch_id', $word)) $word['ch_id'] = '';
					$word = json_encode($word);
					echo $word . "\n";
				}
				else
				{   $failed = array('en' => $englishWord,'np' => '', 'ch_id' => '', 'def' => 'Word not found','phon' => '','img' => '');
					$failed = json_encode($failed);
					echo "$failed";
				}
			}
			else
			{   $failed = array('en' => '','np' => '', 'ch_id' => '', 'def' => 'word not found','phon' => '','img' => '');
				$failed = json_encode($failed);
				echo "$failed";
			}
			exit(); //end reverseLOOKUP cmd

////////////////////////////
////// command LIST   //////
////////////////////////////

		case "list":
			// cmd = "list"
			// params ["class" AND "subj"] OR ["ch_id"] and [optionally] "count" (default 25)
			//    and "picturesonly" (boolean, default FALSE)
			// return an array of 'count' words that match class&subj or ch_id

			$picturesonly = (isset($_REQUEST["picturesonly"]) &&
				             $_REQUEST["picturesonly"] === "true");

			$maxCount = (isset($_REQUEST["count"]) ?
				min(max(0,$_REQUEST['count']),$MAX_NUM) : $DEFAULT_NUM);

			$classes =  array('class1','class2','class3','class4','class5','class6',
							  'class7','class8', 'class9', 'class10', 'class11', 'class12');
			$subjects = array('english','english optional','math','math optional','social studies','moral education',
							  'science', 'science optional','nepali','serafera','health', 'vocation','computer');
			$prefixes['english'] = 'EN'; $prefixes['english optional'] = 'ENa'; $prefixes['math'] = 'M';
			$prefixes['math optional'] = 'Ma'; $prefixes['science'] = 'S'; $prefixes['science optional'] = 'Sa';
			$prefixes['serafero'] = 'SF'; $prefixes['nepali'] = 'N'; $prefixes['health'] = 'H';
			$prefixes['social studies'] = 'SS'; $prefixes['moral education'] = 'SSa';
			$prefixes['vocation'] = 'V'; $prefixes['computer'] = 'CS';

			// if the parameter ch_id has been set, if it has been set and is valid
			// it will override class and subject parameters

			$legalCH_IDregex = '/^([1-9]|10|11|12)(EN|ENa|Sa|S|SF|Ma|M|SSa|SS|N|H|V|CS)[0-9]{2}(\.[0-9]{2})?/';
			// NOTE: see looma-utilities.js for the latest ch_id regex

			if (isset($_REQUEST["ch_id"]) &&
				(preg_match($legalCH_IDregex, $_REQUEST["ch_id"]))) {
				$query_id = $_REQUEST["ch_id"];
				if (preg_match( '/\d+([a-zA-Z]+)\d/', $query_id,$matches))
					$prefix = $matches[1];
				else $prefix = "";
			} else {
				$class = isset($_REQUEST["class"]) && in_array($_REQUEST["class"], $classes) ? $_REQUEST['class'] : '';
				$class = substr($class, 5);
				$subject = isset($_REQUEST["subject"]) && in_array($_REQUEST["subject"], $subjects) ? $_REQUEST['subject'] : '';

				$query_id = $class . $prefixes[$subject];
				$prefix = $subject ? $prefixes[$subject] : '';
			};

			$list = array();

			$query = array("ch_id.$prefix" => mongoRegexOptions('^' . $query_id,'i'));

			//print_r($query);
			//exit();
//NOTE: to find dictionary entries with a given ch_id:
//   db.dictionaryV2.find({ch_id:{'EN':'1EN01.01'}},{_id:0,en:1})
//NOTE: to find dictionary entries with a ch_id regex:
//	db.dictionaryV2.find({'ch_id.EN':{$regex:/1EN01/}},{_id:0,en:1})

		if (!$picturesonly) {
			$words = mongoFindRandom($dictionary_collection, $query, (int) $maxCount);
			$count = 0;
			foreach ($words as $newWord) {
				array_push($list, $newWord);
				$count++;
				if ($count >= $maxCount) break;
			}
		} else {
			$words = mongoFindRandom($dictionary_collection, $query, 100 * $maxCount);
			$count = 0;
			foreach ($words as $newWord) {
				if (file_exists("../content/dictionary images/" . $newWord['en'] . ".jpg")) {
					array_push($list, $newWord);
					$count++;
					if ($count >= $maxCount) break;
				}
			}
		};

		$list = json_encode($list);
		echo $list;
		exit(); //end LIST cmd

	
////////////////////////////
////// command ADD   //////
////////////////////////////

		// cmd = "add"
		// params = "en", "np", [ch_id, def, meanings, part]
		// create new dictionary entry - return "true" or "false"
		case "add":
			// add a word to the dictionary using the object passed in, return T/F for success
			// add a word only if it contains at the very least an english and nepali form of the word
			if(isset($_REQUEST["en"]) && isset($_REQUEST["np"]))
			{
				$en = $_REQUEST["en"];
				$np = $_REQUEST["np"];
				mongoInsert($dictionary_collection, array('en' => $en, 'np' => $np));
				if(isset($_REQUEST["ch_id"]))
				{
					$ch_id = $_REQUEST["ch_id"];
					$newdata = array('$set' => array("ch_id" => "$ch_id"));
					mongoUpdate($dictionary_collection, array('en' => $en, 'np' => $np), $newdata);
				}
				if(isset($_REQUEST["def"]))
				{
					$def = $_REQUEST["def"];
					$newdata = array('$set' => array("def" => "$def"));
					mongoUpdate($dictionary_collection, array('en' => $en, 'np' => $np), $newdata);
				}
				if(isset($_REQUEST["meanings"]))
				{
					$meanings = $_REQUEST["meanings"];
					$newdata = array('meanings' => $meanings);
					mongoUpdate($dictionary_collection, array('en' => $en, 'np' => $np), $newdata);
				}
				if(isset($_REQUEST["part"]))
				{
					$part = $_REQUEST["part"];
					$newdata = array('$set' => array("part" => "$part"));
					mongoUpdate($dictionary_collection, array('en' => $en, 'np' => $np), $newdata);
				}

				$word = mongoFindOne($dictionary_collection, array('en' => $en, 'np' => $np));
				echo "true";
				exit();
			}
			else
			{ echo "false"; exit();
			}  // end ADD cmd


////////////////////////////
////// command DELETE   ////
////////////////////////////

		// cmd = "delete"
		// param "wordID"
		case "delete":
			if(isset($_REQUEST["wordID"])) {
				$id = mongoId($_REQUEST["wordID"]);
				mongoDeleteOne($dictionary_collection, array('_id' => $id));
				echo "deleted";
			} else {
				echo "no word ID given";
			};
			exit();


////////////////////////////
////// command UPDATE   ////
////////////////////////////

		// cmd = "update"
		// params "wordID", wordEn, meanings and optionally "np", "def", "part", "root", "plural", "ch_id"
		//    any parameter that is NOT specified will be UNSET (deleted) from the dictionary entry
		case "update":
			if(isset($_REQUEST["wordID"]))
			{
				if ($_REQUEST["wordID"] == "newentry") $id = "newentry";
				else $id = mongoId($_REQUEST["wordID"]);

				$updates = [];
				$empty = [];

				$updates['en'] = $_REQUEST["wordEn"];
				$updates['meanings'] = $_REQUEST["meanings"];

				if (isset($_REQUEST["wordDef"]) && $_REQUEST["wordDef"] !== "") {
					$updates['def'] = $_REQUEST["wordDef"];
				}
				else {
					$empty['def'] = $_REQUEST["wordDef"];
				}


				if (isset($_REQUEST["wordPart"]) && $_REQUEST["wordPart"] !== "") {
					$updates['part'] = $_REQUEST["wordPart"];
				}
				else {
					$empty['np'] = $_REQUEST["wordNp"];
				}
				if (isset($_REQUEST["wordNp"]) && $_REQUEST["wordNp"] !== "") {
					$updates['np'] = $_REQUEST["wordNp"];
				}
				else {
					$empty['np'] = $_REQUEST["wordNp"];
				}

				if (isset($_REQUEST["wordPlural"]) && $_REQUEST["wordPlural"] !== "") {
					$updates['plural'] = $_REQUEST["wordPlural"];
				}
				else {
					$empty['plural'] = $_REQUEST["wordPlural"];
				}

				if (isset($_REQUEST["wordRw"]) && $_REQUEST["wordRw"] !== "") {
					$updates['rw'] = $_REQUEST["wordRw"];
				}
				else {
					$empty['rw'] = $_REQUEST["wordRw"];
				}

				if (isset($_REQUEST["wordCh_id"]) && $_REQUEST["wordCh_id"] !== "") {
					$updates['ch_id'] = $_REQUEST["wordCh_id"];
				}
				else {
					$empty['ch_id'] = $_REQUEST["wordCh_id"];
				}

				if ($id == "newentry") { // indicating new entry
					mongoInsert($dictionary_collection, $updates);
				}
				else {
					$filter = ['_id' => $id];
					mongoUpdate($dictionary_collection, $filter, ['$set' => $updates]);
					if ($empty !== []) {
						mongoUpdate($dictionary_collection, $filter, ['$unset' => $empty]);
					}
				}

				echo "true";
				exit();
			}
			else
			{
				echo "false";
				exit();
			}

		default:
			echo "looma dictinary utilities illegal command";
			exit(); //end ILLEGAL CMD
	} //end CASE LIST
}
?>
