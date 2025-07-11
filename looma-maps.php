<!doctype html>
<!--
Author: Sophie, Henry, Morgan, Kendall
Email:
Filename: looma-maps.php
Date: July 2016
Description: Initial "maps" page. Takes the user to the different maps.
-->


<?php  $page_title = 'Looma Maps';
include ("includes/header.php");
require_once('includes/looma-utilities.php');
logPageHit('maps');
?>

<link rel="stylesheet" href="css/looma-maps.css" />

<?php
/*
 *
 *   ******* makeMapButton moved to looma-utilities.php  *****
function makeMapButton($file, $thumb, $dn) {
    echo "<a href='" . $file . "'>";

    echo "<button class='map  img'>";
    //text and tooltip for BUTTON
    echo "<span class='displayname'
                            class='btn btn-default'
                            data-toggle='tooltip'
                            data-placement='top'
                            title='" . $file . "'>" .
        "<img src='" . $thumb . "'>" .
        keyword($dn) . "</span>";
    //finish BUTTON
    echo "</button></a>";
}  //end makeMapButton()
*/
?>

<body>
<div id="main-container-horizontal" class='scroll'>
    <h1 class="title"> <?php keyword("Looma Maps"); ?> </h1>
    <h1 class="credit"> Created by Sophie, Morgan, Henry, Kendall</h1>
    <div class="center">
        <br>
        <?php
        //modifications for maps
        //***************************
        //make buttons for maps directory -- virtual folder, populated from maps collection in mongoDB
        $buttons = 1;
        $maxButtons = 3;

        echo "<table><tr>";

        //$maps = $maps_collection->find();
        $maps = mongoFind($maps_collection, [], null, null, null);

        foreach ($maps as $map) {
            if($map['title'] === "Nepal Map" || $map['title'] === "Looma Schools Map") {
                echo "<td>";
                if (isset($map['title'])) $dn = $map['title']; else $dn = "Map";
                if (isset($map['thumb'])) $thumb = "../content/maps/mapThumbs/" . $map['thumb']; else $thumb = 'images/maps.png';
                $id = $map['_id'];  //mongoID of the descriptor for this lesson
                $link = "map?id=" . $id;
                makeMapButton($id, $thumb, $dn);
                echo "</td>";
                $buttons++;
                if ($buttons > $maxButtons) {
                    $buttons = 1;
                    echo "</tr><tr>";
                }
            }
        };

        $maps = mongoFind($maps_collection, [], null, null, null); //mongo 4.4 wont allow re-use of cursor
        foreach ($maps as $map) {
            if($map['title'] !== "Nepal Map"
                && $map['title'] !== "Looma Schools Map"
                && ( ! isset($map['hidden'])  || ! $map['hidden'])) {
                echo "<td>";
                if (isset($map['title'])) $dn = $map['title']; else $dn = "Map";
                if (isset($map['thumb'])) $thumb = "../content/maps/mapThumbs/" . $map['thumb']; else $thumb = 'images/maps.png';
                $id = $map['_id'];  //mongoID of the descriptor for this lesson
                $link = "map?id=" . $id;
                makeMapButton($id, $thumb, $dn);
                echo "</td>";
                $buttons++;
                if ($buttons > $maxButtons) {
                    $buttons = 1;
                    echo "</tr><tr>";
                }
          }
        } //end FOREACH
        echo "</tr></table>";
        ?>
    </div>
</div>

<?php include ('includes/toolbar.php');
    include ('includes/js-includes.php'); ?>
<script src="js/looma-maps.js"></script>

</body>
</html>
