<!doctype html>
<!--
LOOMA php code file
Filename: looma-clock-doubleclock.php

Description: This file uses a canvas to draw two random clocks, and uses
<select> <option> elements to create a dropdown menu, which the user will
use to enter the difference in times of the two clocks.  It also creates a
“New Problem” button which refreshes the page to generate two new clocks.

Programmer name: John Weingart and Grant Dumanian
Email:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision: Looma 2.0.x
Comments:
-->

<?php
$page_title = 'Looma - Time';
    include ('includes/header.php');
    include ('includes/toolbar.php');
    include ('includes/js-includes.php');
?>
<head>

<link rel="Stylesheet" type="text/css" href="css/looma-clock.css">

</head>

<body>
    <div id="main-container-horizontal">
        <h1> <?php keyword("Looma Clock") ?> </h1>

        <canvas id="doubleClock">
        </canvas>

        <FORM METHOD="LINK" ACTION="" Id="Refresh">
            <button TYPE="submit" id="singleclock-newproblem"><?php keyword("New Problem")?></button>
        </FORM>

        <p id="question"><?php keyword("How much time has passed?") ?></p>
        <form action="">
            <fieldset id="getInput">
                <label id="label"> <?php keyword("Hours:") ?></label>
                <select type="int" id="userHour">
                    <?php
                        for ($i=0; $i<=11; $i++)
                        {
                            ?>
                                <option value="<?php echo $i;?>"><?php echo $i;?></option>
                            <?php
                        }
                    ?>
                </select>

                <label id="label"> <?php keyword("Minutes:") ?></label>

                <select  type="int" id="userMin">
                    <option value=0>00</option>
                    <option value=5>05</option>

                    <?php
                        for ($i=10; $i<56; $i+=5)
                        {
                            ?>
                                <option value="<?php echo $i;?>"><?php echo $i;?></option>
                            <?php
                        }
                    ?>
                </select>
                <input id="submit" type="button" value="Submit"/>
            </fieldset>
            <input type="text" id="txtOutput" />
        </form>

        <script src="js/looma-clock-doubleclock.js"></script>
        <script src="js/jquery.min.js"></script>
        <script src="js/looma-utilities.js"></script>
    </div>
</body>
