<!doctype html>
<!--
LOOMA php code file
Filename: looma-clock-singleclock.php

Description: This file uses a canvas to draw a clock, and uses <select> <option> elements
to create a dropdown menu, which the user will use to enter the time the clock is displaying.
It also creates a “New Problem” button, which refreshes the page to create a new random clock.

Programmer name:
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
		<h1><?php keyword("Looma Clock") ?></h1>

<canvas id="mainClock">
</canvas>

    <button id="newproblem"><?php keyword("New Problem")?></button>

    <p id="question"> <?php keyword("What time is on the clock?") ?></p>

    <fieldset id="getInput">
        <label id="label"> <?php keyword("Hour:") ?></label>
        <select type="int" id="userHour">
            <option value=1>1</option>
<?php
    for ($i=2; $i<=12; $i++)
    {
        ?>
            <option value="<?php echo $i;?>"><?php echo $i;?></option>
        <?php
    }
?>

</select>
            <label id="label"><?php keyword("Minute:") ?></label>

            <select  type="int" id="userMin">
                <option value=0>00</option>
                <option value=5>05</option>
<?php
    for ($i=10; $i<=55; $i+=5)
    {
        ?>
            <option value="<?php echo $i;?>"><?php echo $i;?></option>
        <?php
    }
?>

        </select>
            <button id="submit"> <?php keyword("Submit"); ?> </button>
		</fieldset>
        <div id="txtOutput" />


        <script src="js/looma-clock-singleclock.js"></script>
    </div>
</body>
