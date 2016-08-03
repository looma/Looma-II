<!doctype html>
<!--
Author: Ellie Kunwar, Jayden Kunwar
Email:
Filename: looma-histories.php
Date: July 2016
Description: Initial "histories" page. Takes the user to the history timelines.
-->

    <h1 class="credit"> Created by Ellie and Jayden</h1>

	<?php  $page_title = 'Looma Timeline Histories';
	include ("includes/header.php");

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
	?>

	<body>
	<div id="main-container-horizontal">
		<h2 class="title"> <?php keyword("Looma History Timelines"); ?> </h2>
		<div class="center">
			<br><br><br><br>
			<br><br><br><br>
		<a href="looma-history.php?chapterToLoad=7EN01.01">
			<button type="button" class="navigate" ><?php keyword('Presidents') ?>  </button>
			</a>

		<a href="looma-history.php?chapterToLoad=1EN03">
			<button type="button" class="navigate"><?php keyword('Sports') ?>  </button>
		</a>
		</div>
	</div>

	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

  </body>
</html>