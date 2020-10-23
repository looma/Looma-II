<?php
	//Name: Skip
	//
	//Owner: Looma Education Company
	//Date: 2015 03, 2020 07
	//Revision: Looma 6.0.0
	//File: includes/mongo-connect.php
	//Description:  for Looma v6

function mongoRegex ($pattern) { // $pattern is a string, like '^\d[a-z]'
    global $mongo_level;
    if ($mongo_level >= 4)
         return new MongoDB\BSON\Regex($pattern);
    else return new MongoRegex($pattern);
}

function mongoRegexOptions($pattern, $options) {
        global $mongo_level;
    if ($mongo_level >= 4)
         return new MongoDB\BSON\Regex($pattern,$options);
    else return new MongoRegex('/' . $pattern . '/' . $options);
}

function mongoId ($id) {  //$id is a string
    global $mongo_level;
    if ($mongo_level >= 4)
         return new MongoDB\BSON\ObjectId($id);
    else return new MongoId($id);
}

function mongoFind($collection, $filter, $sort, $skip, $limit) {

    // $auery, $sort, $skip, and $limit may be null
    global $mongo_level;
    if ($mongo_level >= 4) {
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
    global $mongo_level;
    $doc = $collection->findOne( $filter );
    return $doc;
}

function mongoFindRandom($collection, $filter, $count) {
    // for use by looma-dictionary.php CMD = LIST
    //returns a randomized set, size $count, of english words from the dictionary
    global $mongo_level;
    if ($mongo_level >= 4) {
         $cursor = $collection.aggregate([
            array($match =>  $filter),
            array($sample => array( 'size' => $count))]);
    } else {  // old mongoDB, mongo_level 2 or 3
        $cursor = $collection->find( $filter );
    };

    $temp = [];
    $cursorArray = iterator_to_array($cursor);
    foreach ($cursorArray as $key => $doc) $temp[]=$doc;

    if ($mongo_level >= 4) //already randomly sampled by mongo
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
    global $mongo_level;
    if ($mongo_level >= 4 ) {
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
    global $mongo_level;
    if ($mongo_level >= 4 ) $doc = $collection->insertOne( $doc);
    else                    $doc = $collection->insert($doc);
    return $doc;
}

function mongoUpsert($collection, $filter, $insert) {
    global $mongo_level;
    if ($mongo_level >= 4 ) $doc = $collection->updateOne($filter, $insert, array('upsert' => true));
    else                    $doc = $collection->update($filter, $insert, array('upsert' => true));
    return $doc;
}

function mongoUpdateMany($collection, $filter, $set) {
    global $mongo_level;
    if ($mongo_level >= 4 ) {
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
    global $mongo_level;
    if ($mongo_level >= 4 ) $result = $collection->updateOne( $filter, $set);
    else                    $result = $collection->update($filter, $set);
    return $result;
}

function mongoDeleteOne($collection, $filter) {
    global $mongo_level;
    if ($mongo_level >= 4 ) $result = $collection->deleteOne( $filter);
    else                    $result = $collection->remove($filter, array('justone'=> true));
    return $result;
}

function mongoDeleteMany($collection, $filter) {
    global $mongo_level;
    if ($mongo_level >= 4 )  $result = $collection->deleteMany($filter);
    else                     $result = $collection->remove($filter, array('justone'=> false));
    return $result;
}

function mongoCreateIndex($collection, $key) {
    global $mongo_level;
    $doc = $collection->createIndex($collection, $key);
    return $doc;
}

function mongoCreateUniqueIndex($collection, $key) {
    global $mongo_level;
    $doc = $collection->createIndex($collection, $key, array('unique'=>true));
    return $doc;
}

exec('export PATH="/usr/local/bin/";mongo --version',$mongo_version);
if ($mongo_version) {
    preg_match('/\d\.\d\.\d/', $mongo_version[0], $matches);
    $mongo_version = $matches[0];
    $mongo_level = intval($mongo_version[0]);
} else {
    $mongo_version = '2.0.0';
    $mongo_level = 2;
}
//echo 'mongo_version is ' . $mongo_version . '  $mongo_level = '. $mongo_level;

$dbhost = 'localhost';
$dbname = 'looma';

try {
    if ($mongo_level >= 4) {
        require_once('vendor/autoload.php');
        $m = new MongoDB\Client("mongodb://localhost:27017");
    } else {  //old mongo is running
        $m = new MongoClient("mongodb://localhost:27017");    //make a new mongo client object
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
       	$loomaDB = $m -> $dbname;  //connect to the database "looma"
                                   //make query variables for all collections
        $activities_collection = $loomaDB -> activities;
        $tags_collection       = $loomaDB -> tags;
    	$chapters_collection   = $loomaDB -> chapters;
    	$textbooks_collection  = $loomaDB -> textbooks;
        $dictionary_collection = $loomaDB -> dictionary;
        $logins_collection     = $loomaDB -> logins;
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

        //the lines below are commented out for now. some Looma installs have old MONGO versions that dont do 'createIndex'
        //$activities_collection->createIndex(array('ch_id' => 1));
        //$activities_collection->createIndex(array('fn' => 1));
        //$text_files_collection->createIndex(array('dn' => 1), array('unique' => True));

?>
