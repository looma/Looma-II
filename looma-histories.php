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
//require('includes/translate.php');

function makeButton($id, $thumb, $dn) {

    //DEBUG   echo "making button with path= $path  file= $file   ext= $ext"; //DEBUG

    echo "<button class=' play activity img' data-ft=history data-id='" . (string)$id . "'>";
    echo "<img src='" . $thumb . "'>";
    echo keyword($dn);

    //finish BUTTON
    echo "</button>";

};  //end makeButton()

?>

<body>
<link href='css/looma-history.css' rel='stylesheet' type='text/css'>

<h1 class="credit"> Created by Ellie, Jayden, Alexa, Catie and May</h1>

<div id="main-container-horizontal" class='scroll'>
    <h2 class="title"> <?php keyword("Looma History Timelines"); ?> </h2>
    <div class="center">
        <br>
        <!--<a href="looma-history.php?chapterToLoad=7EN01.01">
			<button type="button" class="navigate" ><?php keyword('US Presidents') ?>  </button>
			</a>
			-->
        <?php
        //modifications for History Timelines
        //***************************
        //make buttons for timelines directory -- virtual folder, populated from histories collection in mongoDB
        $buttons = 1;
        $maxButtons = 3;

        echo "<table><tr>";

        $histories = $histories_collection->find();

        foreach ($histories as $history) {

            //echo "DEBUG   found lesson " . $lesson['dn'] . "<br>";
            echo "<td>";
            $dn = $history['title'];
            $ft = "history";
            //$thumb = "../content/timelines/" . $dn . "_thumb.jpg";
            $thumb = $history['thumb'];
            //$thumb = $path . "/thumbnail.png";
            $id = $history['_id'];  //mongoID of the descriptor for this lesson
            //use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom, $nfn, $npg,$prefix)
            makeActivityButton($ft, "", "", $dn, "", $thumb, "", $id, "", "", "", "", "", "", null, null,null);
            //makeButton($id, $thumb, $dn);
            echo "</td>";
            $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";};

        } //end FOREACH history
        echo "</tr></table>";
        ?>
        <!--
		<a href="looma-history.php?chapterToLoad=1EN03">
			<button type="button" class="navigate"><?php keyword('Sports') ?>  </button>
		</a>
-->

    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-histories.js"></script>          <!-- Looma Javascript -->

</body>
</html>
