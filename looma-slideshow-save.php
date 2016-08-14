
<?php
/*
LOOMA php code file
Filename: looma-picture-player-save.php
Description: Saves the order of images and their captions to the database.

Programmer name: Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
Email: thomas.woodside@gmail.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 6/22/16
Revision: 0.3
*/
$connection = new MongoClient();
$db = $connection->selectDB("looma");
$collection = $db->selectCollection("slideshows");
if (isset($_POST["dn"])) {
    $toinsert = array(
        "order" => $_POST["order"],
        "dn" => $_POST["dn"],
        "fn"=> $_POST["order"][0]["src"]);
    if (isset($_POST["_id"])) { // Already exists
        echo $_POST["_id"] . "test";
        $id = new MongoID(trim($_POST["_id"]));
        $collection->update(array("_id" => $id), $toinsert);
    } else {
        $id = new MongoID();
        $toinsert["_id"] = $id;
        $collection->insert($toinsert);
        $activitiesCollection = $db->selectCollection("activities");
        $toinsertToActivities = array(
            "ft" => "slideshow",
            "dn"=> $_POST["dn"],
            "fn"=> $_POST["order"][0]["src"] . " " .  $id,
        );
        $activitiesCollection->insert($toinsertToActivities);
    }

    echo $id;
}
else if (isset($_GET)) {
    echo $collection->findOne(array("dn" => $_GET["dn"]))["_id"];
}
?>

