<?php
/*
Filename: looma-databse-utilities.php
Description: server side code for SAVE, OPEN, DELETE, EXISTS? commands to mongoDB
Programmer : Skip
Adapted from: looma-slideshow-save.php by Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Nov 2016
Revision: 1.0
*/

include ('includes/mongo-connect.php');

//SAVE function for TEXT files
function saveText() {

    global $activities_collection, $dbCollection;

    $toinsert = array(
        "dn"     => $_REQUEST["dn"],
        "html"   => $_REQUEST["html"],
        "ft"   => $_REQUEST["ft"],  //TYPE can be 'text' or 'text-template'
        "date"   => gmdate("Y.m.d"),  //using greenwich time
        "author" => $_COOKIE['login']
        );

    $query =array('dn'=>$_REQUEST["dn"]);
    $options = array("upsert"=>True, "new"=>True);
    $projection = array('_id' => 1, 'dn' => 1);

    $result = $dbCollection->findAndModify($query, $toinsert, $projection, $options);

    echo json_encode($result);

//  AND save new textfile in the activities collection or update 'dn' for existing activities pointing to this text file
    if ($_REQUEST['ft'] == 'text') {

        $id = $result['_id'];
        //echo "ID is " . $id;


        $id = new MongoID($id); // mongoID of the text we just saved
        $query = array("ft" => "text", "mongoID" => $id);
        $toinsertToActivities = array(
            "ft"      => "text",
            "mongoID" => $id,
            "dn"      => $_REQUEST["dn"]
             );
        $options = array("upsert" => True, "multi" => True);

        //DEBIUG echo 'updating activities with ' . $id . ' and ' . $_REQUEST['dn'];

    try {
            $result1 = $activities_collection->update($query, $toinsertToActivities, $options);
            //echo json_encode($result1);
        }
    catch(MongoConnectionException $e)
        {
            echo "Mongo Error writing to Activities collection";
            // could be: echo json_encode(array('error'=>'Mongo error writing Activities collection'));
        };



    };
};  //end SAVETEXT()

function renameText() {
        global $activities_collection, $dbCollection;

        $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
        $update = array('$set' => array('dn' => $_REQUEST['newname']));
        $projection = array('_id' => 1, 'dn' => 1);
        $options = array('new' => True);
        $result = $dbCollection->findAndModify($query, $update, $projection, $options);

        echo json_encode($result);

//  AND update 'dn' for existing activities pointing to this text file
    if ($_REQUEST['ft'] == 'text') {
        $id = $result['_id'];

        $id = new MongoID($id); // mongoID of the text we just saved
        $query = array("ft" => "text", "mongoID" => $id);
        $update = array('$set' => array('dn' => $_REQUEST['newname']));
        $options = array('multiple' => true);

        $result1 = $activities_collection->update($query, $update, $options);

        echo json_encode($result1);
    };
}; //end RENAMETEXT()

/*  NOTE: search is done in looma-database-search.php for now. move it back into here someday
   function search() {
    //Get Query and Page To Load
    $request = $_GET["q"];
    $page = $_GET["page"] * 20;

    //Get Search Parameters
    $fileTypes = array();
    $showVideo = $_GET["videosChecked"];
    $showAudio = $_GET["audioChecked"];
    $showImages = $_GET["imagesChecked"];
    $showWebpages = $_GET["webpagesChecked"];
    $showPdfs = $_GET["pdfsChecked"];

    //Append Relevant File Types
    if ($showVideo == "true") {
        array_push($fileTypes, "mp4", "video", "mov");
    }
    if ($showAudio == "true") {
        array_push($fileTypes, "mp3", "audio");
    }
    if ($showImages == "true") {
        array_push($fileTypes, "image", "jpg", "png", "gif");
    }
    if ($showWebpages == "true") {
        array_push($fileTypes, "EP", "html", "htm", "php", "asp");
    }
    if ($showPdfs == "true") {
        array_push($fileTypes, "pdf");
    }

    //Build Regex .* is anything and i is ignore case
    $regex = new MongoRegex('/^.*' . $request . '/i');

    //Query For Item
    $query = array("dn" => $regex, 'ft' => array('$in' => $fileTypes));
    $cursor = $activities_collection->find($query)->skip($page)->limit(20);


    foreach ($cursor as $d)
    {
        // $d_id = $cursor['_id'];
        // $d_title = $cursor['dn'];
        // $chid = $cursor['ch_id'];
        //Grab The ID, Title, and description
        $d_id = array_key_exists('_id', $d) ? $d['_id'] : null;
        $d_title = array_key_exists('dn', $d) ? $d['dn'] : null;
        $chid = array_key_exists('ch_id', $d) ? $d['ch_id'] : null;
        $d_description = "sample text";

        //Add the search result
        // echo "
        // <div class='row'>
        //  <div class='well well-sm individualResult' dbid='$d_id' title='$d_title' chid='$chid'>
        //      <h4> $d_title </h4>
        //      <div class='limitedResult'></div>
        //  </div>
        // </div>
        // ";
        echo "
        <tr>
            <td class='individualResult' dbid='$d_id' title='$d_title' chid='$chid'>
                <h4> <b> $d_title </b> </h4>
            </td>
        </tr>
        ";
    }

};  //end SEARCH
*/

/*****************************/
/****   main code here    ****/
/*****************************/

if (isset($_REQUEST["cmd"]) && isset($_REQUEST["collection"]))
{
   $cmd =  $_REQUEST["cmd"];
   //accepted commands are "open", "save", "exists", "delete"

   $collection =  $_REQUEST["collection"];
   $dbCollection = $activities_collection;  // default to 'activities' collection

   //accepted collections are "text" [others to be added]

   switch ($collection) {
       case "text":
           $dbCollection =  $text_files_collection;
           break;
       default: return;
   };

   /* NOTE: mongoDB collections list:
    $activities_collection = $loomaDB -> activities;
    $chapters_collection =   $loomaDB -> chapters;
    $textbooks_collection =  $loomaDB -> textbooks;
    $dictionary_collection = $loomaDB -> dictionary;
    $logins_collection =     $loomaDB -> logins;
    $history_collection =    $loomaDB -> histories;
    $slideshows_collection = $loomaDB -> slideshows;
    $text_files_collection = $loomaDB -> text_files;
    $edited_videos_collection = $loomaDB -> edited_videos;
    */

    switch ($cmd)
    {
        case "open":
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
           //look up this DN (display name) in this collection (dbCollection)
           $file = $dbCollection -> findOne($query);  // assumes someone is maintaining this collection with unique DNs (index unique)
           if ($file) echo json_encode($file);        // if found, return the contents of the mongo document
           else echo json_encode(array("error" =>"File not found"));  // in not found, return an error object {'error': errormessage}
           return;

        case "save":
            if ($collection == "text") saveText();
            // else handle other collections' specific save requirements
            return;

       case "rename":
             if ($collection == "text") renameText();
            // else handle other collections' specific rename requirements

            return;

        case "exists": //find "dn" in the collection and return its ID if it exsits or NULL if doesnt exist
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
            $projection = array("_id" => 1);
            $result = $dbCollection->findOne($query, $projection);
            if ($result) echo json_encode(array("_id" => $result["_id"]));
            else         echo json_encode(array("_id" => ""));
            return;

        case "delete":
            $query = array('dn' => $_REQUEST['dn'], 'ft' => $_REQUEST['ft']);
            $dbCollection->remove($query, array("justOne" => true));
            echo "deleted " . $dn;        //should change this to return an object
            return;

   /*     NOTE: search is done in looma-database-search.php for now. move it back into here someday
        case "search":
            search();
            return;
   */
    };
}
else return; //no CMD or COLLECTION given
?>

