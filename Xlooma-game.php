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

    <link href='css/looma-game.css' rel='stylesheet' type='text/css'>
    <link href='css/leaflet.css' rel='stylesheet' type='text/css'>


</head>

<body>

    <div class="container">
        <h1 class="credit"> Created by Luke, Meg, Catie, Alexa and Sun-Mi </h1>

        <?php include ('includes/looma-control-buttons.php');?>

        <?php include ('looma-game-utilities.php');?>

      <?php 
      //   if (isset($_REQUEST["id"])) {

      if (isset($game_type))
      {
        $numQuestions = sizeOf($doc['prompts']);
        if ($game_type == "multiple choice")
        {
          if ($numQuest <= $numQuestions)
          {
              echo '<div class="header">';
              echo '<h1 id="header" data-questions='.$numQuestions.' title="mc"> Review Game: '.$title.' </h1>';
              echo '</div>';
              echo '<div class="thegameframe" id="thegameframe">';
              callDisplayCQ();
              echo '</div>';
              echo '<div class="timer">';
              echo '<h2 id="timer-message">Time Left</h2>';
              echo '<h3 id="timer" title="ticking">'.$time_limit.'</h3>';
              echo '</div>';
              echo '<div class="scoreboard">';
              echo '<h2 id="score-message">Score:</h2>';
              if ($num_teams <= 1)
              {
                echo '<h6 id="scoreboard1" class="scoreboard-scores" title="scoring">'.$scores[0].'</h6>';
                echo '<div id="progress">';
                echo '<div id="progress-bar"></div>';
                echo '</div>';
              }
              else
              {
                for ($x = 0; $x < $num_teams; $x ++)
                {
                  $tempId = (string)($x + 1);
                  $message = ($x + 1) . ": \t" . (string)$scores[$x];
                  echo '<h6 id="scoreboard'.$tempId.'" class="scoreboard-scores" title="scoring">Team '.$message.'</h6>';
                }
              }
              echo '</div>';
              $numQuest ++;
          }
          else
          {
              echo '<h1>GAME OVER</h1>';
          }
        }
        else if ($game_type == "matching")
        {
            echo '<div class="header">';
            echo '<h1 id="header" data-questions='.$numQuestions.' title="matching"> Matching Game: '.$title.' </h1>';
            echo '</div>';
            echo '<div class="thegameframe" id="thegameframe">';
            echo '<div id = "inframe">';
            echo '</div>';
            displayMatchingQuestion($doc['prompts'], $doc['responses']);
            echo '</div>';
            echo '<div class="timer">';
            echo '<h2 id="timer-message">Time Left</h2>';
            echo '<h3 id="timer" title="ticking">'.$time_limit.'</h3>';
            echo '</div>';
            echo '<div class="scoreboard">';
            echo '<h2 id="score-message">Score:</h2>';
            if ($num_teams <= 1)
            {
              echo '<h6 id="scoreboard1" class="scoreboard-scores" title="scoring">'.$scores[0].'</h6>';
              echo '<div id="progress">';
              echo '<div id="progress-bar"></div>';
              echo '</div>';
            }
            else
            {
              for ($x = 0; $x < $num_teams; $x ++)
              {
                $tempId = (string)($x + 1);
                $message = ($x + 1) . ": \t" . (string)$scores[$x];
                echo '<h6 id="scoreboard'.$tempId.'" class="scoreboard-scores" title="scoring">Team '.$message.'</h6>';
              }
            }
            echo '</div>';
        }
        else if ($game_type == "concentration")
        {
            echo '<div class="header">';
            echo '<h1 id="header" data-questions='.$numQuestions.' title="concentration"> Concentration Game: '.$title.' </h1>';
            echo '</div>';
            echo '<div class="thegameframe" id="thegameframe">';
            echo '<div id = "inframe">';
            echo '</div>';
            displayConcentrationGame($doc['prompts'], $doc['responses']);
            echo '</div>';
            echo '<div class="timer">';
            echo '<h2 id="timer-message">Time Left</h2>';
            echo '<h3 id="timer" title="ticking">'.$time_limit.'</h3>';
            echo '</div>';
            echo '<div class="scoreboard">';
            echo '<h2 id="score-message">Score:</h2>';
            if ($num_teams <= 1)
            {
              echo '<h6 id="scoreboard1" class="scoreboard-scores" title="scoring">'.$scores[0].'</h6>';
              echo '<div id="progress">';
              echo '<div id="progress-bar"></div>';
              echo '</div>';
            }
            else
            {
              for ($x = 0; $x < $num_teams; $x ++)
              {
                $tempId = (string)($x + 1);
                $message = ($x + 1) . ": \t" . (string)$scores[$x];
                echo '<h6 id="scoreboard'.$tempId.'" class="scoreboard-scores" title="scoring">Team '.$message.'</h6>';
              }
            }
            echo '</div>';
        }
        else if ($game_type == "timeline")
        {
            echo '<div class="header">';
            echo "<h1 id = 'header' data-questions='$numQuestions' title = 'timeline'> Timeline Game: $title </h1>";
            echo '</div>';

            echo '<div class="thegameframe" id="thegameframe">';
            displayTimeline($doc['prompts']);
            echo '</div>';

            echo '<div class="timer">';
            echo '<h2 id="timer-message">Time Left</h2>';
            echo '<h3 id="timer" title="ticking">'.$time_limit.'</h3>';
            echo '</div>';
            echo '<div class="scoreboard">';
            echo '<h2 id="score-message">Score:</h2>';
            if ($num_teams <= 1)
            {
              echo '<h6 id="scoreboard1" class="scoreboard-scores" title="scoring">'.$scores[0].'</h6>';
              echo '<div id="progress">';
              echo '<div id="progress-bar"></div>';
              echo '</div>';
            }
            else
            {
              for ($x = 0; $x < $num_teams; $x ++)
              {
                $tempId = (string)($x + 1);
                $message = ($x + 1) . ": \t" . (string)$scores[$x];
                echo '<h6 id="scoreboard'.$tempId.'" class="scoreboard-scores" title="scoring">Team '.$message.'</h6>';
              }
            }
            echo '</div>';
        }
        else if ($game_type == "map")
        {
          if ($numQuest <= $numQuestions)
          {
              echo '<div class="header">';
              echo '<h1 id="header" data-questions='.$numQuestions.' title="map"> Map Game: '.$title.' </h1>';
              echo '</div>';
              echo '<div class="thegameframe" id="thegameframe">';
              callDisplayMap();
              echo '</div>';
              echo '<div class="timer">';
              echo '<h2 id="timer-message">Time Left</h2>';
              echo '<h3 id="timer" title="ticking">'.$time_limit.'</h3>';
              echo '</div>';
              echo '<div class="scoreboard">';
              echo '<h2 id="score-message">Score:</h2>';
              if ($num_teams <= 1)
              {
                echo '<h6 id="scoreboard1" class="scoreboard-scores" title="scoring">'.$scores[0].'</h6>';
                echo '<div id="progress">';
                echo '<div id="progress-bar"></div>';
                echo '</div>';
              }
              else
              {
                for ($x = 0; $x < $num_teams; $x ++)
                {
                  $tempId = (string)($x + 1);
                  $message = ($x + 1) . ": \t" . (string)$scores[$x];
                  echo '<h6 id="scoreboard'.$tempId.'" class="scoreboard-scores" title="scoring">Team '.$message.'</h6>';
                }
              }
              echo '</div>';
              $numQuest ++;
          }
          else
          {
              echo '<h1>GAME OVER</h1>';
          }
        }
        } //end if isset()
        else 
        {
              // ob_start();
              // var_dump($game_type);
              // $c = ob_get_contents();
              // ob_end_clean();
              // error_log("!!!!!!!" . json_decode($c),3,'log.txt');          
              echo 'no game found';
        }
    
      ?>

    <div class = "toolbar">
      <?php include ('includes/toolbar.php'); ?>
    </div>

    </div>


</body>
    <?php include ('includes/js-includes.php'); ?>
    <script type="text/javascript" src="js/looma-scoreboard.js"></script>
    <script type="text/javascript" src="js/looma-game.js"></script>
    <script type="text/javascript" src="js/looma-timer.js"></script>
    <script type="text/javascript" src="js/leaflet.js"></script>



</html>
