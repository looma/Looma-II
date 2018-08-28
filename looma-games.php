<!doctype html>
<!--
Author: Skip
Email: skip@stritter.com
Filename: yyy.html
Date:Fall 2015
Description: page with link to arithmetic and vocabulary games

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
			<br>
		<a href="looma-game-list.php?type=mc">
			<button type="button" class=" activity play img navigate" ><?php keyword('Multiple Choice Games') ?>  </button>
	   </a>
	   <a href="looma-game-list.php?type=matching">
			<button type="button" class=" activity play img navigate" ><?php keyword('Matching Games') ?>  </button>
	   </a>
	   <a href="looma-game-list.php?type=concentration">
			<button type="button" class=" activity play img navigate" ><?php keyword('Concentration Games') ?>  </button>
	   </a>
	   <a href="looma-game-list.php?type=timeline">
			<button type="button" class=" activity play img navigate" ><?php keyword('Timeline Games') ?>  </button>
	   </a>
	   <a href="looma-game-list.php?type=map">
			<button type="button" class=" activity play img navigate" ><?php keyword('New Map Games') ?>  </button>
	   </a>
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

        <a href="looma-bagh-chal.php" id="bagh-chal-href">
            <button id="bagh-chal"class="looma-control-button"></button>
        </a>
	</div>

	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

  </body>
</html>

