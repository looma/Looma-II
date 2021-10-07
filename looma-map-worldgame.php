<!doctype html>
<!--
Filename: looma-maps-worldgame.php
Date: 2017 07
Description:

Author: Julia, Mohini, Matt, Matthew
Owner:  VillageTech Solutions (villagetechsolutions.org)
Looma version 3.0
File: header.php
-->

<?php
$page_title = 'Looma - Maps';
include ('includes/header.php');
logFiletypeHit('map');

?>

<link rel="Stylesheet" type="text/css" href="css/looma-map-game.css">

</head>

<body>
    <div id="main-container-horizontal">
        <h1>Continents and Oceans Game</h1>
        <h1 class="credit"> Created by Julia</h1>
        <div id="fullscreen">
            <canvas id="myCanvas" width="725" height="380"></canvas>

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
                    <input id = "next" type = "button" value ="Next Question"/>

                </fieldset>
                <div  id="txtOutput"></div>

            </form>
            <?php include ('includes/looma-control-buttons.php');?>
        </div>
    </div>

    <?php
    include ('includes/toolbar.php');
    include ('includes/js-includes.php');
    ?>
    <script src="js/looma-map-worldgame.js"></script>
</body>
