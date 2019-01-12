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
    require_once ("includes/mongo-connect.php");
    define ("CLASSES", 8);
?>

<link rel="stylesheet" href="css/looma-game-listNEW.css">

<?php 
        if (!isset($_REQUEST["type"])) {
            //redirect back to looma-games.php
            ob_start();
            header('Location: ' . 'looma-games.php');
            ob_end_flush();
            exit();
        }

    $game_type = $_REQUEST["type"];

//TODO: complete this list

        //TODO: list of subjects not correct
        $subject_key = array("M"=>"Math", "S"=>"Science", "H"=>"History", "N"=>"Nepali", "E"=>"English");
        $titles = array("mc"           =>"Multiple Choice",
                        "concentration"=>"Concentration",
                        "matching"     =>"Matching",
                        "map"          =>"Map",
                        "timeline"     =>"Timeline");
        $mc = array();
        $match = array();
        $conc = array();
        $timelines = array();
        $maps = array();

        $cursor =  $games_collection->find(array());
        foreach ($cursor as $game)
        {
            $id = $game['_id'];
            $type =  isset($game['presentation_type']) ? $game['presentation_type'] : null;
            $ch_id = isset($game['ch_id']) ? $game['ch_id'] : null;
            $name =  isset($game['title']) ? $game['title'] : null;

            //TODO: extraction of class not correct for 10 and 11
            $class = isset($game['ch_id']) ? $ch_id{0} : null;

            //TODO: extraction of subject not correct
            $subj  = (isset($game['ch_id']) && isset($subject_key[$ch_id{1}])) ? $subject_key[$ch_id{1}] : null;

            //TODO: clean up and handle default
            switch ($type) {
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

        $settings_tree = array("mc"=>$mc, "matching"=>$match, "concentration"=>$conc);

        // switch ($game_type) {
        //     case "concentration":
        //         echo "<h1>Concentration Game Options</h1>";
        //         // $unique_game_types[$game["presentation_type"]] = "Concentration Games";
        //         break;
        //     case "mc":
        //         echo "<h1>Multiple Choice Game Options</h1>";
        //         // $unique_game_types["mc"] = "Multiple Choice Games";
        //         break;
        //     case "matching":
        //         echo "<h1>Matching Game Options</h1>";
        //         // $unique_game_types[$game["presentation_type"]] = "Matching Games";
        //         break;
        //     // case "timeline":
        //     //     $unique_game_types[$game["presentation_type"]] = "Timeline Games";
        //     //     break;
        //     // case "map":
        //     //     $unique_game_types[$game["presentation_type"]] = "New Map Games";
        //     //     break;
        //     default: //redirect back to looma-games.php 
        //         ob_start();
        //         header('Location: ' . 'looma-games.php');
        //         ob_end_flush();
        //         exit();
        // }
?>

</head>

<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">

          <?php             
           echo "<h1>". $titles[$game_type] . " Game Options</h1>";

           if ($game_type == "timeline" || $game_type == "map"){
             echo '<div id="middle>">';
             $timelines = $games_collection->find(array('presentation_type'=>$game_type));
             if ($timelines) {
                 foreach ($timelines as $timeline) {

                     echo '<a href="looma-game.php?id=' . $timeline['_id'] . '">';
                     echo '<button title="buttons" data-id="' .
                           $timeline['_id'] . '" class="timeline-buttons">' .
                           $timeline['title'] . '</button></a>';
                 }
             } else echo "<h1>There are no timeline games yet>/h1>";
             echo '</div>';

           } else {
               // class options
               echo '<div class="game-button-div" id="row1">';
               foreach ($settings_tree[$game_type] as $classNum => $subjList) {
                   echo '<button type="button" class="class button-8" id="class' . $classNum . '">';
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
                       echo '<button type="button" class="subject class-' . $classNum . '" id="subj-' . $subj . '">';
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
                           echo '<button id="' . $quiz[1] . '" type="button" class="quiz class-' . $classNum . ' subj-' . $subj . '">';
                           echo '<p class="little">';
                           keyword($quiz[0]);
                           echo '</p>';
                           echo ' </button>';
                       }
                   }
               }
               echo '</div>';

               // matching random
               if ($game_type === "matching") {
                   echo '<div class="game-button-div" id="row4">';
                   echo '<button id="random">Random Game</button>';
                   echo '</div><br/>';
                   echo '<div class="game-button-div" id="row5">';
                   for ($i = 1; $i <= 10; $i++) {
                       echo '<button class="random-class" id="random-class-' . $i . '"><p class="little">' . $i . '</p></button>';
                   }
                   echo '</div><br/>';

                   // for now, only use ENGLISH. later, replace $english_only_subject_key with $subject_key
                   echo '<div class="game-button-div" id="row6">';
                   $english_only_subject_key = array("E" => "English");
                   foreach ($english_only_subject_key as $key => $sub) {
                       echo '<button class="random-subj" id="random-subj-' . $sub . '"><p class="little">' . $sub . '</p></button>';
                   }
                   echo '</div>';
               }
           }
            ?> 

            <?php include ('includes/looma-control-buttons.php');?>
        </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>


    <script src="js/looma-game-listNEW.js"></script>          <!--  Javascript for this page-->
</body>
</html>

