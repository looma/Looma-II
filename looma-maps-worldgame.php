<!doctype html>

<?php
$page_title = 'Looma - Maps';
include ('includes/header.php');
include ('includes/toolbar.php');
include ('includes/js-includes.php');
?>


<head>

<link rel="Stylesheet" type="text/css" href="css/looma-maps-game.css">

</head>

<body>
    <div id="main-container-horizontal">
        <h1>Continents and Oceans Game</h1>

        <canvas id="myCanvas" width = "725" height = "380"></canvas>

        <p id="question">What continent or ocean is this?</p>
        <form action="">
            <fieldset id="getInput">
                <label id="label">Continent or Ocean:</label>
                <select type="String" id="userGuess">
                    <?php
                    	$continents = array("North America", "South America", "Europe", "Asia", "Africa","Australia", "Antartica", "Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean");
                        for ($i=0; $i<=10; $i++)
                        {
                            ?>
                                <option value="<?php echo $continents[$i];?>"><?php echo $continents[$i];?></option>
                            <?php
                        }
                    ?>
                </select>
                <input id="submit" type="button" value="Submit"/>
            </fieldset>
            <input type="text" id="txtOutput" />
        </form>

        <form action ="">
        		<input id = "next" type = "submit" value ="Next Question"/>
        </form>

        <script src="js/looma-maps-worldgame.js"></script>
        <script src="js/jquery.min.js"></script>
        <script src="js/looma-utilities.js"></script>
    </div>
</body>