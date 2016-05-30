<!doctype html>
<!--
Author: Sasha Cassidy and Lily Barnett
Description: Looma-vocab-flashcard.html is the flashcard code.
	A card contains an English word on the front and the Nepali word, English definition,
	and corresponding image on the back. The user can click the flashcard to flip it over
	and click the arrows on either side to advance to the next card or return to the previous.
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 08
Revision: Looma 2.0.0
File: looma-vocab-flashcard.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma Flashcards';
	  include ('includes/header.php');
?>
    <link rel="stylesheet" href="css/looma-vocab-flashcard.css">
</head>

<body >
    <div  id="main-container-horizontal">
		<h2 class="title"><?php keyword('Vocabulary Games') ?></h2>
        <p class="clickToFlip"> <?php keyword("Click flashcard for definition");?> <span class="credit">Created by Lily and Sasha</span></p>
		<div class="stage">
       <!-- Displays the flashcard -->
            <div class="flashcard">
                <div class="front">
                    <p id="wordFront"> </p>
                </div>

                <div class="back">
                    <p class="nepali" id="nepaliBack"> </p>
                    <p class="largeWords" id="largeWordBack"> </p>
                    <p class="mediumWords" id="mediumWordBack"> </p>
                    <p class="smallWords" id="smallWordBack"> </p>
                </div>
        	</div>
	  	</div>

		<!-- buttons to go to the next or previous word, back to MENU and to SPEAK the word -->
		<button type="button" id="prev"><img src="images/back-arrow.png">   </button>
		<button type="button" id="next"><img src="images/forward-arrow.png"></button>
		<a href="looma-vocab.php"> <button class="navigate" id="homePage"><?php keyword('Menu') ?></button> </a>
		<button class="speak"></button>
	</div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-vocab-flashcard.js"></script>
	</body>
</html>