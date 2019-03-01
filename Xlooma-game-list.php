<!doctype html>
<!--
Filename: looma-game-list.php
Date: 7/2018
Description: 

Author: Luke, Alexa 
Owner:  VillageTech Solutions (villagetechsolutions.org)
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma Game List';
    require_once ('includes/header.php');
    define ("CLASSES", 8);
?>

<?php include ("includes/mongo-connect.php"); ?>

<link rel="stylesheet" href="css/looma-game-list.css">

</head>

<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">
            <?php 
                if (isset($_REQUEST["type"])) $type = $_REQUEST["type"];
                echo '<div id="thescreen">';
                if (isset($type))
                {
                    if ($type == 'mc')
                    {
                        if (isset($_REQUEST["class"])) $class = $_REQUEST["class"];
                        if (isset($_REQUEST["subject"])) $subject = $_REQUEST["subject"];

                        echo '<div id="header">';
                        echo '<h1 id="mchead">Multiple Choice Games</h1>';
                        echo '</div>';
                        echo '<div id="middle">';
                        if (isset($_REQUEST["id"]))
                        {
                            echo '<h1>Choose Your Scoring Type: </h1>';
                            echo '<button title="buttons" class="scoreButtons" id="rocket">Rocket Launch</button>';
                            echo '<button title="buttons" class="scoreButtons" id="horse">Horse Race</button>';
                            echo '<button title="buttons" class="scoreButtons" id="car">Car Race</button>';
                            echo '<h1 id="teams-message">How Many Teams?</h1>';
                            $gamess = $games_collection->find();
                            $ableTeams = [1];
                            foreach ($gamess as $game)
                            {
                                if ($game['_id'] == $_REQUEST["id"])
                                {
                                    $ableTeams = $game['possible-teams'];
                                }
                            }
                            for ($i = 1; $i < 5; $i++)
                            {
                                if (in_array($i, $ableTeams))
                                {
                                    echo '<button title="buttons" class="teamButtons">'.$i.'</button>';
                                }
                            }
                            echo '<button title="buttons" id="play">Play Game</button>';
                        }
                        else if (isset($subject))
                        {
                            $subject = $_REQUEST["subject"];
                            $gamess = $games_collection->find();
                            $chId = '' . $class . $subject;
                            $numGames = 0;
                            foreach ($gamess as $game)
                            {
                                if ($game['presentation_type'] == "multiple choice")
                                {
                                    $gChId = substr($game['ch_id'], 0, strlen($chId));
                                    if ($gChId == $chId)
                                    {
                                        echo '<button title="buttons" data-id='.$game['_id'].' class="mc-buttons">'.$game['title'].'</button>';
                                        $numGames ++;
                                    }
                                }
                            }
                            if ($numGames == 0)
                            {
                                echo '<h1>Sorry, there are no multiple choice games yet for this class and subject</h1>';
                            }
                        }
                        else if (isset($class))
                        {
                            echo '<h1>Choose Your Subject</h1>';
                            echo '<button title="buttons" class="subjectbuttons" id="S">Science</button>';
                            echo '<button title="buttons" class="subjectbuttons" id="M">Math</button>';
                            echo '<button title="buttons" class="subjectbuttons" id="SS">Social Studies</button>';
                            echo '<button title="buttons" class="subjectbuttons" id="EN">English</button>';
                        }
                        else
                        {
                            echo '<h1>Choose Your Class</h1>';
                            for ($i = 1; $i <= 8; $i ++)
                            {
                                echo '<button title="buttons" class="classbuttons" id="grade'.$i.'">Class '.$i.'</button>';
                            }
                        }
                        echo '</div>';
                    }
                    else if ($type == 'matching') 
                    {
                        echo '<div id="header">';
                        echo '<h1 id="head"> Matching Games </h1>';
                        echo '</div>';
                        echo '<div id="middle">';
                        if (isset($_REQUEST["origin"])) $origin = $_REQUEST["origin"];
                        if (isset($_REQUEST["class"])) $class = $_REQUEST["class"];

                        if (isset($origin))
                        {
                            if ($origin == 'vocab')
                            {
                                if (isset($class))
                                { 
                                    echo 'rip gotta actually get the games';
                                }
                                else
                                {
                                    echo '<div id="thebuttons">';
                                    for ($i = 1; $i <= 8; $i ++)
                                    {
                                        echo '<button title="buttons" class="vocabclass" id="grade'.$i.'">Class '.$i.'</button>';
                                    }
                                    echo '</div>';
                                }
                            }
                            else if ($origin == 'premade')
                            {
                                $gamess = $games_collection->find();
                                $numGames = 0;
                                foreach ($gamess as $game)
                                {
                                    if ($game['presentation_type'] == "matching")
                                    {
                                        echo '<button title="buttons" data-id='.$game['_id'].' class="matching-buttons">'.$game['title'].'</button>';
                                        $numGames ++;
                                    }
                                }
                                if ($numGames == 0)
                                {
                                    echo '<h1>Sorry, there are no matching games yet</h1>';
                                }
                            }
                        }
                        else
                        {
                            echo '<div id="thebuttons">';
                            echo '<button title="buttons" class="origins" id="vocab">Vocab</button>';
                            echo '<button title="buttons" class="origins" id="premade">Pre-Made</button>';
                            echo '</div>';
                        }
                        echo '</div>';
                    }
                    else if ($type == "concentration")
                    {
                        echo '<div id="header">';
                        echo '<h1 id="head"> Concentration Games </h1>';
                        echo '</div>';
                        echo '<div id="middle">';
                        if (isset($_REQUEST["origin"])) $origin = $_REQUEST["origin"];
                        if (isset($_REQUEST["class"])) $class = $_REQUEST["class"];

                        if (isset($origin))
                        {
                            if ($origin == 'vocab')
                            {
                                if (isset($class))
                                { 
                                    echo 'rip gotta actually get the games';
                                }
                                else
                                {
                                    echo '<div id="thebuttons">';
                                    for ($i = 1; $i <= 8; $i ++)
                                    {
                                        echo '<button title="buttons" class="vocabclass" id="grade'.$i.'">Class '.$i.'</button>';
                                    }
                                    echo '</div>';
                                }
                            }
                            else if ($origin == 'premade')
                            {
                                $gamess = $games_collection->find();
                                $numGames = 0;
                                foreach ($gamess as $game)
                                {
                                    if ($game['presentation_type'] == "concentration")
                                    {
                                        echo '<button title="buttons" data-id='.$game['_id'].' class="conc-buttons">'.$game['title'].'</button>';
                                        $numGames++;
                                    }
                                }
                                if ($numGames == 0)
                                {
                                    echo '<h1>Sorry, there are no concentration games yet</h1>';
                                }
                            }
                        }
                        else
                        {
                            echo '<div id="thebuttons">';
                            echo '<button title="buttons" class="origins" id="vocab">Vocab</button>';
                            echo '<button title="buttons" class="origins" id="premade">Pre-Made</button>';
                            echo '</div>';
                        }
                        echo '</div>';
                    }
                    else if ($type == "timeline")
                    {
                        echo '<div id="header">';
                        echo '<h1 id="head"> Timeline Games </h1>';
                        echo '</div>';
                        echo '<div id="middle">';
                        $gamess = $games_collection->find();
                        $numGames = 0;
                        foreach ($gamess as $game)
                        {
                            if ($game['presentation_type'] == "timeline")
                            {
                                echo '<button title="buttons" data-id='.$game['_id'].' class="timeline-buttons">'.$game['title'].'</button>';
                                $numGames++;
                            }
                        }
                        if ($numGames == 0)
                        {
                            echo '<h1>Sorry, there are no timeline games yet</h1>';
                        }
                        echo '</div>';
                    }
                    elseif ($type == "map")
                    {
                        echo '<div id="header">';
                        echo '<h1 id="head">New Map Games </h1>';
                        echo '</div>';
                        echo '<div id="middle">';
                        if (isset($_REQUEST["id"]))
                        {
                            $gamess = $games_collection->find();
                            foreach ($gamess as $game)
                            {
                                if ($game['_id'] == $_REQUEST["id"])
                                {
                                    $possibleTeams = $game['possible-teams'];
                                    echo '<h1 id="teams-message">How Many Teams?</h1>';
                                    for ($i = 1; $i < 5; $i++)
                                    {
                                        if (in_array($i, $possibleTeams))
                                        {
                                            echo '<button title="buttons" class="teamButtons">'.$i.'</button>';
                                        }
                                    }
                                    echo '<button title="buttons" id="play">Play Game</button>';
                                }
                            }
                        }
                        else
                        {
                            $gamess = $games_collection->find();
                            foreach ($gamess as $game)
                            {
                                if ($game['presentation_type'] == "map")
                                {
                                    echo '<button title="buttons" data-id='.$game['_id'].' class="map-buttons">'.$game['title'].'</button>';
                                }
                            }
                        }
                        echo '</div>';
                    }
                }
                else
                {
                    echo 'choose type';
                }
                echo '</div>';

            ?>

            <?php include ('includes/looma-control-buttons.php');?>
        </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>


    <script src="js/looma-game-list.js"></script>          <!--  Javascript for this page-->
</body>
</html>
