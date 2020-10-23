<?php include ("includes/mongo-connect.php"); ?>

<?php
    $cmd = $_REQUEST["cmd"];
    switch ($cmd) {
        case "getGame":
            $id = new MongoID($_REQUEST["gameId"]);

            $query = array('_id' => $id);
            $cursor = $sienna_collection->find($query);
            foreach ($cursor as $doc)
            {
              $game = $doc;
            }
            echo json_encode($game);
            break;
        default:
            break;
    }
?>
