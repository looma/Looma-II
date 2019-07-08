<!doctype html>
<!--
Author: Skip
Email: skip@stritter.com
Filename: yyy.html
Date:Fall 2015
Description: page with link to arithmetic and vocabulary games

-->


	<?php $page_title = 'Looma Games ';
	      include ('includes/header.php');
	      include ("includes/mongo-connect.php");
	?>
<link rel="stylesheet" href="css/looma-gamesNEW.css">

	<?php
		// get list of types of games
	    $cursor =  $games_collection->find(array(), array("_id"=>0, "presentation_type" => 1));

	    $unique_game_types = array();
	    foreach ($cursor as $game)
	    {
	    	if (!in_array($game["presentation_type"], $unique_game_types)) {
	    		switch ($game["presentation_type"]) {
				    case "concentration":
				        $unique_game_types[$game["presentation_type"]] = "Concentration Games";
				        break;
                    //case "mc":
                      //  $unique_game_types["mc"] = "Multiple Choice Games";
                        //break;
                    case "multiple choice":
                        $unique_game_types["multiple choice"] = "Multiple Choice Games";
                    break;
				    case "matching":
				    	$unique_game_types[$game["presentation_type"]] = "Matching Games";
				        break;
				    case "timeline":
				    	$unique_game_types[$game["presentation_type"]] = "History Games";
				        break;
				    case "map":
				    	$unique_game_types[$game["presentation_type"]] = "Map Games";
				        break;
				    default:
				    	$unique_game_types[$game["presentation_type"]] = $game["presentation_type"];
				    	break;
	    		}
	    	}
	    }
	?>

	</head>

<body>
	<div id="main-container-horizontal">
        <br>
        <h2 class="title"> <?php keyword("Looma Games"); ?> </h2>
		<div class="center">
			<br>

		<?php
			foreach ($unique_game_types as $game_type=>$game_label) {

                if ($game_type !== "timeline") {
                    $val = "<a href='looma-game-listNEW.php?type=" . $game_type . "'>";
                    $val = $val . "<button type='button' class='activity play img navigate' >";
                    echo $val;
                    keyword($game_label);
                    echo "</button></a>";
                }
            }
		?>

		<a href="looma-vocab.php">
			<button type="button" class=" activity play img navigate" ><?php keyword('Vocabulary Games') ?>  </button>
	   </a>

		<a href="looma-arith.php">
			<button type="button" class=" activity play img navigate"><?php keyword('Arithmetic Games') ?>  </button>
		</a>

    <!-- the OLD looma-mapgames.php obsoleted by NEW "Map Games" above
		<a href="looma-mapgames.php">
			<button type="button" class=" activity play img navigate" ><?php /*keyword('Map Games') */?>  </button>
		</a>
		</div>
    -->

        <a href="looma-bagh-chal.php" id="bagh-chal-href">
            <button id="bagh-chal"class="looma-control-button"></button>
        </a>
        </div>
    </div>

	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

  </body>
</html>
