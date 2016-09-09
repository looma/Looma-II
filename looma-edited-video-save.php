<?php

/*
Name: Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 1.0
File: looma-edited-video-save.php
Description: Saves edit information into mongodb 'edited_videos' collection for the video editor
 */

include ('includes/mongo-connect.php');

$fileName = $_REQUEST['location'];
$strJSON = json_encode($_REQUEST['info']);
$fileDoesExist = $_REQUEST['doesExist'];

$vn   = $_REQUEST['vn'];
$extravn   = $vn;
$vp   = $_REQUEST['vp'];

// Save File to DB
$dn = str_replace('_', ' ', $fileName);

$query = array("fn" => $fileName);
$fileToUpdate = $edited_videos_collection->findOne($query);

if ($fileDoesExist == "true" || $fileToUpdate != "")
{ //update existing entry
    $fieldsToUpdate = array(
        "dn" => $dn,
        "fn" => $fileName,
        "JSON" => $strJSON,
        "vn" => $vn,
        "vp" => $vp
        );
    $edited_videos_collection->update($fileToUpdate, $fieldsToUpdate);

    //NOTE: need to change Activities collection entry also !!!!

}
else
{  // Create new entry

    $id = new MongoID();

    $toInsert = array(
        "_id" => $id,
        "dn" => $dn,
        "fn" => $fileName,
        "JSON" => $strJSON,
        "vn" => $vn,
        "vp" => $vp
        );
    $edited_videos_collection->insert($toInsert);


//NOTE: this save to activities code is not working - saves 'fn' as 'null instead of using the value of $vn
    // and save editedvideo in the activities collection
    $toinsertToActivities = array(
        "ft"    => "evi",
        "fn"    => $vn,
        "fp"    => $vp,
        "mongoID" => $id,
        "dn"    => $dn,
        "ch_id" => "1EN01"
        );

        //$result =
     //   $activities_collection->insert($toinsertToActivities);

        //echo "activities insert result = " . $result;

/*try {
        $activities_collection->insert($toinsertToActivities);
    }
catch(mongoCursorException $e) {echo "error inserting activity = " . $e->getMessage();}
*/

    //'fn' getting set to NULL. try this ??//echo "new evi in mongo " . $fileName;
    // TRY: db.activities.update({"dn":"8-28c"},{$set:{"fn":"Real Title"}})
    //    $toSet = array(
    //      '$set' => array("fn"=>$vn)
    //      );
   // $activities_collection->update(array("dn" => $dn), $toSet);
}

?>