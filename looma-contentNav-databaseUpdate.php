<?php
  //Connents to Mongo DB
  $m = new MongoClient();
  $fileDB = $m->looma;
  $activities = $fileDB -> activities;

  //Get Query and Page To Load
  $title = $_GET["title"];
  $ch_id = $_GET["chid"];
  $db_id = $_GET["dbid"];

  //Create Query For Activity
  $toFind = array('_id' => new MongoId($db_id));

  //Fields To Update
  $updatedField = array(
    "dn" => $title,
    "ch_id" => $ch_id
  );

  //Type Of Update
  $update = array('$set'=>$updatedField);

  //Actually Update
  $activities->update (
    $toFind, $update
  );


?>
