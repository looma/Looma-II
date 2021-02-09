<?php
  include '../Looma/includes/mongo-connect.php';

  //Get Command
  $cmd = $_GET["cmd"];

  //Update Command
  if ($cmd == "update") {
    //Get Query and Page To Load
    $title = $_GET["title"];
    $ch_id = $_GET["chid"];
    $isDuplicate = $_GET["duplicate"];
    $db_id = $_GET["dbid"];

    if ($isDuplicate == "false") {
      //Create Query For Activity
      $toFind = array('_id' => mongoId($db_id));

      //Fields To Update
      $updatedField = array(
        "dn" => $title,
        "ch_id" => $ch_id
      );

      //Type Of Update
      $update = array('$set'=>$updatedField);

      //Actually Update
      $activities_collection->update (
        $toFind, $update
      );
    } else {
      //Create Query For Activity
      $toFind = array('_id' => mongoId($db_id));
      $projection =  array("_id" => false);

      //Get Activity
      $activity = $activities_collection->findOne($toFind, $projection);

      //Update Fields
      $activity['dn'] = $title;
      $activity['ch_id'] = $ch_id;

      //Actually Update
      $activities_collection->insert($activity);
    }
  } else if ($cmd == "insert") {
    //Get Terms
    $title = $_GET["title"];
    $ch_id = $_GET["chid"];
    $fn = $_GET['fn'];
    $ft = $_GET['ft'];

    //Build Object
    $toInsert = array("dn" => $title, "ch_id" => $ch_id, "fn" => $fn, "ft" => $ft);

    //Insert Object
    $activities_collection->insert($toInsert);
  } else if ($cmd == "getChapterId") {
    //Get Info
    $fn = $_GET['fn'];

    //Create Query
    $toFind = array('fn' => $fn);
    $projection =  array("_id" => false, "ch_id" => true);

    //Get Activity
    $activity = $activities_collection->findOne($toFind, $projection);

    //Return ch_id
    echo $activity['ch_id'];
  }
?>
