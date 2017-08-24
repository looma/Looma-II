<!doctype html>
<!--
Filename: looma-maps-asiancountrygame.php
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

?>


<link rel="Stylesheet" type="text/css" href="css/looma-maps-game.css">

</head>

<body>
    <div id="main-container-horizontal">
        <h1>Asia Countries Game</h1>

        <canvas id="myCanvas" width = "463" height = "400"></canvas>

        <p id="question">What country is this?</p>
        <form action="">
            <fieldset id="getInput">
                <label id="label">Country:</label>
                <select type="String" id="userGuess">
                    <?php
                        $countries = array("Afghansitan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", "Brunei", "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia", "Iran", "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos", "Lebanon", "Malaysia", "Mongolia", "Myanmar (Burma)", "Nepal", "North Korea", "Oman", "Pakistan", "Palestine", "Philippines", "Qatar", "Russia", "Saudi Arabia", "South Korea", "Sri Lanka", "Syria", "Taiwan", "Tajikistan", "Thailand", "Timor-Leste", "Turkey", "Turkmenistan", "United Arab Emirates (UAE)", "Uzbekistan", "Vietnam", "Yemen");
                        for ($i=0; $i<count($countries); $i++)
                        {
                            ?>
                                <option value="<?php echo $countries[$i];?>"><?php echo $countries[$i];?></option>
                            <?php
                        }
                    ?>
                </select>
                <input id="submit" type="button" value="Submit"/>
                <input id = "next" type = "submit" value ="Next Question"/>
            </fieldset>
            <input type="text" id="txtOutput" />
        </form>

    </div>

        <?php
        include ('includes/toolbar.php');
        include ('includes/js-includes.php');
        ?>
        <script src="js/jquery.min.js"></script>
        <script src="js/looma-utilities.js"></script>
       <script src="js/looma-maps-asiacountrygame.js"></script>
</body>
