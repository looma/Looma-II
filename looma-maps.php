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

        <!-- Geography Games — quick links to the map-based games from Mongo.
             Previously only reachable via the games tab; surfaced here so
             they're findable from the Maps context. -->
        <h2 class="section-title" style="margin-top:0;"><?php keyword("Geography Games"); ?></h2>
        <table><tr>
        <?php
        $geographyGames = array(
            array('id' => '5b620280a18f69cb2937c982', 'name' => 'Continents',        'thumb' => 'images/globe.png'),
            array('id' => '5b620286a18f69cb2937c983', 'name' => 'Asia Countries',    'thumb' => 'images/globe.png'),
            array('id' => '5f2204c96cf78b3916cf2cc5', 'name' => 'Europe Countries',  'thumb' => 'images/globe.png'),
        );
        global $icons;
        foreach ($geographyGames as $g) {
            echo '<td>';
            echo '<a href="game?id=' . $g['id'] . '&type=map">';
            echo   '<button class="map img">';
            echo     '<img src="' . $g['thumb'] . '">';
            echo     '<span class="name">' . $g['name'] . '</span>';
            if (isset($icons['game'])) echo '<img class="icon" src="' . $icons['game'] . '">';
            echo   '</button>';
            echo '</a>';
            echo '</td>';
        }
        ?>
        </tr></table>

        <h2 class="section-title"><?php keyword("Maps"); ?></h2>

        <?php
        //modifications for maps
        //***************************
        //make buttons for maps directory -- virtual folder, populated from maps collection in mongoDB
        $buttons = 1;
        $maxButtons = 3;

        echo "<table><tr>";

        // Standalone map pages that don't live in Mongo. Rendered first so they
        // sit alongside the priority Nepal Map / Looma Schools Map entries.
        echo '<td>';
        echo   '<a href="looma-roads-nepal.php">';
        echo     '<button class="map img">';
        echo       '<img src="images/roads-nepal-thumb.svg" alt="Roads of Nepal">';
        echo       '<span class="name">Roads of Nepal</span>';
        if (isset($icons['map'])) echo '<img class="icon" src="' . $icons['map'] . '">';
        echo     '</button>';
        echo   '</a>';
        echo '</td>';
        $buttons++;
        if ($buttons > $maxButtons) { $buttons = 1; echo "</tr><tr>"; }


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
