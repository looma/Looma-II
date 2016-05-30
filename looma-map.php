<!doctype html>
<!--
Author: lauren henze, lauren smith
Email:
Filename: looma-map-php.html
Date: Aug 2015
Description:
-->

	<?php  $page_title = 'Looma Maps';
	include ('includes/header.php');

		function makeButton($file, $thumb, $dn) {

				//DEBUG   echo "making button with path= $path  file= $file   ext= $ext"; //DEBUG

				echo "<a href='" . $file . "'>";

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

	</head>

	<body>
		<div class="main-container-horizontal" class="scroll">

		<h1 class="title"> <?php keyword("Looma Maps"); ?> </h1>
		        <h1 class="credit"> Created by Lauren and Lauren</h1>

		<h2 class="title"> <?php keyword("Click to select a map"); ?> </h2>
		<p>
			<?php

		echo "<br><table id='file-table'><tr>";
		echo "<td>";
				makeButton("looma-map-basicMap.php",  "../content/maps/basicMap_thumb.png", "Basic Nepal Map");
		echo "</td><td>";
				makeButton("looma-map-zoneMap.php",   "../content/maps/zoneMap_thumb.png", "Nepal Zones Map");
		echo "</td><td>";
					makeButton("looma-map-topoMap.php",   "../content/maps/topoMap_thumb.png", "Nepal Topography Map");
		echo "</td></tr><tr><td>";
				makeButton("looma-map-streetMap.php", "../content/maps/streetMap_thumb.png", "Kathmandu Street Map");
		echo "</tr></table>";
			?>

			<!--
			<a href="looma-map-basicMap.php">
				<img src="../content/maps/basicMap_thumb.png" alt="Go to the basic map!" width="400" height="250" border="1.5">
			</a>
			<a href="looma-map-zoneMap.php">
				<img src="../content/maps/zoneMap_thumb.png" alt="Go to the zone map!" width="400" height="250" border="1.5">
			</a> <br>
			<a href="looma-map-topoMap.php">
				<img src="../content/maps/topoMap_thumb.png" alt="Go to the topographical map!" width="400" height="250" border="1.5">
			</a>
			<a href="looma-map-streetMap.php">
				<img src="../content/maps/streetMap_thumb.png" alt="Go to the map of Kathmandu!" width="400" height="250" border="1.5">
			</a>
			-->
		<p>
</div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
	<!--Include other JS here -->
</body>
</html>
