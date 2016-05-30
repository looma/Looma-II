<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-admin-textbooks.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma Textbook Admin Page';
?>	
<html lang="en" class="no-js">
  <head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">

  	<meta name="author" content="Skip">
  	<meta name="project" content="Looma">
  	<meta name="owner" content="villagetechsolutions.org">
	<link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32x32.png">
	<link rel="icon" type="image/png" sizes="96x96" href="images/favicon-96x96.png">  	
	
	<?php
  	// Turn on error reporting
		error_reporting(E_ALL);
		ini_set('display_errors', 1);
	?>
	
  	<title> <?php print $page_title; ?> </title> 
  		
  	<!-- Replace favicon.ico & apple-touch-icon.png in the root of your domain and delete these references -->
	<link rel="shortcut icon" href="/favicon.ico">
        
    <link href="css/bootstrap.min.css" rel="stylesheet">     <!-- Bootstrap -->
    <link rel="stylesheet" href="css/normalize.css">         <!-- HTML5-boilerplate -->
    <link rel="stylesheet" href="css/main.css">              <!-- HTML5-boilerplate -->
    <link rel="stylesheet" href="css/looma-admin.css">             <!-- Looma CSS -->
    <!--[if lt IE 9]> <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script> <![endif]-->
  </head>
  <body>

	<h2>Looma Textbook Admin Page</h2>
	<form id='tb_form' 
		  action='looma-admin-textbooks.php' method='post' 
		  accept-charset='utf-8' enctype='multipart/form-data'>
		  
		  <!--
		  	DEBUG: novalidate
		  -->
		  
    	  <fieldset id='basic'>
    	  	<legend>Textbook Information</legend>
    				
			<label>Class *: </label>
			<input type='radio' name='class' value='class1' required>Class1
			<input type='radio' name='class' value='class2'>Class2
			<input type='radio' name='class' value='class3'>Class3
			<input type='radio' name='class' value='class4'>Class4
			<input type='radio' name='class' value='class5'>Class5
			<input type='radio' name='class' value='class6'>Class6
			<input type='radio' name='class' value='class7'>Class7
			<input type='radio' name='class' value='class8'>Class8
			<br><br>
			
			<label>Subject *: </label>
			<input type='radio' name='subject' value='nepali' required>      Nepali
			<input type='radio' name='subject' value='english'>     English
			<input type='radio' name='subject' value='math'>        Math
			<input type='radio' name='subject' value='science'>     Science
			<input type='radio' name='subject' value='social studies'>Social Studies
			<br><br>
	
	    	<label for='displayname'>Display name *: </label> 
    		<input type='text' name='dn' class='text'  id='dn' value='' required>
			<br><br>
			
		   	<label for='filename'>File name *: </label> 
    		<input type='text' name='fn' class='text' id='fn' value='' required>
			<br><br>
		    	
		    <label for='filepath'>Path to file *: </label> 
    		<input type='text' name='fp' class='text' id='fp' value='' required>
			<br><br>
			
		   	<label for='nativefilename'>Native language file name: </label> 
    		<input type='text' name='nfn' class='text' id='nfn' value=''>
			<br><br>		   	
			
			<label for='date'>Today's date: </label> 
			<input type='text' id='date' name='date' value='today'>
			<br><br>
			 
			<label for='notes'>Notes: </label>
			<textarea name='notes' id='note' placeholder='enter any notes here' spellcheck='true'></textarea>
    		<br>
    		
    		<label for='mail'>Your VTS email: </label> 
    		<input type='text' name='mail' id='mail' value='' placeholder='yourname'>@villagetechsolutions.org
			<br><br><br>
			<p> Items marked * are required</p>
			<p> Filenames are in this form:  "Math-1.pdf" or "Science-3-Nepali.pdf"</p>
			    	

			<br><br><br>
			
    		<section>
    		<input class='big' type='submit' name='submit' value='Submit'>
    		<input class='big' type='reset' name='submit' value='Reset'>
    		</section>
    	</fieldset>
    	
    </form>
 
    <footer>
    	<!-- W3C validator link -->
   		<a href="http://validator.w3.org/check?uri=referer">VALIDATE</a>   		
    	<p>&copy; Copyright  by VTS</p>
	</footer>
	
  
   	<?php include ('includes/js-includes.php'); ?> 
   	<script src="js/admin-tb-form.js"></script>          <!-- Looma Javascript --> 	
   	</body>
</html>	   		
