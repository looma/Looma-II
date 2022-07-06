<!-- Author: Luke Bowsher, Catie Cassani, Sun-Mi Oh, Meg Reinstra, Alexa Thomases
Filename: looma-game-utilities.php
Date: June 2018
Description: fills in the actual content for each of the games as specified by the JSON’s “presentation type.”
-->

<!--    NOTE: THIS FILE IS NO LONGER USED   -->

<!doctype html>

<?php include ("includes/mongo-connect.php"); ?>

<?php
$doc;
if (!isset($_REQUEST["id"]))
{
    $doc = $_POST;
}
else
{
    $_id = new MongoID($_REQUEST['id']);

    if (isset($_REQUEST["class"])) $class = $_REQUEST["class"];

    if (isset($_REQUEST["scoring"])) $scoring = $_REQUEST["scoring"];

    if (isset($game)) $query = array("chapter" => $game);

    else $query = array('_id' => $_id);

    //$cursor =  $games_collection->find($query, array("title"=>1, "presentation_type" => 1, "timeLimit" =>1, "pointsToWin" =>1, "pointsCorrect" =>1, "pointsWrong" =>1, "prompts"=>1, "responses"=>1, "geojson"=>1, "key"=>1, "startLat"=>1, "startLong"=>1, "startZoom"=>1));
    $cursor = mongoFind($games_collection, $query, null, null, null);
    //Load Game

    foreach ($cursor as $theQuestion)
    {
        $doc = $theQuestion;
    }
}

$title = isset( $doc['title']) ? $doc['title'] : null;
$game_type = isset( $doc['presentation_type']) ? $doc['presentation_type'] : null;
$time_limit = isset( $doc['timeLimit']) ? $doc['timeLimit'] : null;

$num_teams = 1;
$currentTeam = 1;
if (isset($_REQUEST["teams"]))
{
    $temp_num_teams = $_REQUEST["teams"];
    if ($temp_num_teams > 1)
    {
        $num_teams = $temp_num_teams;
    }
}
$numberOfQuestions = sizeOf($doc['prompts']);
$numQuest = 1;
$scores = array_fill(0, $num_teams, 0);
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST["id"]))
{
    $numQuest = $_POST['question'];
    if ($numQuest <= $numberOfQuestions)
    {
        global $currentTeam;
        $scores = $_POST['score'];
        $currentTeam = $_POST['team'];
        if ($game_type == "multiple choice")
        {
            callDisplayCQ();
        }
        else if ($game_type == "map")
        {
            callDisplayMap();
        }
    }
    else
    {
        echo '<h1>GAME OVER</h1>';
    }
}

//display the intermediate page
function displayIntermediate()
{
    echo '<div id="intermediate">';
    echo '<h1 id="interm header"></h1>';
    //cool scoreboard
    echo '<div id="bigscoreboard">';
    global $scoring;
    global $num_teams;
    if ($scoring == "rocket")
    {
        for ($x = 1; $x <= $num_teams; $x ++)
        {
            echo '<img id="low'.$x.'" class="bigvertiscore" src="images/gamesimages/earth.png"></img>';
            echo '<img id="high'.$x.'" class="bigvertiscore" src="images/gamesimages/moon.png"></img>';
            echo '<img id="vert-marker'.$x.'" class="bigvertiscore" src="images/gamesimages/rocket.png"></img>';
        }
    }
    elseif ($scoring == "horse")
    {
        for ($x = 1; $x <= $num_teams; $x ++)
        {
            echo '<img id="wide-left'.$x.'" class="bighoriscore" src="images/gamesimages/checkered-flag.png"></img>';
            echo '<img id="wide-right'.$x.'" class="bighoriscore" src="images/gamesimages/checkered-flag.png"></img>';
            echo '<img id="hori-marker'.$x.'" class="bighoriscore" src="images/gamesimages/horse.png"></img>';
        }
    }
    elseif ($scoring == "car")
    {
        for ($x = 1; $x <= $num_teams; $x ++)
        {
            echo '<img id="wide-left'.$x.'" class="bighoriscore" src="images/gamesimages/checkered-flag.png"></img>';
            echo '<img id="wide-right'.$x.'" class="bighoriscore" src="images/gamesimages/checkered-flag.png"></img>';
            echo '<img id="hori-marker'.$x.'" class="bighoriscore" src="images/gamesimages/car.png"></img>';
        }
    }
    echo '<br></br>';
    echo '</div>';
    echo '<button id="sender">Next Question</button>';
    echo '</div>';

}

/*********************************MULTIPLE CHOICE****************************/

//params - $doc, $time_limit, $score
function callDisplayCQ()
{
    global $numQuest;
    global $doc;
    global $num_teams;
    global $currentTeam;
    echo '<section id="gameframe" class="game">';
    if ($num_teams > 1)
    {
        $promptDisplay = "Question Number {$numQuest}, Team {$currentTeam}";
    }
    else
    {
        $promptDisplay = "Question Number {$numQuest}";
    }
    echo '<h2 id="top" data-numteams='.$num_teams.'>'.$promptDisplay.'</h2>';
    $thePrompt = $doc['prompts'][$numQuest - 1];
    displayContentQuestion($thePrompt);
    echo '</section>';
    displayIntermediate();
    $numQuest ++;
}

//display content question
function displayContentQuestion($prompt)
{
    $question = "";
    $correctAns = "";
    $wrongAns1 = "";
    $wrongAns2 = "";
    $wrongAns3 = "";
    $numAns = 0;

    if(isset($prompt['question']))
    {
        $question = $prompt['question'];
    }
    if(isset($prompt['correctAns']))
    {
        $correctAns = $prompt['correctAns'];
        $numAns++;
    }
    if(isset($prompt['wrongAns'][0]))
    {
        $wrongAns1 = $prompt['wrongAns'][0];
        $numAns++;
    }
    if(isset($prompt['wrongAns'][1]))
    {
        $wrongAns2 = $prompt['wrongAns'][1];
        $numAns++;
    }
    if(isset($prompt['wrongAns'][2]))
    {
        $wrongAns3 = $prompt['wrongAns'][2];
        $numAns++;
    }

    echo '<div class="thegame" id="game">';
    echo '<h2 class="question" id="question">'.$question.'</h2>';
    $random = range(0, $numAns - 1);
    shuffle($random);
    for ($i = 0; $i < $numAns; $i++)
    {
        if ($i == $random[0])
        {
            echo  '<button class="right" id="correct">'.$correctAns.'</button>';
            echo '<br></br>';
        }
        else if ($i == $random[1])
        {
            echo  '<button class="wrong" id="incorrect1">'.$wrongAns1.'</button>';
            echo '<br></br>';
        }
        else if ($i == $random[2])
        {
            echo  '<button class="wrong" id="incorrect2">'.$wrongAns2.'</button>';
            echo '<br></br>';
        }
        else
        {
            echo  '<button class="wrong" id="incorrect3">'.$wrongAns3.'</button>';
            echo '<br></br>';
        }
    }

    echo '</div> '; //ends game div
}  //end of displayContentQuestion

/*************************** MATCHING GAME ***************************/

//display matching question
function displayMatchingQuestion($prompts, $responses)
{
    if (sizeof($prompts) == 0) // randomly generate
    {
        echo 'trying';
    }
    else
    {
        $promptList = array();
        $responseList = array();

        // creates array of prompts and responses
        for ($num = 0; $num < 5; $num++)
        {
            if(isset($prompts[$num]))
            {
                array_push($promptList,'<button class = "prompt ' .  $num . '" draggable="true">' . $prompts[$num] . '</button>');
            }
            if(isset($responses[$num]))
            {
                array_push($responseList,'<button class = "response ' .  $num . '">' .$responses[$num]. '</button>');
            }
        }

        $random = range(0, 4);
        shuffle($random);

        // randomizes order of prompts on screen
        echo '<div id = "promptdiv">';
        for ($i = 0; $i < 5; $i++)
        {
            if ($i == $random[0])
            {
                echo $promptList[0];
            }
            else if ($i == $random[1])
            {
                echo $promptList[1];
            }
            else if ($i == $random[2])
            {
                echo $promptList[2];
            }
            else if ($i == $random[3])
            {
                echo $promptList[3];
            }
            else
            {
                echo $promptList[4];
            }
        }
        echo '</div>';

        //randomizes order of responses on screen
        echo '<div id= "responsediv">';
        shuffle($random);
        for ($i = 0; $i < 5; $i++)
        {
            if ($i == $random[0])
            {
                echo $responseList[0];
            }
            else if ($i == $random[1])
            {
                echo $responseList[1];
            }
            else if ($i == $random[2])
            {
                echo $responseList[2];
            }
            else if ($i == $random[3])
            {
                echo $responseList[3];
            }
            else
            {
                echo $responseList[4];
            }

        }
        echo '</div>';
    }
} //end of displayMatchingQuestion

/************************** CONCENTRATION GAME **************************/

//display the concentration game
function displayConcentrationGame($prompts, $responses)
{
    //assumes this is five questions, five answers
    $promptsAndAns = array();

    //ids can't have spaces: making spaces into hyphens
    for ($i = 0; $i < 5; $i++)
    {
        $temp = $prompts[$i];
        $prompts[$i] = str_replace(' ', '-', $temp);
        $temp = $responses[$i];
        $responses[$i] = str_replace(' ', '-', $temp);
    }

    for ($i = 0; $i < 5; $i++)
    {
        if (isset($prompts[$i]))
        {
            $promptsAndAns[$i] = $prompts[$i];
        }
    }

    for ($i = 5; $i < 10; $i++)
    {
        if (isset($responses[$i - 5]))
        {
            $promptsAndAns[$i] = $responses[$i - 5];
        }
    }


    shuffle($promptsAndAns);
    echo '<div>';

    for ($i = 0; $i < 10; $i++)
    {

        if ($i%2 == 0)
        {
            echo '<br></br>';
        }

        if ($promptsAndAns[$i] == $prompts[0])
        {
            echo '<button class = "prompts button" name = "p1" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $prompts[1])
        {
            echo '<button class = "prompts button" name = "p2" id=' . $promptsAndAns[$i] . ' ><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $prompts[2])
        {
            echo '<button class = "prompts button" name = "p3" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $prompts[3])
        {
            echo '<button class = "prompts button" name = "p4" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $prompts[4])
        {
            echo '<button class = "prompts button" name = "p5" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $responses[0])
        {
            echo '<button class = "responses button" name = "r1" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $responses[1])
        {
            echo '<button class = "responses button" name = "r2" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $responses[2])
        {
            echo '<button class = "responses button" name = "r3" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $responses[3])
        {
            echo '<button class = "responses button" name = "r4" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
        else if ($promptsAndAns[$i] == $responses[4])
        {
            echo '<button class = "responses button" name = "r5" id=' . $promptsAndAns[$i] . '><img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180"></button>';
        }
    }

    echo '</div>';
}

/*******************************TIMELINE GAME***********************/

//display the timeline
function displayTimeline($prompts)
{
    echo '<div class ="timeline">'; //div that holds the timeline
    echo '<ol>';

    global $doc;
    $num = sizeOf($doc['prompts']);
    $events = []; //array to hold all of the events so they can later be randomized and displayed

    $count = 0;
    //reads in the events and dates from a json file
    for ($i = 0; $i < $num; $i++)
    {
        if(isset($prompts[$i]['event']))
        {
            $events[] = $prompts[$i]['event'];
        }
        if(isset($prompts[$i]['date']))
        {
            //keeps track of odd/even events for styling
            if ($count%2 == 0) //even
            {
                echo '<li>';

                //order of the buttons matters -- how it's displayed in the timeline

                echo '<button class="timelineEvent" id= '.$i.' style = "visibility: hidden" disabled = true > '. $events[$i] . ' </button>'; //event button in the timeline that is hidden at first, but becomes visible when the event is matched with the correct date
                echo '<button class = "date" id = '.$i.'>' .$prompts[$i]['date']. '</button>'; //date "button" on the timeline
                echo '<button class = "empty"></button>'; //empty butotn that's always hidden in the timeline -- just for styling

                '</li>';
            }
            else //odd
            {
                echo '<li>';

                echo '<button class = "empty" ></button>';
                echo '<button class = "date" id = '.$i.'>' .$prompts[$i]['date']. '</button>';
                echo '<button class="timelineEvent" id= '.$i.' style = "visibility: hidden" disabled = true > '. $events[$i] . ' </button>';

                '</li>';
            }
            $count += 1;
        }
    }
    echo '</ol>';
    echo '</div>';

    echo '<div class = "endMessage" id = "endMessage">'; //div that displays the directions and the end message
    echo 'How to play: Click or drag each event to the corresponding date in the timeline.';
    echo '</div>';

    echo '<div class ="events">'; //div that holds the bank of events
    //randomizes events
    $random = range(0, $num - 1);
    shuffle($random);
    for ($i = 0; $i < $num; $i++)
    {
        $j = $random[$i];
        echo '<button class="event" draggable="true" id= '.$j.'>' . $events[$j] . '</button>';
    }
    echo '</div>';//end events

} //end of displayTimeline

/*********************************MAP GAME************************/

//display the map game
function displayMapGame($prompts)
{
    foreach($prompts as $p)
    {
        echo '<div id="instructions"> Click on  ' . $p . ' </div>';
    }
}


//display the map
function callDisplayMap()
{
    global $numQuest;
    global $doc;
    global $num_teams;
    global $currentTeam;
    $thePrompt = $doc['prompts'][$numQuest - 1];

    if ($num_teams > 1)
    {
        $promptDisplay = "Question Number {$numQuest}, Team {$currentTeam}";
    }
    else
    {
        $promptDisplay = "Question Number {$numQuest}";
    }
    echo '<h4 id="top" data-numteams='.$num_teams.'>'.$promptDisplay.'</h4>';
    displayMapQuestion($thePrompt);
    $numQuest ++;
}

//display the map question
function displayMapQuestion($prompt)
{
    global $doc;
    echo '<div class="thegame" id="game">';
    echo '<h2 data-geo='.$doc['geojson'].' data-info='.$doc['key'].' data-lat='.$doc['startLat'].' data-long='.$doc['startLong'].' data-zoom='.$doc['startZoom'].' id="question">Click On '.$prompt.'</h2>';
    echo '<div id="map">';
    echo '</div>';
    echo '<button id="theSender">Next Question</button>';
    echo '</div>';
}

?>
