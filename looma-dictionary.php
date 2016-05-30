<!doctype html>
<!--
Name: Grant and Jayden
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
  	
  		<br><br>
  		     
        <h1 class="credit"> Created by Jayden and Grant</h1>
        <h2 class="title"> <?php keyword("Looma Dictionary"); ?> </h2>
        <div id = "para">
            
        <!-- This is the description of the dictionary   
        <p> Welcome to the Looma dictionary application. </p>
        <p>This application will give you the definition, part of speech, synonyms, antonyms, etc. </p>
         -->  
         <br><br>   
        </div>
        <!-- This is where the user inputs a word -->
        <form id="lookup">
        <?php keyword("Enter English word here"); ?> <input type="text" name="fname" id="word" autofocus autocomplete="off">
        <button type="submit" id="submit" value="submit"> <?php keyword("Submit"); ?> </button>
        </form>
        <!-- These lines are where the information about the word is placed -->
        <div id="theword">   </div>
        <div id="nepali">    </div>
        <div id="definition"></div>
        
        <button class="speak"></button>

</div>

	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?>   	   		
    <script src="js/looma-dictionary.js"></script>
	</body>
</html>