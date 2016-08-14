<!--
Name: Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 0.1
File: looma-edited-video-rename.php
Description: Renames an edited video
-->

<!doctype html>

<?php
include ('includes/mongo-connect.php');

    $newName = $_REQUEST['newPath'];
    $oldName = $_REQUEST['oldPath'];
    $strJSON = json_encode($_REQUEST['info']);

    //$newName = str_replace(' ', '_', $newName);

    // Save to DB
    $newDn = str_replace('_', ' ', $newName);

    $query = array("fn" => $oldName);
    $fileToUpdate = $edited_videos_collection->findOne($query);

    if ($_REQUEST_['doesExist'] == "true" || $fileToUpdate != "")
    {
        $fieldsToUpdate = array(
            "dn" => $newDn,
            "fn" => $newName,
            "JSON" => $strJSON,
            "vn" => $_REQUEST['vn'],
            "vp" => $_REQUEST['vp']
        );
        $edited_videos_collection->update($fileToUpdate, $fieldsToUpdate);
    }
?>