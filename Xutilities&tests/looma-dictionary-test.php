<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-dictionary-test.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma dictionary TEST';
	  include ('includes/header.php'); 
?>	

<?php
?>
	<style>
		body {background-color:gray;
		margin:25px;
		font-size:x-large;
		fint-color:black;}
	</style>
	
	<fieldset>
    <legend>Dictionary Lookup</legend>
	<form id="lookup">
		<label for="word">enter a word: </label>
		<input type="text" id="word" name="word"></input>
		<button type="submit" id="lookup-button">Lookup word</button>	
	</form>
	</fieldset>
	<br>
	<div id="nepali-output"><!--  show output here  --></div>
	<div id="defn-output">	</div>
	<div id="img-output">	</div>
	<br>

	
	<fieldset>
    <legend> Word List:</legend>		
	<form id="wordlist">
		<label>Class: </label>
		<input type="text"  name="class" id="class"></input>
		
		<label>Subject: </label>
		<input type="text"  name="subj" id="subj"></input>
		
		<label>Count:  </label>
		<input type="number"  name="count" id="count"></input>
		<br>
		<label>Ordering </label>
		<input type="radio" name="random" value="false" checked>Alphabetical
		<input type="radio" name="random" value="true">Random		
		<button type="submit" id="wordlist-button">Get list</button>
		<br><br>
	</form>
	</fieldset>
	<br>
	<div id="wordlist-output">

<!--
	<fieldset>
    <legend>Dictionary Insert:</legend>
	<form id="insert"> 
		<label for="addword">English word: </label>
		<input type="text"  name="english"></input>
		
		<label> Nepali word: </label>
		<input type="text"  name="nepali"></input>
		
		<label> Definition:  </label>
		<input type="text"  name="defn"></input>
		
		<label> Filename for image: </label>
		<input type="text"  name="img"></input>
		<button type="submit" id="addword-button">Add word</button>
		<br><br>
	</form>
	</fieldset>
	<br>
	<div id="addword-output">
	</div>
	<br>
		-->
	</div>
	<br>
	
   	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?> 
   	<script src="js/looma.js"></script>          <!-- Looma Javascript --> 		   		
   	<script src="js/looma-dictionary-test.js"></script>          <!-- Looma Javascript --> 		   		
