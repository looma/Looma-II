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
<link rel="stylesheet" href="css/XXXlooma-pdf.css">

</head>

<body>
	<?php
		$filename = urldecode($_REQUEST['fn']);
		$filepath = urldecode($_REQUEST['fp']);
		$pagenum =  $_REQUEST['page'];
		$zoom =  $_REQUEST['zoom'] ? $_REQUEST['zoom'] : 'page-width';
	?>

	<div id="main-container-vertical" class="scroll">
        <div class="viewer">
            <div id="fullscreen">

			<?php
				echo "<iframe id='iframe'";
				// open the PDF in 'viewer.html' from pdf.js in an iframe
				// looma-viewer.html is viewer.html unchanged except for including looma-viewer.css and looma-viewer.js
				echo " src='looma-viewer.html?file=" .
						$filepath .  $filename .
						"#page=" . $pagenum .
						"#zoom=page-width" .
						"'";

				echo " id='pdf-canvas' >";
				//echo " <p hidden id='parameters' data-fn='$filename' data-fp='$filepath' data-pg='$pagenum'></p>";
				echo " </iframe>";
			?>
                <button class="lookup looma-control-button"></button>
                <button class="speak looma-control-button"></button>
                <button id="fullscreen-control" class="looma-control-button"></button>
            </div>
        </div>


    </div>

   	<?php include ('includes/toolbar-vertical.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

    <script type="text/javascript" src="js/XXXlooma-pdf.js"></script>

</body>

