<!doctype html>
<!--
Author: Sasha Cassidy, Lily Barnett, and Mahir Arora
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
    <div id="main-container-horizontal">
        <h2 class="title"><?php keyword('Vocabulary Games') ?></h2>
        <p class="clickToFlip"> <?php keyword("Click flashcard for definition");?> <span class="credit">Created by Lily, Sasha, and Mahir</span></p>
        <div id="fullscreen">
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
                        <div id="rootWord">  </div>
                        <div id ="rwNepali"> </div>
                        <div id ="rwDefinition"></div>

                    </div>
                </div>
            </div>
            <button type="button" id="prev"><img src="images/back-arrow.png">   </button>
            <button type="button" id="next"><img src="images/forward-arrow.png"></button>      </div>
        <div id="params" hidden
            <?php
                /* looma-vocab-flashcard.js expects the following parameters to be passed:
                vocabGrade = $('#params').data('class');
                vocabSubject = $('#params').data('subj');
                vocabCh_id = $('#params').data('ch_id');
                */
            echo "<div id='params' hidden ";
                if (isset($_REQUEST['class']))   echo "data-class=" .   $_REQUEST['class']   . " ";
                if (isset($_REQUEST['subject'])) echo "data-subject=" . $_REQUEST['subject'] . " ";
                if (isset($_REQUEST['ch_id']))   echo "data-ch_id=" .   $_REQUEST['ch_id']   . " ";
            ?>
        ></div>
        <!-- buttons to go to the next or previous word, back to MENU and to SPEAK the word -->
        <a href="looma-vocab.php"> <button class="navigate" id="homePage"><?php keyword('Menu') ?></button> </a>
        <button class="speak"></button>
        <button id="fullscreen-control"></button>

    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-screenfull.js"></script>
    <script src="js/looma-vocab-flashcard.js"></script>
    </body>
</html>
