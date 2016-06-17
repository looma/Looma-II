<?php
$m = new MongoClient();
$db = $m->selectDB("test");
$collections = $db->listCollections();

foreach ($collections as $collection) {
    echo "amount of documents in $collection: ";
    echo $collection->count(), "\n";
}
?>