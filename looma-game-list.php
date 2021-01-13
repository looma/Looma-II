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

            $game_class =   $_REQUEST["class"]; $class_name = substr_replace($game_class, ' ', 5, 0);
            $game_subject = $_REQUEST["subject"];
            if ($game_subject === 'social studies') $subject_name = 'Social Studies'; else $subject_name = $game_subject;

            echo '<div class="title"><h1>';
                keyword('Looma Games'); echo ' ';
                keyword('for'); echo ' ';
                keyword( ucfirst($class_name)); echo ' ';
                keyword(ucfirst($subject_name));
             echo'</h1></div>';

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
                    //'" data-id="' . $game['_id']->{'$id'} .
                    '" data-id="' . (string) $game['_id'] .
                    '" data-type="' . $game['presentation_type'] . '"' .
                    '"> ';
                echo '<p>';
                keyword($game['title']);
                echo '</p><p class="small">';
                keyword($game['presentation_type'] . ' game');
                echo '</p></button>';
            }

            if ($game_subject === 'english') {
                echo '<button class="activity game" data-class="' . $game_class . '" data-subject="' . $game_subject .
                    '" data-type="vocab"' .
                    '"> ' . $game_class . ' ' . $game_subject . '</p><p class="small">';
                keyword("vocabulary drill");
                echo '</p></button>';

                if ((int)substr($game_class,5) <= 4) {// add picture vocab game
                    echo "<a href='looma-game.php?type=picture&class=" . $game_class . "&subject=" . $game_subject . "'>";
                    echo "  <button class='activity game img'>";
                    echo "    <img src='images/games.png'>";
                    keyword("Visual Vocabulary");
                    echo "  </button>";
                    echo "</a>";

                } else {  // add speak vocab game
                echo "<a href='looma-game.php?type=speak&class=" . $game_class . "&subject=" . $game_subject . "'>";
                echo "  <button class='activity game img'>";
                echo "    <img src='images/speech1.png'>";
                    keyword("Spoken Vocabulary");
                echo "  </button>";
                echo "</a>";
                }
                {  // add vocab translation game
                    echo "<a href='looma-game.php?type=translate&class=" . $game_class . "&subject=" . $game_subject . "'>";
                    echo "  <button class='activity game img'>";
                    echo "    <img src='images/games.png'>";
                    keyword("Vocabulary Translation");
                    echo "  </button>";
                    echo "</a>";
                }
            };

            if ($game_subject === 'math') {
                //makeActivityButton();
                echo '<button class="activity game" data-class="' . $game_class . '" data-subject="' . $game_subject .
                    '" data-type="arith"' .
                    '"> ' . $game_class . ' ' . $game_subject . '</p><p class="small">';
                keyword("arithmetic drill");
                echo '</p></button>';
            };

        ?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-game-list.js"></script>
</body>
</html>

