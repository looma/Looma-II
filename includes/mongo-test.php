<?php
//Name: Skip
//
//
// includes/mongo-test.php
// reports mongoDB version number

require_once ('header.php');

//NOTE: following command doesnt always work. on AWS, the PATH is "/usr/bin". Needs code fix
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

echo "<h1>Running" . $mongo_version . " (mongo level " . $mongo_level . ")</h1>";

?>
