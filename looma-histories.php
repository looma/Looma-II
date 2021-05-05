<!doctype html>
<!--
Author: Ellie Kunwar, Jayden Kunwar
Email:
Filename: looma-histories.php
Date: July 2016
Description: Initial "histories" page. Takes the user to the history timelines.
-->


<?php  $page_title = 'Looma Timeline Histories';
include ("includes/header.php");
require ('includes/mongo-connect.php');
require('includes/looma-utilities.php');
?>

<body>
<link href='css/looma-history.css' rel='stylesheet' type='text/css'>

<h1 class="credit"> Created by Ellie, Jayden, Alexa, Catie and May</h1>

<div id="main-container-horizontal" class='scroll'>
    <h1 class="title"> <?php keyword("Looma History Timelines"); ?> </h1>
    <div class="center">
        <br>
        <?php
        //make buttons for timelines directory -- virtual folder, populated from histories collection in mongoDB
        $buttons = 1;
        $maxButtons = 3;

        echo "<table><tr>";

        $histories = mongoFind($histories_collection, [], null, null, null);

        foreach ($histories as $history) {

            echo "<td>";
            $dn = $history['title'];
            $ndn = isset($history['ndn']) ?  $history['ndn'] : "";
            $ft = "history";
            $thumb = $history['thumb'];
            $id = $history['_id'];  //mongoID of the descriptor for this lesson
            makeActivityButton($ft, "", "", $dn, $ndn, $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);
            echo "</td>";
            $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";}

        } //end FOREACH history
        echo "</tr></table>";
        ?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-histories.js"></script>

</body>
</html>
