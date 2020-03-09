<!doctype html>
<!--
Name: Grant and Jayden and Mahir
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 08
Revision: Looma 2.0.0
File: looma-dictionary.php
Description:  dictionary look-up UI for Looma 2
-->

<?php $page_title = 'Looma Dictionary';
	  include ('includes/header.php');
?>
     <link rel = "Stylesheet" type = "text/css" href = "css/looma-dictionary.css">
  </head>
  <body>
      <div id="main-container-horizontal">
        <div id="fullscreen">
            <?php include ('includes/looma-control-buttons.php');?>
            <br><br>

        <h1 class="credit"> Created by Jayden, Grant, Kendall and Mahir</h1>
        <h1 class="title"> <?php keyword("Looma Dictionary"); ?> </h1>

        <!-- This is where the user inputs a word -->
        <form id="lookup">
            <?php keyword("Enter English word here"); ?>
            <input type="text"  id="input" autofocus autocomplete="off">
            <button type="submit" id="submit" value="submit"> <?php keyword("Submit"); ?> </button>
        </form>

        <!-- where the information about the word is placed -->
        <div id="definitionDisplay"></div>

            <!-- The Modal [jack king code to add images] -->
            <div id="definitionImage" class="modal">
                <span class="close">×</span>
                <img class="modal-content" id="img01">
            </div>

        </div>
      </div>

	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-dictionary.js"></script>
  </body>
</html>
