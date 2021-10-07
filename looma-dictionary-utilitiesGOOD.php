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
 *		LOOKUP: looks up $_GET['word'] to match 'en' filed in dictionary and
 * 				 returns a JSON object {en:"word", np:"nepaliword", defn:"definition", img: "filename of picture"}
 *				other properties (phonetic, useinsentence, partofspeech, hom, ant, syn) to be added later
 *		REVERSELOOKUP: looks up $_GET['word'] to match 'np' field in dictionary and
 * 				returns a JSON object {en:"word", np:"nepaliword", defn:"definition", img: "filename of picture"}
 *				other properties (phonetic, useinsentence, partofspeech, hom, ant, syn) to be added later
 *		ADD:    takes a JSON object {en:"word", np:"nepaliword", defn:"definition", img: "filename of picture"}
 *				validates properties and inserts the word in the database
 *				and returns success: TRUE or FALSE
 *		LIST: takes an object {class, subject, [ch_id], [count], [boolean]} and returns an array of english words
 *				matching the filter criteria,
 *				length=count and randomized if boolean=true
 */
include ('includes/mongo-connect.php');
function keyIsSet($key, $array) { return isset($array[$key]);} //compatibility shiv for php 5.x "keyIsSet()"

$DEFAULT_NUM = 25;
$MAX_NUM = 250;

if (isset($_GET["cmd"]))
{
    // accepted CMDs are 'lookup', 'add', 'list'

    $cmd = $_GET["cmd"];
    switch ($cmd)
    {

////////////////////////////
////// command LOOKUP   ////
////////////////////////////

        case "lookup":
            // lookup $_GET["word"] in the dictionary and return an object describing the word
            if(isset($_GET["word"]) && $_GET["word"] != "")
            {   $englishWord = trim($_GET["word"]);

                $query = array('en' => mongoRegexOptions("^$englishWord$",'i'));  //NOTE: using regex to do a case insensitive search for the word
                //$word = $dictionary_collection -> findOne($query);
                $word = mongoFindOne($dictionary_collection, $query);

                if (! $word) {  // if the WORD is not found, see if it is a PLURAL
                    $query = array('plural' => mongoRegexOptions("^$englishWord$",'i'));  //NOTE: using regex to do a case insensitive search for the word
                    $word = mongoFindOne($dictionary_collection, $query);
                    if ($word) {
                        $word['part'] = 'Plural of noun: ' . $word['en'];
                        //$word['img'] = $word['en'];
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
                    //if(!keyIsSet('phon', $word))  $word['phon'] = '';
                    //if(!keyIsSet('img', $word))   $word['img'] = '';
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
            exit(); //end LOOKUP cmd


////////////////////////////
////// command REVERSELOOKUP   ////
////////////////////////////

        case "reverselookup":
            // lookup $_GET["word"] in the dictionary and return an object describing the word
            if(isset($_GET["word"]) && $_GET["word"] != "")
            {   $nativeWord = trim($_GET["word"]);

                $query = array('np' => mongoRegexOptions("^$nativeWord$",'i'));  //NOTE: using regex to do a case insensitive search for the word
                //$word = $dictionary_collection -> findOne($query);
                $word = mongoFindOne($dictionary_collection, $query);

                if($word != null)
                {   //Add fields with blanks to avoid errors on code that receives words

                    if (file_exists('../content/dictionary images/' . $word['en'] . '.jpg')) $word['img'] = $word['en'];


                    if(!keyIsSet('np', $word))    $word['np'] = '';
                    if(!keyIsSet('en', $word))    $word['en'] = '';
                    if(!keyIsSet('rw', $word))    $word['rw'] = '';
                    if(!keyIsSet('part', $word))  $word['part'] = '';
                    if(!keyIsSet('def', $word))   $word['def'] = '';
                    if(!keyIsSet('phon', $word))  $word['phon'] = '';
                    //if(!keyIsSet('img', $word))   $word['img'] = '';
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
            exit(); //end reverseLOOKUP cmd////////////////////////////
////// command ADD   //////
////////////////////////////

        case "add":
            // add a word to the dictionary using the object passed in, return T/F for success
            // add a word only if it contains at the very least an english and nepali form of the word
            if(isset($_GET["en"]) && isset($_GET["np"]))
            {
                $en = $_GET["en"];
                $np = $_GET["np"];
                //$dictionary_collection -> insert(array('en' => $en, 'np' => $np));
                mongoInsert($dictionary_collection, array('en' => $en, 'np' => $np));
                if(isset($_GET["ch_id"]))
                {
                    $ch_id = $_GET["ch_id"];
                    $newdata = array('$set' => array("ch_id" => "$ch_id"));
                    //$dictionary_collection->update(array('en' => $en, 'np' => $np), $newdata);
                    mongoUpdate($dictionary_collection, array('en' => $en, 'np' => $np), $newdata);
                }
                if(isset($_GET["def"]))
                {
                    $def = $_GET["def"];
                    $newdata = array('$set' => array("def" => "$def"));
                    //$dictionary_collection->update(array('en' => $en, 'np' => $np), $newdata);
                    mongoUpdate($dictionary_collection, array('en' => $en, 'np' => $np), $newdata);
                }
                if(isset($_GET["part"]))
                {
                    $part = $_GET["part"];
                    $newdata = array('$set' => array("part" => "$part"));
                    //$dictionary_collection->update(array('en' => $en, 'np' => $np), $newdata);
                    mongoUpdate($dictionary_collection, array('en' => $en, 'np' => $np), $newdata);
                }
                $random = (float)rand()/(float)getrandmax();
                $newdata = array('$set' => array("rand" => $random));
                //$dictionary_collection->update(array('en' => $en, 'np' => $np), $newdata);
                mongoUpdate($dictionary_collection, array('en' => $en, 'np' => $np), $newdata);

                //$word = $dictionary_collection->findOne(array('en' => $en, 'np' => $np));
                $word = mongoFindOne($dictionary_collection, array('en' => $en, 'np' => $np));
                echo "true";
                exit();
            }
            else
            {
                echo "false";
                exit();
            }  // end ADD cmd

////////////////////////////
////// command LIST   //////
////////////////////////////

        case "list":
            // given "class", "subj" OR "ch_id" and [optionally] "count" and "random" (boolean),
            // return an array of 'count' words that match class&subj or ch_id

            $random =       (isset($_GET["random"])?       ($_GET["random"]       == "true") : false);
            $picturesonly = (isset($_GET["picturesonly"])? ($_GET["picturesonly"] == "true") : false);

            $maxCount = (isset($_GET["count"]) ? min(max(0,$_GET['count']),$MAX_NUM) : $DEFAULT_NUM);

            $classes = array('class1','class2','class3','class4','class5','class6','class7','class8', 'class9', 'class10');
            $subjects = array('english','math','social studies','science', 'health', 'vocation');

            //Ensure that classes and subjects sent are valid types
            $hasClass =   isset($_GET["class"])   && in_array($_GET["class"],   $classes);
            $hasSubject = isset($_GET["subject"]) && in_array($_GET["subject"], $subjects);

            //Tests to see if the parameter ch_id has been set, if it has been set and is valid it will override class and subject parameters

            if(isset($_GET["ch_id"])) {
                $ch_id = $_GET["ch_id"];
                $hasValidChapterId =(preg_match("/^([1-9]|10)(EN|S|M|SS|N|H|V)[0-9]{2}(\.[0-9]{2})?$/", $ch_id));
            } else $hasValidChapterId = false;

            //Queries on chapter id if present, then either class or subject if necessary, else just give random words
            if($hasValidChapterId) 	$startChapterId = $_GET["ch_id"];
            else if($hasClass && $hasSubject)
            {
                $hasChapterId = true;
                $class = $_GET["class"];
                $subject = $_GET["subject"];
                //Gets the Class Number from the Class parameter
                $startChapterId = substr($class, 5);
                //Generates the Letter Abbreviation for the class and adds it to the number
                if($subject == "english")      $startChapterId .= "EN";
                else if($subject == "science") $startChapterId .= "S[0-9]";
                else if($subject == "math")    $startChapterId .= "M";
                else if($subject == "health")    $startChapterId .= "H";
                else if($subject == "vocation")    $startChapterId .= "V";
                else if($subject == "social studies")	$startChapterId .= "SS";
            }
            else if($hasClass)
            {  //Handles providing words if only a class is provided
                $hasChapterId = true;
                $class = $_GET["class"];
                $startChapterId = substr($class, 5);
            }
            else if($hasSubject)
            {  //Handles providing words if only a subject is provided
                $hasChapterId = true;
                $startChapterId = "[1-8]";
                $subject = $_GET["subject"];
                if($subject == "english")  $startChapterId .= "EN";
                else if($subject == "science")  $startChapterId .= "S[0-9]";
                else if($subject == "math") 	$startChapterId .= "M";
                else if($subject == "health")    $startChapterId .= "H";
                else if($subject == "vocation")    $startChapterId .= "V";
                else if($subject == "social studies") $startChapterId .= "SS";
            }
            else
            {  //Handles providing words if neither a class or subject is provided
                $startChapterId = "";
                $hasChapterId = false;
            }

            $list = array();

            //if($random) {
            if(true) { //changed to always return random list (dicitonary is random anyway)
                if($hasChapterId) {
                    //$regex = mongoRegexOptions("^$startChapterId", "i");
                    $query = array('ch_id' => mongoRegexOptions("^$startChapterId",'i'));
                    //$regex = "^" . $startChapterId . "/i";
                    //$query = array('ch_id' => $regex);
                } else { $query = array();
                }
                $words = mongoFindRandom($dictionary_collection, $query, 100 * $maxCount);

                //echo 'found ' . sizeof($words) . ' words';

                $count = 0;
                foreach ($words as $newWord) {
                    //echo '  ++ ' . $newWord;
                    if (!$picturesonly || file_exists("../content/dictionary images/" . $newWord[en] . ".jpg")) {
                        array_push($list, $newWord);
                        $count++;
                        if ($count >= $maxCount) break;
                    }
                }
            }
            else  //changed above to never exec 'not random'
                /////////////////////// not RANDOM /////////////
            {  // not RANDOM
                //Just return the list in the order they appear in the database
                if($hasChapterId)
                {
                    $regex = mongoRegexOptions("^$startChapterId", "i");
                    $query = array('ch_id' => array('$regex' => $regex));
                } else {
                    $query = array();
                }
                $words = mongoFind($dictionary_collection, $query, null, null, $maxCount);

                foreach ($words as $newWord)
                    if ((!$picturesonly || file_exists("../content/dictionary images/" . $newWord['en'] . ".jpg")) &&
                        keyIsSet('en', $newWord)) array_push($list, $newWord['en']);
            } //end not random

            $list = json_encode($list);
            echo $list;
            exit(); //end LIST cmd

        default:
            echo "looma dictinary utilities illegal command";
            exit(); //end ILLEGAL CMD
    } //end CASE LIST
}
?>
