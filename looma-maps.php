<!doctype html>
<!--
Author: Sophie, Henry, Morgan, Kendall
Email:
Filename: looma-histories.php
Date: July 2016
Description: Initial "maps" page. Takes the user to the different maps.
-->

<h1 class="credit"> Created by Sophie, Morgan, Henry, Kendall</h1>

<?php  $page_title = 'Looma Maps';
include ("includes/header.php");
require ('includes/mongo-connect.php');
require('includes/looma-utilities.php');?>

<link rel="stylesheet" href="css/looma-maps.css" />

<?php
$mapDir = "../content/maps/mapThumbs/";
$urlBegin = "looma-map.php?id=";

function makeButton($file, $thumb, $dn) {
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
}  //end makeButton()
?>

<body>
<div id="main-container-horizontal" class='scroll'>
    <h1 class="title"> <?php keyword("Looma Maps"); ?> </h1>
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
            if($map['title'] === "Nepal Map" || $map['title'] === "Looma Schools") {
                echo "<td>";
                if (isset($map['title'])) $dn = $map['title']; else $dn = "Map";
                if (isset($map['thumb'])) $thumb = $mapDir . $map['thumb']; else $thumb = 'images/maps.png';
                $id = $map['_id'];  //mongoID of the descriptor for this lesson
                $link = $urlBegin . $id;
                makeButton($link, $thumb, $dn);
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
            if($map['title'] !== "Nepal Map" && $map['title'] !== "Looma Schools") {
                echo "<td>";
                if (isset($map['title'])) $dn = $map['title']; else $dn = "Map";
                if (isset($map['thumb'])) $thumb = $mapDir . $map['thumb']; else $thumb = 'images/maps.png';
                $id = $map['_id'];  //mongoID of the descriptor for this lesson
                $link = $urlBegin . $id;
                makeButton($link, $thumb, $dn);
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

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

</body>
</html>
