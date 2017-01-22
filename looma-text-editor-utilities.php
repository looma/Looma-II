<?php

/*
Name: Skip
Modified from: looma-edited-video-save.php by Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 10
Revision: Looma Test Editor 1.0
File: looma-text-editor-save.php
Description: Saves text file information into mongodb $text_files_collection for the text editor
 */

include ('includes/mongo-connect.php');
// params: "cmd", "id" [mongoID], "name" [display name], "html" [html to be saved]
// param "cmd" can be "save", "savenew", "rename", "delete"
if (isset($_REQUEST['cmd']))  $cmd =  $_REQUEST['cmd'];  else $cmd = "none";
if (isset($_REQUEST['id']))   $id =   $_REQUEST['id'];   else $id = "";
if (isset($_REQUEST['dn'])) $dn =   $_REQUEST['dn']; else $dn = "no name given";
if (isset($_REQUEST['html'])) $html = $_REQUEST['html']; else $html = "empty";  //need JSONencode?

switch ($cmd) {
    case "save":
        $id = new MongoID($id);
        $query = array("_id" => $id);
        $fieldsToUpdate = array(
            "dn" => $dn,
            "html" => $html
            );
        $text_files_collection->update($query, $fieldsToUpdate);
        echo "Saved file ", $name, "   ", $id;
        break;

    case "open":
        $query = array('dn' => $dn);
        $projection = array('html' => 1, 'dn' => 1, '_id' => 1);
        $file = $text_files_collection->findOne($query, $projection);

        //echo "PHP open: " . $dn;

        if ($file) echo $file['html'];
        else       echo 'File not found';

        break;

    case "savenew":
        $id = new MongoID();
        $toInsert = array(
            "_id" => $id,
            "dn" => $dn,
            "html" => $html
            );
        $text_files_collection->insert($toInsert);
        echo "Saved file ", $name, "   ", $id;
        break;

    case "rename":
        $id = new MongoID($id);
        $query = array("_id" => $id);
        $fieldsToUpdate = array('$set' => array("dn" => $dn));
        $text_files_collection->update($query, $fieldsToUpdate);
        echo "Renamed file ", $name, "   ", $id;
        break;

    case "delete":
        $id = new MongoID($id);
        $text_files_collection->remove(array('_id' => $id));
        echo "Deleted file ", $name, "   ", $id;
        break;

        //ADD read(name, id) function that returns HTML of a saved TEXT
        // $.post(url, {cmd:"read",name:name, id:id}, completefunction, "html");

};
?>