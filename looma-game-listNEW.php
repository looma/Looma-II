<!doctype html>
<!--
Filename: looma-game-list.php
Date: 7/2018
Description: 

Author: Luke, Alexa, Sienna
Owner:  VillageTech Solutions (villagetechsolutions.org)
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma Game List';
    require_once ('includes/header.php');
    require_once ('includes/looma-utilities.php');
    require_once ("includes/mongo-connect.php");
?>

<link rel="stylesheet" href="css/looma-game-listNEW.css">

<?php

    if (!isset($_REQUEST["type"])) { //redirect back to looma-games.php
        ob_start();
        header('Location: ' . 'looma-games.php');
        ob_end_flush();
        exit();
    };

    $game_type = $_REQUEST["type"];

        $subject_key = array("M"=>"Math",    "S"=>"Science",         "N"=>"Nepali",
                             "EN"=>"English", "SS"=>"Social Studies", "V"=>"Vocational", "H"=>"Health");

        $titles = array("multiple choice"             =>"Multiple Choice",
                        "concentration"  =>"Concentration",
                        "matching"       =>"Matching",
                        "map"            =>"Map",
                        "timeline"       =>"History");
        $mc = array();
        $match = array();
        $conc = array();
        //$timelines = array();
        //$maps = array();

        $cursor =  $games_collection->find(array('presentation_type'=>$game_type))->sort(array('ch_id'=>1));
        foreach ($cursor as $game)
        {
            $id = $game['_id'];
            $name =  isset($game['title']) ? $game['title'] : null;

            if (isset($game['ch_id'])) {
                $ch_id = $game['ch_id'];

                //echo "subject of " . $ch_id . " is " . ch_idSubject($ch_id);

                $class = ch_idClass($ch_id)   ? ch_idClass($ch_id) : '1';
                $subj =  ch_idSubject($ch_id) ? $subject_key[ch_idSubject($ch_id)] : 'EN';
            } else {  // no ch_id for this game, use default class1, english
                $class = "1";
                $subj =  "EN";
            };

    //////
    ///// NOTE: case statement below gathers a data structure of game options (sienna's code)
    //////

            switch ($game_type) {

    ////////////////////////////////////
    /////////// MULTIPLE CHOICE ////////
    ////////////////////////////////////
                case "multiple choice":
                    if (array_key_exists($class,$mc)) {
                        if (array_key_exists($subj, $mc[$class])) {
                            $temp = array($name,$id);
                            array_push($mc[$class][$subj], $temp);
                            // $mc[$class][$subj] = array($name,$id);
                        } else {
                            // $mc[$class][$subj] = array($name);
                            $temp = array($name,$id);
                            $mc[$class][$subj] = array($temp);
                        }

                    } else {
                        $nameArr = array($name,$id);
                        $temp = array($nameArr);
                        $subjArr = array($subj=>$temp);
                        $mc[$class] = $subjArr;
                    }
                    break;

    ////////////////////////////////////
    /////////// MATCHING        ////////
    ////////////////////////////////////
                case "matching":
                    if (array_key_exists($class,$match)) {
                        if (array_key_exists($subj, $match[$class])) {
                            $temp = array($name,$id);
                            array_push($match[$class][$subj], $temp);
                            // $match[$class][$subj] = array($name,$id);
                        } else {
                            // $match[$class][$subj] = array($name);
                            $temp = array($name,$id);
                            $match[$class][$subj] = array($temp);
                        }

                    } else {
                        $nameArr = array($name,$id);
                        $temp = array($nameArr);
                        $subjArr = array($subj=>$temp);
                        $match[$class] = $subjArr;
                    }
                    break;

    ////////////////////////////////////
    /////////// CONCENTRATION   ////////
    ////////////////////////////////////
               case "concentration":
                    if (array_key_exists($class,$conc)) {
                        if (array_key_exists($subj, $conc[$class])) {
                            $temp = array($name,$id);
                            array_push($conc[$class][$subj], $temp);
                            // $conc[$class][$subj] = array($name,$id);
                        } else {
                            // $conc[$class][$subj] = array($name);
                            $temp = array($name,$id);
                            $conc[$class][$subj] = array($temp);
                        }

                    } else {
                        $nameArr = array($name,$id);
                        $temp = array($nameArr);
                        $subjArr = array($subj=>$temp);
                        $conc[$class] = $subjArr;
                    }
                    break;
                default:
                    break;
            }
        }

        $settings_tree = array("multiple choice"=>$mc, "matching"=>$match, "concentration"=>$conc);
    ?>

</head>

<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">

          <?php             

            //// history and map games selection
           if ($game_type == "timeline" || $game_type == "map"){
               echo "<h1>". $titles[$game_type] . " Game Selection</h1>";
               echo '<div id="middle>">';

             //TODO: the find() below is the 2nd time we have retrieved the games from Mongo

             $games = $games_collection->find(array('presentation_type'=>$game_type));
             if ($games) {
                 foreach ($games as $game) {

                     echo '<a href="looma-gameNEW.php?id=' . $game['_id'] . '">';
                     echo '<button title="buttons" data-id="' .
                         $game['_id'] . '" class="activity play img">' .
                         $game['title'] . '</button></a>';
                 }
             } else echo "<h1>There are no $game_type games yet</h1>";
             echo '</div>';
           }

           //// concentration, and matching games selection
           else if ($game_type == "concentration" || $game_type == "multiple choice") {
               // class options
               echo "<h1>". $titles[$game_type] . " Game Selection</h1>";
               echo '<div class="game-button-div" id="row1">';
               foreach ($settings_tree[$game_type] as $classNum => $subjList) {

                   echo '<button type="button" class="class button-8 " data-class="' . $classNum . '">';

                   echo '<p class="little">';
                   keyword("Class");
                   echo '</p>';
                   keyword($classNum);
                   echo ' </button>';
               }
               echo '</div>';

               // subject options
               echo '<div class="game-button-div" id="row2">';
               foreach ($settings_tree[$game_type] as $classNum => $subjList) {
                   foreach ($subjList as $subj => $quizzes) {

                       echo '<button type="button" class="subject button-8" data-subj="' . $subj . '" data-class="' . $classNum . '">';


                       //echo '<button type="button" class="subject class-' . $classNum . '" id="subj-' . $subj . '">';
                       echo '<p class="little">';
                       keyword($subj);
                       echo '</p>';
                       echo ' </button>';
                   }
               }
               echo '</div>';

               // quiz options
               echo '<div class="game-button-div" id="row3">';
               foreach ($settings_tree[$game_type] as $classNum => $subjList) {
                   foreach ($subjList as $subj => $quizzes) {
                       foreach ($quizzes as $quiz) {

                           echo '<button type="button"  class="quiz" data-id="' . $quiz[1] . '" data-class="' . $classNum . '" data-subj="' . $subj . '">';


                           //echo '<button id="' . $quiz[1] . '" type="button" class="quiz class-' . $classNum . ' subj-' . $subj . '">';
                           echo '<p class="little">';
                           keyword($quiz[0]);
                           echo '</p>';
                           echo ' </button>';
                       }
                   }
               }
               echo '</div>';
           }

           //// matching games selection
           else if ($game_type == "matching") {
               // ROW 1 - class options
               echo "<h1>". $titles[$game_type] . " Game Selection</h1>";
               echo '<div class="game-button-div" id="row1">';
               for ($i = 1; $i <= 10; $i++) {
                   echo '<button type="button" class="class button-8" data-class="' . $i . '">';
                   echo '<p class="little">';
                   keyword("Class");
                   echo '</p>';
                   keyword($i);
                   echo ' </button>';
               }
               echo '</div>';

               // ROW 2- subject options
               echo '<div class="game-button-div" id="row2">';

               //always an English subject button (for vocab)
                for ($i = 1; $i <= 10; $i++) {
                        echo '<button type="button" class="subject button-8"    data-subj="English"      data-class="' . $i . '">';
                   echo '<p class="little">';
                   keyword('English');
                   echo '</p>';
                   echo ' </button>';
                }

               foreach ($settings_tree[$game_type] as $classNum => $subjList) {
                   foreach ($subjList as $subj => $quizzes) {
                       if ($subj != 'EN') {
                           echo '<button type="button" class="subject button-8" data-subj="' . $subj . '" data-class="' . $classNum . '">';
                       echo '<p class="little">';
                       keyword($subj);
                       echo '</p>';
                       echo ' </button>';
                   }}
               }
               echo '</div>';

               // ROW 3 - quiz options
               echo '<div class="game-button-div" id="row3">';

               // every class - english has a 'word game' button
                   for ($i = 1; $i <= 10; $i++) {
                       echo '<button type="button"       class="quiz" data-id="random"        data-class="' . $i . '"        data-subj="English">';
                       echo '<p class="little">';
                       keyword("Word Game");
                       echo '</p>';
                       echo ' </button>';
                   };

               foreach ($settings_tree[$game_type] as $classNum => $subjList) {
                   foreach ($subjList as $subj => $quizzes) {
                       foreach ($quizzes as $quiz) {

           // next line should be "data-dn=" instead of "id="

                           echo '<button type="button"  class="quiz" data-id="' . $quiz[1] . '" data-class="' . $classNum . '" data-subj="' . $subj . '">';
                           echo '<p class="little">';
                           keyword($quiz[0]);
                           echo '</p>';
                           echo ' </button>';
                       }
                   }
               }
               echo '</div>';

        /*
              // matching random
                   echo '<div class="game-button-div" id="row4">';
                   echo '<button id="random">Random Game</button>';
                   echo '</div><br/>';
                   echo '<div class="game-button-div" id="row5">';
                   for ($i = 1; $i <= 10; $i++) {
                       echo '<button class="random-class" id="random-class-' . $i . '"><p class="little">' . $i . '</p></button>';
                   }
                   echo '</div><br/>';

                   // for now, only use ENGLISH.
                   // when LOOMA has dictionary for other subjects, replace $english_only_subject_key with $subject_key
                   echo '<div class="game-button-div" id="row6">';
                   $english_only_subject_key = array("E" => "English");
                   foreach ($english_only_subject_key as $key => $sub) {
                       echo '<button class="random-subj" id="random-subj-' . $sub . '"><p class="little">' . $sub . '</p></button>';
                   }
                   echo '</div>';
        */
           }
           else echo "<h1>Unknown game type</h1>";
            ?> 

            <?php include ('includes/looma-control-buttons.php');?>
        </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/looma-game-listNEW.js"></script>          <!--  Javascript for this page-->
</body>
</html>

