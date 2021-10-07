<!doctype html>
<!--
Author: Alexa , Luke , Catie , Meg, Sun-Mi  (2018)
Filename: looma-game.php
Date: June 2018
Description: Creates a game with a scoreboard, timer, and prompts. Information accessed through database.
-->
  <?php $page_title = 'Looma Team Game';

    include ("includes/header.php");
  ?>

    <link href='css/looma.css'         rel='stylesheet' type='text/css'>
    <link href='css/looma-game.css' rel='stylesheet' type='text/css'>
    <link href='css/leaflet.css'       rel='stylesheet' type='text/css'>


</head>

<body>

    <div class="container">
        <h1 class="credit"> Created by Luke, Meg, Catie, Alexa and Sun-Mi </h1>

        <?php include ('includes/looma-control-buttons.php');?>

        <?php
        //include ('looma-game-utilities.php');
        ?>

      <?php

        $id =    isset($_REQUEST['id']) ? $_REQUEST['id'] : null;
        $type =  isset($_REQUEST['type']) ? $_REQUEST['type'] : null;
        $class = isset($_REQUEST['class']) ? $_REQUEST['class'] : null;
        $subj =  isset($_REQUEST['subject']) ? $_REQUEST['subject'] : null;

        echo '<div class="header">';
        echo '<h1 id="gameTitle" class="title">';
            keyword("Game");
        echo '</h1>';
        echo '</div>';

        echo '<div hidden class="thegameframe" id="thegameframe"' .
                    'data-gameid="'     . $id .
                    '" data-gametype="' . $type .
                    '" data-class="'    . $class .
                    '" data-subject="'  . $subj . '">';
            echo '<div id="top">';
                echo '<span id="current-team"></span>';
                echo '<span id="question-number"></span>';
                echo '<span id="question"></span>';
                echo '<button id="next"></button>';
            echo '</div>';
            echo '<div id="game"></div>';
            echo '<div id="gameOverFrame" hidden><h2 id="message"></h2><div id="scoreList"></div></div>';

        echo '</div>';

        echo '<div id="timer" hidden>';
            echo '<h2 id="timer-message">'; keyword("Timer"); echo '</h2>';
            echo '<h3 id="timer-count" title="ticking"></h3>';
        echo '</div>';

        echo '<div id="scoreboard" hidden>';
            echo '<h2 id="score-message">'; keyword("Score Board"); echo '</h2>';

            echo '<div id="teamscore-1" hidden>';
                echo '<p>'; keyword("Team 1");  echo ':  <span  class="teamscore"></span></p>';
                echo '<div id="progress-1" class="progress-bar"><div class="inner-progress"></div></div>';
            echo '</div>';

            echo '<div id="teamscore-2" hidden>';
                echo '<p>'; keyword("Team 2"); echo ':  <span  class="teamscore"></span></p>';
                echo '<div  id="progress-2" class="progress-bar"><div class="inner-progress"></div></div>';
            echo '</div>';

              echo '<div id="teamscore-3" hidden>';
                  echo '<p>'; keyword("Team 3");  echo ':  <span  class="teamscore"></span></p>';
                  echo '<div  id="progress-3" class="progress-bar"><div class="inner-progress"></div></div>';
              echo '</div>';

              echo '<div id="teamscore-4" hidden>';
                  echo '<p>'; keyword("Team 4");  echo ':  <span  class="teamscore"></span></p>';
                  echo '<div id="progress-4" class="progress-bar"><div class="inner-progress"></div></div>';
             echo '</div>';
        echo '</div>';

      echo '<div id="optionsframe">';
          echo '<h2 id="numTeamsHeader" class="title">'; keyword('Select number of teams'); echo '</h2>';
          echo '<div id="teamoptions">';
          for ($i = 1; $i <= 4; $i++) {
              echo '<button class="teamnumber" data-team="' . $i . '">'; keyword($i); echo '</button>';
          }
      echo '</div>';
      echo '</div>';
      ?>

    <div class = "toolbar">
      <?php include ('includes/toolbar.php'); ?>
    </div>

    </div>


</body>
    <?php include ('includes/js-includes.php'); ?>
    <script type="text/javascript" src="js/looma-game.js"></script>
    <script type="text/javascript" src="js/looma-timer.js"></script>
    <script type="text/javascript" src="js/looma-scoreboard.js"></script>
    <script src="js/leafletjs/leaflet.0.7.3.js"></script>



</html>
