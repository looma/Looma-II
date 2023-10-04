<?php
//Name: Skip
//
//Owner: Looma Education Company
//Date: 2015 03, 2020 07
//Revision: Looma 6.0.0
//File: includes/mongo-connect.php
//Description:  for Looma v6

/*
 FUNCTIONS
    mongoRegex
    mongoRegexOptions
    mongoId
    mongoGetId
    mongoCount
    CEHRDfilter
    mongoFind
    mongoFindOne
    mongoFindRandom
    mongoDistinct
    mongoFindAndModify (protected)
    mongoInsert (protected)
    mongoUpsert (protected)
    mongoUpdateMany (protected)
    mongoUpdate (protected)
    mongoDeleteOne (protected)
    mongoDeleteMany (protected)
    mongoCreateIndex (protected)
    mongoCreateUniqueIndex (protected)

 */
require_once('includes/looma-isloggedin.php');

global $ENV_WINDOWS;

function mongoRegex ($pattern) { // $pattern is a string, like '^\d[a-z]'\
    // NOTE: input $pattern DOSS NOT include '/'s, they are inserted by this function
    global $mongo_level;
    if ($mongo_level >= 3)
        return new MongoDB\BSON\Regex($pattern);
    else return new MongoRegex('/' . $pattern . '/');
}

function mongoRegexOptions($pattern, $options) {
    global $mongo_level;
    if ($mongo_level >= 3)
        return new MongoDB\BSON\Regex($pattern,$options);
    else return new MongoRegex('/' . $pattern . '/' . $options);
}

//NOTE: should "try" MongoId() and return null if it fails
function mongoId ($id) {  //$id is a string, RETURN a mongoId object
    global $mongo_level;
    if ($mongo_level >= 3)
        return new MongoDB\BSON\ObjectId($id);
    else return new MongoId($id);
}

function mongoGetId ($doc) { // $doc is a document returned by mongoinsert or similar
    // return the STRING value of the ID of $doc
    global $mongo_level;
    if ($mongo_level >= 3)
        return (string) $doc->getInsertedId();
    else return (string) $doc['_id'];
}

function mongoCount($collection) {
    global $mongo_level;
    if ($mongo_level >= 3) {
        $count = $collection->count();
    } else {  // old mongoDB
        $count = $collection->count( );
    }
    return $count;
}

function CEHRDfilter($filter) {

    // NOTE: for the CEHRD Learning Portal, there are files in ../content/CEHRD
    //       that are not on regular loomas. These files are filtered here so that
    //       the database of activities can be the same for CEHRD portal and regular Loomas

    global $LOOMA_SERVER;
    if ($LOOMA_SERVER !== "CEHRD")
         $filter['fp'] = array('$not' => mongoRegex("^\.\.\/content\/CEHRD"));
    return $filter;
}

function mongoFind($collection, $filter, $sort, $skip, $limit) {

    // $auery, $sort, $skip, and $limit may be null
    global $mongo_level, $activities_collection;

    if ($collection === $activities_collection) $filter = CEHRDfilter($filter);

    if ($mongo_level >= 3) {
        $options = [];
        if ($sort) $options['sort'] = [ $sort => 1 ];
        if ($skip) $options['skip'] = $skip;
        if ($limit) $options['limit'] = $limit;
        $cursor = $collection->find( $filter, $options );
    } else {  // old mongoDB
        $cursor = $collection->find( $filter );
        if ($sort) $cursor->sort([ $sort => 1 ]);
        if ($skip) $cursor->skip($skip);
        if ($limit) $cursor->limit($limit);
        //$cursor->sort(array($sort => 1))->skip($skip)->limit($limit);
    }
    return $cursor;
}

function mongoFindOne($collection, $filter) {
    global $mongo_level, $activities_collection;

    if ($collection === $activities_collection) $filter = CEHRDfilter($filter);

    $doc = $collection->findOne( $filter );
    return $doc;
}

function mongoFindRandom($collection, $filter, $count) {
    // for use by looma-dictionary.php CMD = LIST
    //returns a randomized set, size $count, of english words from the dictionary
    global $mongo_level;
    if ($mongo_level >= 3) {
        $cursor = $collection -> aggregate([
                array('$match' =>  (object) $filter),
                array('$sample' => array( 'size' => $count))]);
    } else {  // old mongoDB, mongo_level 2 or 3
        $cursor = $collection->find( $filter );
    };

    $temp = [];
    $cursorArray = iterator_to_array($cursor);
    foreach ($cursorArray as $key => $doc) $temp[]=$doc;

    if ($mongo_level >= 3) //already randomly sampled by mongo
        return $temp;
    else {                 //extract a random sample
        $list = [];
        $number = sizeof($cursorArray);
        if ($number >= 1) for ($i = 0;$i < min($count,$number); $i++) {
            array_push($list,$temp[mt_rand(0,$number-1)]);
        };
        //echo '$number is ' . $number . ', and $list size is ' . sizeof($list);
        return $list;
    }
}

function mongoDistinct($collection, $key) {
    global $mongo_level;
    $array = $collection->distinct( $key );
    return $array;
}

function mongoFindAndModify($collection, $filter, $set) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    if ($mongo_level >= 3 ) {
        $options = array("upsert"=>true, "returnDocument"=>MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER);
        $doc = $collection->findOneAndUpdate( $filter, $set, $options);
    }
    else {
        $options = array("upsert"=>true, "new"=>true);
        $doc = $collection->findAndModify($filter, $set, [], $options);
    }
    return $doc;
}

function mongoInsert($collection, $doc) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    if ($mongo_level >= 3 ) $doc = $collection->insertOne( $doc);
        else                $doc = $collection->insert($doc);
    return $doc;
}

function mongoUpsert($collection, $filter, $insert) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    if ($mongo_level >= 3 ) $doc = $collection->updateOne($filter, array('$set' => $insert), array('upsert' => true));
    else                    $doc = $collection->update($filter, $insert, array('upsert' => true));
    return $doc;
}

function mongoUpdateMany($collection, $filter, $set) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    if ($mongo_level >= 3 ) {
        $options = array("upsert" => true);
        $result = $collection->updateMany($filter, $set, $options);
    }
    else {
        $options = array("upsert" => true, "multiple" => true);
        $result = $collection->update($filter, $set, $options);
    }
    return $result;
}

function mongoUpdate($collection, $filter, $set) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    if ($mongo_level >= 3 ) $result = $collection->updateOne( $filter, $set);
    else                    $result = $collection->update($filter, $set);
    return $result;
}

function mongoDeleteOne($collection, $filter) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    if ($mongo_level >= 3 ) $result = $collection->deleteOne( $filter);
    else                    $result = $collection->remove($filter, array('justone'=> true));
    return $result;
}

function mongoDeleteMany($collection, $filter) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    if ($mongo_level >= 3 )  $result = $collection->deleteMany($filter);
    else                     $result = $collection->remove($filter, array('justone'=> false));
    return $result;
}

function mongoCreateIndex($collection, $key) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    $doc = $collection->createIndex($collection, $key);
    return $doc;
}

function mongoCreateUniqueIndex($collection, $key) {
    global $mongo_level, $logcollections;
    if (!loggedIn() && !in_array($collection, $logcollections)  ) return null;
    $doc = $collection->createIndex($collection, $key, array('unique'=>true));
    return $doc;
}


if ($ENV_WINDOWS) {  // running on windows
    $try = shell_exec('C:\xampp\bin\mongod --version');
    if ($try) preg_match('/(\d\.\d\.\d)/',$try, $match);
    else $match = null;
} else {  // running on linux
    $try = shell_exec('mongo --version');
    if ($try) preg_match('/(\d\.\d\.\d)/', $try, $match);
    else $match = null;
}

if ($match) {
    $mongo_version = $match[1];
    $mongo_level = intval(substr($mongo_version,0,1));
} else {
    $mongo_version = '4.4.3';
    $mongo_level = 4;
}

$dbhost = 'localhost';
$dbname = 'looma';

try {
    if ($mongo_level >= 3) {
        require_once('vendor/autoload.php');
        $mongoClient = new MongoDB\Client("mongodb://localhost:27017");
    } else {  //old mongo is running
        $mongoClient = new MongoClient("mongodb://localhost:27017");    //make a new mongo client object
    }
}
catch(MongoConnectionException $e) {
    echo "MongoConnectError connecting to MongoDB. Make sure MongoDB is running";
    exit();
}

$dbhost = 'localhost';
$dbname = 'looma';

//use below FORMAT for PHP later than 5.5??
//$m = new MongoDB\Driver\Manager("mongodb://localhost:27017");
$loomaDB = $mongoClient -> $dbname;  //connect to the database "looma"
//make query variables for all collections
$activities_collection = $loomaDB -> activities;
$tags_collection       = $loomaDB -> tags;
$chapters_collection   = $loomaDB -> chapters;
$textbooks_collection  = $loomaDB -> textbooks;
$dictionary_collection = $loomaDB -> dictionary;
$history_collection    = $loomaDB -> histories;
$histories_collection  = $loomaDB -> histories;
$slideshows_collection = $loomaDB -> slideshows;
$text_files_collection = $loomaDB -> text_files;
$lessons_collection    = $loomaDB -> lessons;
$maps_collection       = $loomaDB -> maps;
$games_collection      = $loomaDB -> games;
$folders_collection    = $loomaDB -> folders;
$edited_videos_collection = $loomaDB -> edited_videos;
$volunteers_collection = $loomaDB -> volunteers;
$new_content_collection = $loomaDB -> new_content;
$recorded_videos_collection = $loomaDB -> recorded_videos;  // for future webcam recordings
$chapterIDs_collection = $loomaDB -> chapterIDs;  // for dictionary building

$logname = 'activitylog';
$logDB = $mongoClient -> $logname;  //connect to the database "activitylog" for logging user activity

//make query variables for all collections
$users_collection      = $logDB -> users;
$hours_collection      = $logDB -> hours;
$days_collection       = $logDB -> days;
$weeks_collection      = $logDB -> weeks;
$months_collection     = $logDB -> months;
$pages_collection      = $logDB -> pages;
$filetypes_collection  = $logDB -> filetypes;

$userdbname = 'loomausers';
$userdbname = $mongoClient -> $userdbname;  //connect to the database "loomausers" (for storing logins)
$logins_collection     = $userdbname -> logins;

$collections = array(
    "activities" =>    $activities_collection,
    "chapters" =>      $chapters_collection,
    "slideshow" =>     $slideshows_collection,
    "slideshows" =>    $slideshows_collection,
    "text" =>          $text_files_collection,
    "text_files" =>    $text_files_collection,
    "lesson" =>        $lessons_collection,
    "lessons" =>       $lessons_collection,
    "map" =>           $maps_collection,
    "maps" =>          $maps_collection,
    "history" =>       $histories_collection,
    "histories" =>     $histories_collection,
    "game" =>          $games_collection,
    "games" =>         $games_collection,
    "edited_videos" => $edited_videos_collection,
    "new_content" =>   $new_content_collection,
    "recorded_videos" => $recorded_videos_collection,
    "volunteers" =>    $volunteers_collection,

  //  "local_lessons" => $local_lessons_collection,
  //  "local_activities" => $local_activities_collection,

    "users"  =>      $users_collection,
    "hours"  =>      $hours_collection,
    "days"   =>      $days_collection,
    "weeks"  =>      $weeks_collection,
    "months" =>      $months_collection,
    "pages"  =>      $pages_collection,
    "filetypes" =>   $filetypes_collection
);

$localdbname = 'loomalocal';
$localdbname = $mongoClient -> $localdbname;  //connect to the database "loomausers" (for storing logins)
$local_lessons_collection     = $localdbname -> lessons;
$local_slideshows_collection     = $localdbname -> slideshows;
$local_textfiles_collection     = $localdbname -> text_files;
$local_activities_collection  = $localdbname -> activities;

$localcollections = array(
    "lessons" =>    $local_lessons_collection,
    "slideshows" =>    $local_slideshows_collection,
    "text_files" =>    $local_textfiles_collection,
    "text" =>    $local_textfiles_collection,
    "activities" => $local_activities_collection
);

$logcollections = array(
    $users_collection,
    $hours_collection,
    $days_collection,
    $weeks_collection,
    $months_collection,
    $pages_collection,
    $filetypes_collection
);
?>
