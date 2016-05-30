<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-info.php
Description:  for Looma 2
-->

<!-- to display a PDF:
		window.location = 'looma-pdf.php?fn=' + filename + 
								   '&fp=' + filepath + 
								   '&pg=' + pagenumber +
								   '&settings=' + settings);
								   
	this file: looma-pdf.php,
					displays PDF view control buttons and hooks them to listeners that change view settings
				   	then, displays the PDF, with settings passed in the URL, in an <object>
-->

<?php $page_title = 'PDF Test page';
	  include ('includes/header.php'); 
?>	
	<!-- add CSS files for this page:
		<link rel="stylesheet" href="css/filename.css"> -->
	</head>

	<body>
<?php

		//print_r($_REQUEST);
		
		$fn = $_REQUEST['fn'];
		$fp = $_REQUEST['fp'];
		$pg = intval($_REQUEST['pg']);
		
		echo "DEBUG: fn= " . $fn . " fp= " . $fp . " pg= " . $pg;
?>
	
	<div class="fullframe">
		<div>
			<h2>using OBJECT</h2>
			
					<div class="viewer">
			<button class="pdf" id="first-page">First</button>
			<button class="pdf" id="prev-jump"> - - </button>
			<button class="pdf" id="prev"> - </button>
			<button class="pdf" id="next"> + </button>
			<button class="pdf" id="next-jump"> + + </button>
			<button class="pdf" id="last-page">Last</button>
		
			<button class="pdf" id="zoom-out">Zoom out</button>
			<button class="pdf" id="zoom-in">Zoom in</button>
			<button class="pdf" id="bookmarks">Show/Hide bookmarks</button>
			<button class="pdf" id="extra">Extra</button>
			<br>
			<span>
				Page:<span id="page_num"><?php $pg ?></span>  /  <span id="page_count">n</span>
			</span>
<?php			
		echo "<object data='" . $fp . $fn . "'#page=" . $pg . "&zoom=50&pagemode=thumbs&navpanes=1";
		echo "type='application/pdf' width='80%' height='720px'>No PDF plugin available</object>";
		echo "<p hidden id='parameters' data-fn='$fn' data-fp='$fp' data-pg='$pg'></p>";
?>
	</div>
<!--		
		<div>
			<h2>using EMBED</h2>
			<embed src="resources/textbooks/Math-2.pdf#page=33&pagemode=thumbs&scrollbar=0" type="application/pdf" width="80%" height="720px" alt="pdf"></embed>			
		</div>
-->
<!--		
		<div>
			<h2>using IFRAME</h2>
			<iframe src="resources/textbooks/Math-2.pdf#page=44&pagemode=thumbs" width="80%" height="720px">No PDF plugin available</iframe>
		</div>
-->
	</div>
	
   	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?>   	
   	   	<script type="text/javascript" src="js/looma-pdfTEST.js"></script>	
   		
