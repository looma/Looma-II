<!doctype html>

<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: loooma-pdf.php
Description: PDF viewer page for Looma 2
	uses pdf.js from Mozilla
	adding Viewer.js 2016 01 25

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
	<!-- add CSS files for this page:  <link rel="stylesheet" href="css/filename.css"> -->
	</head>

	<body>
	<?php
		$filename = $_REQUEST['fn'];
		$filepath = $_REQUEST['fp'];
		$pagenum =  $_REQUEST['pg'];
	?>

	<div id="main-container-vertical" class="scroll">

<!-- OLD - pdf viewer control buttons - now using viewer.js buttons instead
		<div>
			<button class="pdf" id="first-page">First</button>
			<button class="pdf" id="prev-jump"> - -</button>
			<button class="pdf" id="prev"> - </button>
			<button class="pdf" id="next"> + </button>
			<button class="pdf" id="next-jump"> + + </button>
			<button class="pdf" id="last-page">Last</button>

			<button class="pdf" id="zoom-out">Zoom out</button>
			<button class="pdf" id="zoom-in">Zoom in</button>
			<br>
			<span>
				Page:<span id="page_num">1</span>  /  <span id="page_count">n</span>
			</span>

		</div>

-->
		<div class="viewer">

			<?php
				echo "<iframe id='iframe'";
				//echo " src='http://www.google.com'";
					//NOTE: the following line works OK if PDF.js extension is installed in the browser
					   //echo " src='" . $filepath .  $filename . "#page=" . $pagenum ."'";

				echo " src='looma-pdf-viewer/web/looma-viewer.html?file=../../" .
						$filepath .  $filename .
						"#page=" . $pagenum .
						"&zoom=160" .
						"'";
				//TEST: echo " src='shannon-viewer/web/viewer.html?file=Math-1.pdf&page=33'";

				echo " id='pdf-canvas' >";
				echo " <p hidden id='parameters' data-fn='$filename' data-fp='$filepath' data-pg='$pagenum'></p>";
				echo " </iframe>";
			?>

			<!--
			<canvas id="pdf-canvas" style="border:1px solid black" width="1000" height="800">
				<?php	echo "<p hidden id='parameters' data-fn='$filename' data-fp='$filepath' data-pg='$pagenum'></p>"?>
			</canvas>
			-->
		</div>
	</div>

    <button class="speak"></button>

    <!-- OLD CODE
   		<?php echo "<script>window.onload = showPDF('$filename', $filepath, $pagenum);</script>";
   		?>
   	-->

   	<?php include ('includes/toolbar-vertical.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

   	<!-- Include JS scripts for PDF.js -->
	<script type="text/javascript" src="js/pdf.js"></script>
  	<!-- compatibility.js is needed for Safari, and maybe WEBKIT.
    	 Might be able to detect capabilities at runtime and avoid loading this? -->
   	<script type="text/javascript" src="js/compatibility.js"></script>

   	<script type="text/javascript" src="js/looma-pdf.js"></script>
