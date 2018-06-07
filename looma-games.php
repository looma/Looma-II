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
		<link rel="stylesheet" href="css/looma-games.css">
	</head>

<body>
	<div id="main-container-horizontal">
        <br>
        <h2 class="title"> <?php keyword("Looma Practice Exercises"); ?> </h2>
		<div class="center">
			<br><br><br><br>
		<a href="looma-vocab.php">
			<button type="button" class=" activity play img navigate" ><?php keyword('Vocabulary Games') ?>  </button>
	   </a>

		<a href="looma-arith.php">
			<button type="button" class=" activity play img navigate"><?php keyword('Arithmetic Games') ?>  </button>
		</a>

		<a href="looma-mapgames.php">
			<button type="button" class=" activity play img navigate" ><?php keyword('Map Games') ?>  </button>
		</a>
		</div>

        <a href="looma-bagh-chal.php" hidden>
            <button id="bagh-chal"class="looma-control-button"></button>
        </a>
	</div>

	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

  </body>
</html>
