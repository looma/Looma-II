<!doctype html>
<!--
Filename: looma-map-games.php
Description: Dedicated landing page for the map-based quiz games (Continents,
             Asia / Europe / Africa / North America / South America / World
             Countries). Split out from looma-maps.php so the games no longer
             push the actual map buttons below the fold — the /maps page now
             has a single "Map Games" tile that links here.
-->

<?php
$page_title = 'Map Games';
include ('includes/header.php');
require_once('includes/looma-utilities.php');
logPageHit('maps');
?>

<link rel="stylesheet" href="css/looma-maps.css" />

<body>
<div id="main-container-horizontal" class='scroll'>
    <h1 class="title"> <?php keyword("Map Games"); ?> </h1>

    <div class="center">
        <br>

        <table><tr>
        <?php
        // Same ids as the Geography Games array in looma-maps.php (before
        // the split). Keep IDs and names in sync between the two files
        // when adding new map-quiz games to Mongo.
        $mapGames = array(
            array('id' => '5b620280a18f69cb2937c982', 'name' => 'Continents',              'thumb' => 'images/globe.png'),
            array('id' => '6a78dc5973dbd01789db8655', 'name' => 'World Countries',         'thumb' => 'images/globe.png'),
            array('id' => '5b620286a18f69cb2937c983', 'name' => 'Asia Countries',          'thumb' => 'images/globe.png'),
            array('id' => '5f2204c96cf78b3916cf2cc5', 'name' => 'Europe Countries',        'thumb' => 'images/globe.png'),
            array('id' => '6a78dc5973dbd01789db864f', 'name' => 'Africa Countries',        'thumb' => 'images/globe.png'),
            array('id' => '6a78dc5973dbd01789db8651', 'name' => 'North America Countries', 'thumb' => 'images/globe.png'),
            array('id' => '6a78dc5973dbd01789db8653', 'name' => 'South America Countries', 'thumb' => 'images/globe.png'),
        );
        global $icons;
        $gameCol = 1;
        $gameMax = 3;
        foreach ($mapGames as $g) {
            echo '<td>';
            echo '<a href="game?id=' . $g['id'] . '&type=map">';
            echo   '<button class="map img">';
            echo     '<img src="' . $g['thumb'] . '">';
            echo     '<span class="name">' . $g['name'] . '</span>';
            if (isset($icons['game'])) echo '<img class="icon" src="' . $icons['game'] . '">';
            echo   '</button>';
            echo '</a>';
            echo '</td>';
            $gameCol++;
            if ($gameCol > $gameMax) { $gameCol = 1; echo '</tr><tr>'; }
        }
        ?>
        </tr></table>

    </div>
</div>

<?php include('includes/toolbar.php'); ?>
<?php include('includes/js-includes.php'); ?>

<script>
if (typeof toolbar_button_activate === 'function') toolbar_button_activate('maps');
</script>

</body>
</html>
