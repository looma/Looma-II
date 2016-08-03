<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: loooma-pdf.php
Description: PDF viewer page for Looma 2
	uses pdf.js and viewer.js from Mozilla

Usage: <button id="testpdf" data-fn="Math-2.pdf"
						 data-fp="resources/textbooks/"
						 data-ft="pdf"
						 data-pg="3">
			PDF TEST</button>
	And: $("button#testpdf").click(LOOMA.playMedia);
-->

<?php $page_title = 'Looma PDF Viewer';
	  include ('includes/header.php');
?>
</head>

<body>
	<?php
		$filename = $_REQUEST['fn'];
		$filepath = $_REQUEST['fp'];
		$pagenum =  $_REQUEST['pg'];
	?>

	<div id="main-container-vertical" class="scroll">
		<div class="viewer">

			<?php
				echo "<iframe id='iframe'";
				// open the PDF in 'viewer.html' from pdf.js in an iframe
				// looma-viewer.html is viewer.html unchanged except for including looma-viewer.css and loomw-viewer.js
				echo " src='looma-viewer.html?file=" .
						$filepath .  $filename .
						"#page=" . $pagenum .
						"&zoom=160" .
						"'";

				echo " id='pdf-canvas' >";
				echo " <p hidden id='parameters' data-fn='$filename' data-fp='$filepath' data-pg='$pagenum'></p>";
				echo " </iframe>";
			?>

		</div>
	</div>

    <button class="lookup"></button>
    <button class="speak"></button>

   	<?php include ('includes/toolbar-vertical.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

    <script type="text/javascript" src="js/looma-pdf.js"></script>
    <!--
        <script type="text/javascript" src="js/looma-alerts.js"></script>
    -->
</body>

