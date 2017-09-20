<?php
header("Access-Control-Allow-Origin: *\n");
$page_title = 'Looma';

/**
*Name: Justin Cardozo, skip
*Email: justin.cardozo@menloschool.org
*Owner: VillageTech Solutions (villagetechsolutions.org)
*Date: 2015 03, 2017 08
*Revision: 2.1
* for Looma 3.0
*File: looma-dictionary-utilities.php
*/

/**
*called by AJAX
*		sample call (jQuery):
*			   $.getJSON("looma-dictionary.php", {"cmd":"lookup", "word": word}, function(result) {wordObj = result;});
*		supports commands: lookup [look up a word in the dictionary]
*				           add    [add a word and definition to the dict]
*				           random [return a list of randomly selected words, e.g. for a game]
*		LOOKUP: returns a JSON object {en:"word", np:"nepaliword", defn:"definition", img: "filename of picture"}
*				other properties (phonetic, useinsentence, partofspeech, hom, ant, syn) to be added later
*		ADD:    takes a JSON object {en:"word", np:"nepaliword", defn:"definition", img: "filename of picture"}
*				validates properties and inserts the word in the database
*				and returns success: TRUE or FALSE
*		LIST: takes an object {class, subject, [ch_id], [count], [boolean]} and returns an array of english words
*				matching the filter criteria,
*				length=count and randomized if boolean=true
*/
include ('includes/mongo-connect.php');

$DEFAULT_NUM = 25;
$MAX_NUM = 250;

if (isset($_GET["cmd"]))
{
	$cmd = $_GET["cmd"];
	switch ($cmd)
	{

    ////////////////////////////
    ////// command LOOKUP   ////
    ////////////////////////////

    case "lookup":
		// lookup $_GET["word"] in the dictionary and return an object describing the word
		if(isset($_GET["word"]))
		{   $englishWord = trim($_GET["word"]);

			$query = array('en' => new MongoRegex("/^$englishWord$/i"));  //NOTE: using regex to do a case insensitive search for the word
			$word = $dictionary_collection -> findOne($query);

            if (! $word) {  // if the WORD is not found, see if it is a PLURAL
                $query = array('plural' => new MongoRegex("/^$englishWord$/i"));  //NOTE: using regex to do a case insensitive search for the word
                $word = $dictionary_collection -> findOne($query);
                if ($word) {
                    $word['part'] = 'Plural of noun: ' . $word['en'];
                    $word['en'] = $word['plural'];
                }
            }

			if($word != null)
			{   //Add fields with blanks to avoid errors on code that receives words
				if(!array_key_exists('np', $word))    $word['np'] = '';
				if(!array_key_exists('en', $word))    $word['en'] = '';
				if(!array_key_exists('rw', $word))    $word['rw'] = '';
				if(!array_key_exists('part', $word))  $word['part'] = '';
				if(!array_key_exists('def', $word))   $word['def'] = '';
				if(!array_key_exists('phon', $word))  $word['phon'] = '';
				if(!array_key_exists('img', $word))   $word['img'] = '';
				if(!array_key_exists('ch_id', $word)) $word['ch_id'] = '';
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
		exit(); //end LOOKUP cmd

    ////////////////////////////
    ////// command ADD   //////
    ////////////////////////////

    case "add":
		// add a word to the dictionary using the object passed in, return T/F for success
		// add a word only if it contains at the very least an english and nepali form of the word
		if(isset($_GET["en"]) && isset($_GET["np"]))
		{
			$en = $_GET["en"];
			$np = $_GET["np"];
			$dictionary_collection -> insert(array('en' => $en, 'np' => $np));
			if(isset($_GET["ch_id"]))
			{
				$ch_id = $_GET["ch_id"];
				$newdata = array('$set' => array("ch_id" => "$ch_id"));
				$dictionary_collection->update(array('en' => $en, 'np' => $np), $newdata);
			}
			if(isset($_GET["def"]))
			{
				$def = $_GET["def"];
				$newdata = array('$set' => array("def" => "$def"));
				$dictionary_collection->update(array('en' => $en, 'np' => $np), $newdata);
			}
			if(isset($_GET["phon"]))
			{
				$phon = $_GET["phon"];
				$newdata = array('$set' => array("phon" => "$phon"));
				$dictionary_collection->update(array('en' => $en, 'np' => $np), $newdata);
			}
			$random = (float)rand()/(float)getrandmax();
			$newdata = array('$set' => array("rand" => $random));
			$dictionary_collection->update(array('en' => $en, 'np' => $np), $newdata);

			$word = $dictionary_collection->findOne(array('en' => $en, 'np' => $np));
			echo "true";
			exit();
		}
		else
		{
			echo "false";
			exit();
		};  // end ADD cmd

    ////////////////////////////
	////// command LIST   //////
	////////////////////////////

	case "list":
		// given "class", "subj" OR "ch_id" and [optionally] "count" and "random" (boolean),
		// return an array of 'count' words that match class&subj or ch_id

		$random =   (isset($_GET["random"])? ($_GET["random"] == "true") : true);

        $maxCount = (isset($_GET["count"]) ? min(max(0,$_GET['count']),$MAX_NUM) : $DEFAULT_NUM);

		$classes = array('class1','class2','class3','class4','class5','class6','class7','class8');
		$subjects = array('english','math','social studies','science');

		//Ensure that classes and subjects sent are valid types
		$hasClass = false;
		if(isset($_GET["class"]))
			if($_GET["class"] != ""   && in_array($_GET["class"],   $classes)) $hasClass = true;

		$hasSubject = false;
		if(isset($_GET["subject"]))
			if($_GET["subject"] != "" && in_array($_GET["subject"], $subjects)) $hasSubject = true;

		//Tests to see if the parameter ch_id has been set, if it has been set and is valid it will override class and subject parameters
		$hasValidChapterId = false;
		if(isset($_GET["ch_id"]))
		{
			$ch_id = $_GET["ch_id"];
			if(preg_match("/^[1-8](EN|S|M|SS|N)[0-9]{2}(\.[0-9]{2})?$/", $ch_id))
				$hasValidChapterId = true;
		}

		//Queries on chapter id if present, then either class or subject if necessary, else just give random words
		$hasChapterId = true;
		if($hasValidChapterId) 	$startChapterId = $_GET["ch_id"];
		else if($hasClass && $hasSubject)
		{
			$class = $_GET["class"];
			$subject = $_GET["subject"];
			//Gets the Class Number from the Class parameter
			$startChapterId = substr($class, 5);
			//Generates the Letter Abbreviation for the class and adds it to the number
			if($subject == "english")      $startChapterId .= "EN";
			else if($subject == "science") $startChapterId .= "S[0-9]";
			else if($subject == "math")    $startChapterId .= "M";
			else if($subject == "social studies")	$startChapterId .= "SS";
		}
		else if($hasClass)
		{
			//Handles providing words if only a class is provided
			$class = $_GET["class"];
			$startChapterId = substr($class, 5);
		}
		else if($hasSubject)
		{
			//Handles providing words if only a subject is provided
			$startChapterId = "[1-8]";
			$subject = $_GET["subject"];
			     if($subject == "english")  $startChapterId .= "EN";
			else if($subject == "science")  $startChapterId .= "S[0-9]";
			else if($subject == "math") 	$startChapterId .= "M";
			else if($subject == "social studies") $startChapterId .= "SS";
		}
		else
		{
			//Handles providing words if neither a class or subject is provided
			$startChapterId = "";
			$hasChapterId = false;
		}

		//If count is set then they have specified they want a certain number of words
		//If not we return all results that match
		//Ensures that we never send more than $MAX_NUM records

		//echo "random: $random, startChapterId: $startChapterId"; //DEBUG

		if($random)
		{
            // Should rewrite this to use $sample [mongo3.2 and later]

			// Uses fields within the dictionary called rand to get a random document
			$list = array();
            $count = 0;
			$tries = 0;
			while ($count < $maxCount && $tries < 2 * $maxCount)
			//don't increment $count when a duplicate is found (and discarded), but count $tries to be sure the WHILE terminates
			{
				//$newWord = null;
				$value = (float)rand()/(float)getrandmax();

                //echo 'random value is: ' . $value;

				//Manages searches to work with randomization
			if($hasChapterId)
				{
					$query = array('rand' => array('$gt' => $value), 'ch_id' => array('$regex' => new MongoRegex("/^$startChapterId/i")));
					$newWord = $dictionary_collection -> findOne($query);
					//A test in case we generate a number that is too high

                    //echo "count is " . $count . ", and newword is " . $newWord;

                    if(!$newWord)
					{
						$query = array('rand' => array('$lt' => $value), 'ch_id' => array('$regex' => new MongoRegex("/^$startChapterId/i")));
						$newWord = $dictionary_collection -> findOne($query);
					}
				}
				else
				{
					$query = array('rand' => array('$gt' => $value));
					$newWord = $dictionary_collection -> findOne($query);
					//A test in case we generate a number that is too high
					if(!$newWord)
					{
						$query = array('rand' => array('$lt' => $value));
						$newWord = $dictionary_collection -> findOne($query);
					}
				}

				if (($newWord) &&
				    array_key_exists('en', $newWord) &&
				    ! in_array($newWord['en'], $list))
				    {
				        $count += 1;
				        array_push($list, $newWord['en']);
				    }
                $tries += 1;
			}

//echo "count: $count, maxCount: $maxCount, list:";
//for ($i=0;$i<count($list);$i++) echo $list[$i];
		}
		else  //not RANDOM list
		{
			//Just return the list in the order they appear in the database
			$list = array();
			if($hasChapterId)
			{
				$query = array('ch_id' => array('$regex' => new MongoRegex("/^$startChapterId/i")));
				$words = $dictionary_collection -> find($query);
			}
			else
			{
				$words = $dictionary_collection -> find();
			}
			$words->limit($maxCount);
			$words = iterator_to_array($words);
			foreach ($words as $newWord)
			    if (array_key_exists('en', $newWord)) array_push($list, $newWord['en']);
		}
		$list = json_encode($list) . "\n";
		echo $list;
		exit(); //end LIST cmd
	default:
		echo "looma illegal command";
		exit(); //end ILLEGAL CMD
	} //end CASE
} //end ISSET
?>
