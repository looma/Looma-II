<!doctype html>
<!--
Author: Alexa Thomases, Luke Bowsher, Catie Cassani, Meg Reinstra (2018)
Filename: looma-game.php
Date: June 2018
Description: Creates a game with a scoreboard, timer, and prompts. Information accessed through database.
-->
  <?php $page_title = 'Looma Content Game';

    include ("includes/header.php");
    include ("includes/mongo-connect.php");
  ?>

    <link href='css/looma-gameNEW.css' rel='stylesheet' type='text/css'>
    <link href='css/leaflet.css' rel='stylesheet' type='text/css'>


</head>

<body>

    <div class="container">
        <h1 class="credit"> Created by Luke, Meg, Catie, Alexa and Sun-Mi </h1>

        <?php include ('includes/looma-control-buttons.php');?>

        <?php 
        //include ('looma-game-utilities.php');
        ?>

      <?php 
        // $query = array('_id' => $_id);
        // $cursor = $sienna_collection->find($query);
        // foreach ($cursor as $game)
        // {
        //   $doc = $game;
        // }

        // $title = array_key_exists('name', $doc) ? $doc['name'] : null;
        // $game_type = array_key_exists('presentation_type', $doc) ? $doc['presentation_type'] : null;
        // $time_limit = array_key_exists('timeLimit', $doc) ? $doc['timeLimit'] : null;
        // $prompts = array_key_exists('prompts', $doc) ? $doc['prompts'] : null;

        // $numQuestions = sizeOf($prompts);
        // $currQuestion = 0;
        // $num_teams = 1;
        // $scores = array_fill(0, $num_teams, 0);

        // $numQuestions = 2;
        // $title = "TITLE";
        // $time_limit = 100;
        // $scores = [0];
        $id = isset($_REQUEST['id']) ? $_REQUEST['id'] : null;
        $type = isset($_REQUEST['type']) ? $_REQUEST['type'] : null;
        $class = isset($_REQUEST['class']) ? $_REQUEST['class'] : null;
        $subj = isset($_REQUEST['subj']) ? $_REQUEST['subj'] : null;

        echo '<div class="header">';
        echo '<h1 id="gameTitle"</h1>';
        echo '</div>';

        echo '<div class="thegameframe" id="thegameframe" data-gameid="' . $id .'" data-gametype="'.$type.'" data-randclass="'.$class.'" data-randsubj="'.$subj.'">';
          echo '<section id="gameframe" class="game">';
            echo '<h2 id="top"></h2>';
            echo '<div class="thegame" id="game">';
              echo '<h3 id="current-team"></h3>';
              // echo '<h2 class="question" id="question-number"></h2>';
              // echo '<h2 class="question" id="question"></h2>';
              // echo '<div id="answers"></div>';
            echo '</div>';
            echo '<div id="gameOverFrame" hidden><h2 id="message"></h2><div id="scoreList"></div></div>';
          echo '</section>';

          echo '<section id="optionsframe" hidden>';
            echo '<h2 id="numTeamsHeader"> Select Number of Teams </h2>';
            echo '<div id="teamoptions"></div>';
            echo '<h2 id="scoreMethodHeader"> Select Scoring Method </h2>';
            echo '<div id="scoremethods"></div>';
            echo '<br/><br/>';
            echo '<button id="submitoptions">Go!</button>';
          echo '</section>';
        echo '</div>';

        echo '<div class="timer">';
        echo '<h2 id="time message">Time Left</h2>';
        echo '<h3 id="timer" title="ticking"></h3>';
        echo '</div>';

        echo '<div class="scoreboard">';
        echo '<h2 id="score-message">Score Board:</h2>';
        // echo '<h6 id="scoreboard1" class="scoreboard-scores" title="scoring">'.$scores[0].'</h6>';
        echo '<h2 class="teamscore" id="single-team-score" hidden></h2>';
        echo '<h4 class="teamscore" id="teamscore-1" hidden>Team 1:</h4>';
        echo '<h4 class="teamscore" id="teamscore-2" hidden>Team 2:</h4>';
        echo '<h4 class="teamscore" id="teamscore-3" hidden>Team 3:</h4>';
        echo '<h4 class="teamscore" id="teamscore-4" hidden>Team 4:</h4>';
        echo '<div id="progress"> <h4>Progress:</h4>';
        echo '<div id="progress-bar"><div id="sienna-progress" style="color:red"></div></div>';
        echo '</div>';
        echo '</div>';
      ?>

    <div class = "toolbar">
      <?php include ('includes/toolbar.php'); ?>
    </div>

    </div>


</body>
    <?php include ('includes/js-includes.php'); ?>
    <script type="text/javascript" src="js/looma-scoreboard.js"></script>
    <script type="text/javascript" src="js/looma-gameNEW.js"></script>
    <script type="text/javascript" src="js/looma-timer.js"></script>
    <script type="text/javascript" src="js/leaflet.js"></script>



</html>
