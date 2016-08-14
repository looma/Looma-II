<!doctype html>
<!--
Name: Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 1.0
File: looma-edited-video-save.php
Description: Converts edit information into a txt file for the video editor
-->

<?php

include ('includes/mongo-connect.php');

$fileName = $_REQUEST['location'];
$strJSON = json_encode($_REQUEST['info']);
$fileDoesExist = $_REQUEST['doesExist'];

/*
$this_dir = dirname(__FILE__);

// admin's parent dir path can be represented by admin/..
$parent_dir = realpath($this_dir . '/..');

// concatenate the target path from the parent dir path
$target_path = $parent_dir . '/content/videos/' . $fileName . '.txt';

// open the file
$myFile = fopen($target_path, 'w') or die("can't open file");
fwrite($myFile, $strJSON);
fclose($myFile);
*/

// Save File to DB
$dn = str_replace('_', ' ', $fileName);

$query = array("fn" => $fileName);
$fileToUpdate = $edited_videos_collection->findOne($query);

if ($fileDoesExist == "true" || $fileToUpdate != "")
{
    $fieldsToUpdate = array(
        "dn" => $dn,
        "fn" => $fileName,
        "JSON" => $strJSON,
        "vn" => $_REQUEST['vn'],
        "vp" => $_REQUEST['vp']
    );
    $edited_videos_collection->update($fileToUpdate, $fieldsToUpdate);
}
else
{
    // Create new entry
    $toInsert = array(
        "dn" => $dn,
        "fn" => $fileName,
        "JSON" => $strJSON,
        "vn" => $_REQUEST['vn'],
        "vp" => $_REQUEST['vp']
    );
    $edited_videos_collection->insert($toInsert);
}

?>