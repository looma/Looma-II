<?php
/*
LOOMA php code file
Filename: looma-slideshow-save.php
Description: Saves the order of images and their captions to the database.
Programmer name: Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
Email: thomas.woodside@gmail.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 6/22/16
Revision: 0.3
*/

include ('includes/mongo-connect.php');

if (isset($_POST["dn"]))
{
    $toinsert = array(
        "fn"     => $_POST["fn"],
        "fp"     => $_POST["fp"],
        "dn"    => $_POST["dn"],
        "order" => $_POST["order"]);

    if (isset($_POST["_id"]))
    { // Already exists
        echo $_POST["_id"] . "exists";
        $id = new MongoID(trim($_POST["_id"]));
        $slideshows_collection->update(array("_id" => $id), $toinsert);

    //NOTE: need to update activities collection entry also


    }
    else //new SLIDESHOW
    {   //save new slideshow in mongo 'slideshows' collection
        $id = new MongoID();
        $toinsert["_id"] = $id;
        $slideshows_collection->insert($toinsert);

        // and save slideshow in the activities collection
        $toinsertToActivities = array(
            "ft"      => "slideshow",
            "mongoID" => $id,
            "dn"      => $_POST["dn"],
            "ch_id"   => "1EN01",
            "fn"      => $_POST["order"][0]["src"]);

      //  $activities_collection->insert($toinsertToActivities);
    }

    echo $id;
}
else if (isset($_GET["dn"])) {
    echo $slideshows_collection->findOne(array("dn" => $_GET["dn"]))["_id"];
}
?>

