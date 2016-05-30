<!doctype html>
<!--
Edward Stritter  <estritte@my.smccd.edu>
CIS 127  Fall 2014
Assignment:   
Date:
Description: 
Filename:
-->

<html lang="en">
  <head>
    <meta charset="utf-8">
  	<meta name="author" content="skip stritter">
    <title>CIS 127 - Forms - Skip Stritter</title>
    
    <link rel="stylesheet" href="css/styles.css?v=1.0">
	<style>
		body {width:900px;}
		label {float:left;
				text-align:right;
				width:7em;}
		input, select, textarea, number, datetime, month 
			   {margin-left: 1em;
				margin-bottom: 0.5em;}	
		textarea {height:5em;
				 width:20em;}
		#basic {float:left;
				width:45%;
				height:450px;}
		#preferences {width:45%;
				height:450px;}
		footer {text-align:right;}
		.center {margin-left:auto;
				 margin-right:auto;
				 width:40%;}
		button {padding:0px;
				background-color:#FFFFFF;}
		#submitbutton {margin-left:0px;}
		#resetbutton {margin-right:0px;}	
	</style>
    <!--[if lt IE 9]> <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script> <![endif]-->
  </head>
  <body>

	<!--TYPES INCLUDED: button, checkbox, file, hidden, password, radio, reset, submit, text
			MISSING: image
		ELEMENTS INCLUDED: email, url, tel, search, color, number, range, datetime, month
			MISSING: search, date, week, time, datetime-local
			MISSING: pick one: meter, progress, output, keygen
		ATTRIBUTES INCLUDED: placeholder *, autofocus *, required *, pattern (regexp)*, min/max *, form *, 
					list (datalist), autocomplete, multiple, accept, spellcheck, novalidate
					form overrides (formenctype, formmethod, formtarget) MISSING formnovalidate formaction
	-->
	<h3>Tell us all about yourself</h3>
	<form action='http://server.csmcis.net/~teststudent99/cis127/html5_form.py'  
		  id='info_form' method='post' accept-charset='utf-8' enctype="multipart/form-data">
    	<fieldset id='basic'><legend><b>Basic Information</b></legend>
    		
    		<label for='name'>Your name: </label> 
    		<input type='text' name='name' id='name' value='' required autofocus>
			<br>
			    	
     		<label for='mail'>Email: </label> 
    		<input type='email' name='mail' id='mail' value='' placeholder='name@domain.com'>
			<br>
    	
    		<label for='pw'>Password</label> 
    		<input type='password' name='pw' id='pw' value=''>
			<br>
    	
    	    <label for='phone'>Phone number: </label> 
    		<input type='tel' name='phone' id='phone' value='' 
    			   pattern='\d{3}[\-]\d{3}[\-]\d{4}' title='must be xxx-xxx-xxxx' placeholder='xxx-xxx-xxxx'>
			<br>
    	
    	    <label for='website'>Web site: </label> 
    		<input type='url' name='website' id='website' value='' placeholder='www.domain.com'>
			<br>
    	
    	    <label for='age'>Age: </label> 
    		<input type='number' name='age' id='age' value='' min=1 max=101 step=1>
			<br>
    	
    	    <label for='male'>Gender: </label> 
    		<input type='radio' name='gender' id='male' value='M'>M
    		<input type='radio' name='gender' id='female' value='F'>F
			<br>
			
    	    <label for='creditcard'>Credit Card: </label> 
    		<input type='text' name='creditcard' id='creditcard' pattern='\d{4}[\-]\d{4}[\-]\d{4}[\-]\d{4}' 
    			   title='must be xxxx-xxxx-xxxx-xxxx' 
    		       placeholder='xxxx-xxxx-xxxx-xxxx'>
    		<br>
    	    				  	
    	    <fieldset id='bday'><legend>Birthday</legend>
    	    	<label for='month'>Month:</label> 
    	    	<input type='month' name='month' id='month'><br>
    	    	<label for='day'>Day (1-31): </label>
    	    	<input type='number' name='day' id='day' min=1 max=31><br>
    	    	<label for='year'>(1900-2014): </label>
    	    	<input type='number' name='year' id='year' min='1900' max='2014'>
    	    </fieldset> 
    	    <br>
    	    	 	
    		<label for='picture'>Upload your picture: </label>
    		<input type='file' name='picture' id='picture' accept='image/jpg, image/jpeg, image/gif'>
			<br>
		</fieldset>		  	

    	<fieldset id='preferences'><legend><b>Likes and preferences</b></legend>
  
	  		<label for='color'>Favorite color: </label> 
    		<input type='color' name='color'  id='color'>
			<br>
			
			<label for='mood'>Your mood (1-10)</label>
			<input type='range' id='mood' value='7' min=1 max=10 step=2>
			<br><br>
			
			
			<label for='activity'>Activities: </label>
			<select name='activity' id='activity'>
				<option value='indoors'>Indoor activities</option>
				<option value='city'>Urban activities</option>
				<option value='sports'>Sports</option>
				<option value='outdoors' selected>Outdoor recreation</option>
			</select>
			<br>
						
			<label for='arts'>Art forms: </label>
			<select name='arts' id='arts' size='5' multiple>
				<option value='painting'>Painting</option>
				<option value='sculpture'>Sculpture</option>
				<option value='movies'>Movies</option>
				<option value='dance'>Dance</option>
				<option value='concerts' selected>Concerts</option>
			</select>
			<br>
			
			<label for='shopping'>Shopping sites: </label>
			<input type='text' name='shopping' id='shopping' list='shoppingsites'>
			<datalist id='shoppingsites'>
				<option value='www.amazon.com' label='Amazon'>
				<option value='www.ebay.com' label='Ebay'>
				<option value='www.google.com' label='Google'>
				<option value='www.walmart.com' label='Walmart'>
			</datalist>
			<br>
			
			<label>Ethnicity: </label>
			<input type='checkbox' name='white' value='white'>White
			<input type='checkbox' name='latino' value='latino'>Latino
			<input type='checkbox' name='asian' value='asian'>Asian
			<input type='checkbox' name='african' value='african'>African
			<br>

			<label for='sex'>Sexual preference: </label>
			<input type='text' name='sex' id='sex' value='This field is disabled' disabled>
			<br><br>
			
			<label for='quote'>Favorite Quote: </label>
			<textarea name='quote' id='quote' placeholder='enter your favorite quote' spellcheck='true'></textarea>
    		<br>
    		
    		<input type='submit' name='submit' value='Regular Submit Button'>
    	</fieldset>
    	
    	<input type='hidden' name='attribution' value='file created by Skip Stritter'>
    </form>

		<!--image button here with form=-->
		   <br><br>
		   <section class='center'>
		   		<button type='submit' id='submitbutton' form='info_form' 
		   			formtarget='_self' formmethod='post' formenctype='multipart/form-data'>
		    		<img src="images/submitbutton.jpg" alt="Button image here">
		   		</button> 
		   		<button type='reset' id='resetbutton' form='info_form'>
		    		<img src="images/resetbutton.jpg" alt="Button image here">
		   		</button> 
			</section>	


    <footer>
    	<!-- W3C validator link -->
   		<a href="http://validator.w3.org/check?uri=referer">VALIDATE</a>   		
    	<p>&copy; Copyright  by Skip Stritter</p>
	</footer>
	
  <!-- Javascript links should come last, except for html5shiv -->
  <script src="js/scripts.js"></script>
  </body>
</html>