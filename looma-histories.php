 <!doctype html>
<!--
Author: Ellie Kunwar, Jayden Kunwar
Email:
Filename: looma-histories.php
Date: July 2016
Description: Initial "histories" page. Takes the user to the history timelines.
-->

    <h1 class="credit"> Created by Ellie, Jayden, Alexa, Catie and May</h1>

	<?php  $page_title = 'Looma Timeline Histories';
	include ("includes/header.php");
    require ('includes/mongo-connect.php');
    require('includes/looma-utilities.php');

    /*
		function makeButton($file, $thumb, $dn) {

				//DEBUG   echo "making button with path= $path  file= $file   ext= $ext"; //DEBUG

				echo "<button class='map  img'>";
				//text and tooltip for BUTTON
				echo "<span class='displayname'
							class='btn btn-default'
							data-toggle='tooltip'
							data-placement='top'
							title='" . $file . "'>" .
						    "<img src='" . $thumb . "'>" .

							$dn . "</span>";

				//finish BUTTON
				echo "</button></a>";

		};  //end makeButton()
    */
	?>

	<body>
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
                    $thumb = "../content/timelines/" . $dn . "_thumb.jpg";
                    //$thumb = $path . "/thumbnail.png";
                    $id = $history['_id'];  //mongoID of the descriptor for this lesson
                    makeActivityButton($ft, "", "", $dn, "", $thumb, "", $id, "", "", "");
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
