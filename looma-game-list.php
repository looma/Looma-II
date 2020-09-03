<!doctype html>
<!--
Filename: looma-game-list.php
Date: 2020 08 22

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 3
-->

<?php $page_title = 'Looma Game List';
require_once ('includes/header.php');
require_once ('includes/looma-utilities.php');
require_once ("includes/mongo-connect.php");
?>

<link rel="stylesheet" href="css/looma-game-list.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">

        <?php

            $game_class =   $_REQUEST["class"];
            $game_subject = $_REQUEST["subject"];

            echo '<div class="title"><h1>Looma Games for ' .
                  ucfirst($game_class) . ' ' . ucfirst($game_subject) .
                 '</h1></div>';

            $subject_key = array("M"=>"Math", "S"=>"Science", "N"=>"Nepali", "EN"=>"English",
                "SS"=>"Social Studies", "V"=>"Vocational", "H"=>"Health");

            $titles = array(
                "multiple choice"=>"Multiple Choice",
                "concentration"  =>"Concentration",
                "matching"       =>"Matching",
                "map"            =>"Map",
                "vocab"            =>"Vocabulary",
                "arith"            =>"Arithmetic",
                "picture"            =>"Picture Matching",
                "timeline"       =>"History");

            // given: grade and subject
            //      display a grid of buttons for matching games
            //      get games where ch_lo and ch_hi cover the 'grade'
            //      also get histories that match ch_lo, ch_hi and subject
            //      and where subject matches subject
            //      if subject = math, add a arithmetic game
            //      if subject = english [others later] add a vocab game

            $query = [];
            $query['cl_lo'] = array('$lte' => (int)substr($game_class,5));
            $query['cl_hi'] = array('$gte' => (int)substr($game_class,5));
            $query['subject'] = $game_subject;

        //print_r($query);

            $games = mongoFind($games_collection, $query, null, null, null);
            foreach ($games as $game) {

                //makeActivityButton();
                echo '<button class="activity game" data-class="' . $game_class . '" data-subject="' . $game_subject .
                    '" data-id="' . $game['_id']->{'$id'} .
                    '" data-type="' . $game['presentation_type'] . '"' .
                    '"> ';
                echo '<p>' . $game['title'] . '</p><p class="small">(' . $game['presentation_type'];
                echo ')</p></button>';
            }

            if ($game_subject === 'english') {
                echo '<button class="activity game" data-class="' . $game_class . '" data-subject="' . $game_subject .
                    '" data-type="vocab"' .
                    '"> ' . $game_class . ' ' . $game_subject . '</p><p class="small"> (vocabulary drill)</p></button>';

                // add picture vocab game
                echo "<td>";
                echo "<a href='looma-game.php?type=picture&class=class" . $game_class . "&subject=" . $game_subject . "'>";
                echo "  <button class='activity game img'>";
                echo "    <img src='images/games.png'>";
                echo "    <span>Visual Vocabulary</span>";
                echo "  </button>";
                echo "</a>";

                echo "</td>";


            };

            if ($game_subject === 'math') {
                //makeActivityButton();
                echo '<button class="activity game" data-class="' . $game_class . '" data-subject="' . $game_subject .
                    '" data-type="arith"' .
                    '"> ' . $game_class . ' ' . $game_subject . '</p><p class="small"> (arithmetic drill)</p></button>';
            };

        ?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-game-list.js"></script>
</body>
</html>

