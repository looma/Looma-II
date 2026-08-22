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
?>

<link rel="stylesheet" href="css/looma-game-list.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">

        <?php

            function classNUmber($class) {
                if
                    ($class === 'class11') return 11;
                else if
                    ($class === 'class12') return 12;
                else
                    return substr($class,5);
            };

            $game_class =   $_REQUEST["class"]; $class_name = substr_replace($game_class, ' ', 5, 0);
            $game_subject = $_REQUEST["subject"];
            if ($game_subject === 'social studies') $subject_name = 'Social Studies'; else $subject_name = $game_subject;

            echo '<div class="title"><h1>';
                keyword('Games'); echo ' ';
                keyword('for'); echo ' ';
                keyword( ucfirst($class_name)); echo ' ';
                keyword(ucfirst($subject_name));
             echo'</h1></div>';

            $subject_key = array("M"=>"Math", "S"=>"Science", "N"=>"Nepali", "EN"=>"English",
                "SS"=>"Social Studies", "V"=>"Vocational", "H"=>"Health", "SF"=>"Serofero");

            $titles = array(
                "multiple choice"=>"Multiple Choice",
                "concentration"  =>"Concentration",
                "matching"       =>"Matching",
                "map"            =>"Map",
                "vocab"          =>"Vocabulary",
                "arith"          =>"Arithmetic",
                "picture"        =>"Picture Matching",
                "timeline"       =>"History");

            // given: grade and subject
            //      display a grid of buttons for matching games
            //      get games where ch_lo and ch_hi cover the 'grade'
            //      also get histories that match ch_lo, ch_hi and subject
            //      and where subject matches subject
            //      if subject = math, add a arithmetic game
            //      if subject = english [others later] add a vocab game

            $query = [];
            $class = classNumber ($game_class);
            $query['cl_lo'] = array('$lte' => (int)$class);
            $query['cl_hi'] = array('$gte' => (int)$class);
            $query['subject'] = $game_subject;

        //print_r($query);

        echo '<div id="buttons">';

            $games = mongoFind($games_collection, $query, null, null, null);
            $localGames = mongoFind($local_games_collection, $query, null, null, null);

            foreach (array(array($games, 'looma'), array($localGames, 'loomalocal')) as $pair) {
                $cursor = $pair[0];
                $db = $pair[1];
                foreach ($cursor as $game) {

                // look up the activity for this game to get dn and ndn
                $activity_query = array('ft' => 'game', 'mongoID' => mongoId($game['_id']));
                $activity = mongoFindOne($activities_collection, $activity_query);

                $dn  = isset($activity['dn'])  ? $activity['dn']  : (isset($game['title']) ? $game['title'] : '');
                $ndn = isset($activity['ndn']) ? $activity['ndn'] : null;

                echo '<button class="activity img game" data-class="' . $game_class . '" data-subject="' . $game_subject .
                    '" data-db="' . $db .
                    '" data-id="' . (string) $game['_id'];
                if (isset($game['ch_id'])) echo '" data-ch="' . $game['ch_id'];
                if (isset($game['author'])) echo    '" data-author="' . (string) $game['author'];
                echo    '" data-type="' . $game['presentation_type'] . '"' .
                    '"> ';

                echo '<img loading="lazy" draggable="false" src="images/games.png">';

                echo '<p>';
                displayName(null, $dn, $ndn, language(), 'black');
                echo '</p><p class="small">';
                keyword($game['presentation_type'] . ' game');
                echo '</p>';
                $tip = $dn ? $dn : $ndn;
                if ($tip) echo "<span class='tip yes-show big-show'>" . $tip . "</span>";
                echo '</button>';
            }
            }

            if ($game_subject === 'english') {
                echo '<button class="activity img game" data-class="' . $game_class . '" data-subject="' . $game_subject .
                    '" data-type="vocab"' .
                    '"> ' . $game_class . ' ' . $game_subject . '<p class="small">';
                keyword("vocabulary drill");
                echo '</p></button>';

                if ((int)substr($game_class,5) <= 4) {// add picture vocab game
                    echo "  <button class='activity game img'>";
                    echo "<a href='looma-game.php?type=picture&class=" . $game_class . "&subject=" . $game_subject . "'>";
                    echo "    <img src='images/games.png'>";
                    keyword("Visual Vocabulary");
                    echo "</a>";
                    echo "  </button>";

                } else {  // add speak vocab game
                echo "  <button class='activity game img'>";
                    echo "<a href='looma-game.php?type=speak&class=" . $game_class . "&subject=" . $game_subject . "'>";
                    echo "    <img src='images/speech1.png'>";
                    keyword("Spoken Vocabulary");
                    echo "</a>";
                    echo "  </button>";
                }
                {  // add vocab translation game
                    echo "  <button class='activity game img'>";
                    echo "<a href='looma-game.php?type=translate&class=" . $game_class . "&subject=" . $game_subject . "'>";
                    echo "    <img src='images/games.png'>";
                    keyword("Vocabulary Translation");
                    echo "</a>";
                    echo "  </button>";
                }
            };

            if ($game_subject === 'math') {
                //makeActivityButton();
                echo '<button class="activity img game" data-class="' . $game_class . '" data-subject="' . $game_subject .
                    '" data-type="arith"> ';

                    echo '<p>';
                         keyword( ucfirst($class_name)); echo ' ';
                         keyword(ucfirst($subject_name));
                    echo '</p>';

                    echo '<p class="small">';
                        keyword("Arithmetic Drill");
                    echo '</p>';
                echo '</button>';
            };
        echo '</div>';
        ?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-game-list.js"></script>
</body>
</html>

