<!doctype html>
<!--
Author: Skip
Email: skip@stritter.com
Filename: yyy.html
Date:Fall 2015
Description: page with linke to arithmetic and vocabulary games

-->


	<?php $page_title = 'Looma Games ';
	      include ('includes/header.php'); ?>
	<!-- add CSS files for this page:
		<link rel="stylesheet" href="css/filename.css"> -->
	</head>

<body>
	<div id="main-container-horizontal">
		<h2 class="title"> <?php keyword("Looma Practice Exercises"); ?> </h2>
		<div class="center">
			<br><br><br><br>
			<br><br><br><br>
		<a href="looma-vocab.php">	
			<button type="button" class="navigate" ><?php keyword('Vocabulary Games') ?>  </button>
			</a>	
	
		<a href="looma-arith.php">
			<button type="button" class="navigate"><?php keyword('Arithmetic Games') ?>  </button>
		</a>		
		</div>	
	</div>
	
	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?>   	   		

  </body>
</html>