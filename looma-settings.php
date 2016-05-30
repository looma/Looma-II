<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-settings.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma Settings';
	  include ('includes/header.php');
?>
	<link rel="stylesheet" href="css/looma-settings.css">
	</head>

	<body>
	<div id="main-container-horizontal">
			<h3 class="title">Looma Settings page</h3>

			<h4>Change themes with these buttons</h4>
		<span id="themes">
			<div id="list">
				     <span class="themespan"><input type="radio" name="theme" class="theme" id="looma" 		  value="looma"> 	  Looma Classic
				    	<img class="thumb" src="images/theme-looma.png" > </span>
  				<br> <span class="themespan"><input type="radio" name="theme" class="theme" id="style-sheet"   value="style-sheet">Style Sheet
				    	<img class="thumb" src="images/theme-stylesheet.png" > </span>
  				<br> <span class="themespan"><input type="radio" name="theme" class="theme" id="white" 		  value="white">  	  White
				    	<img class="thumb" src="images/theme-white.png" > </span>
  				<br> <span class="themespan"><input type="radio" name="theme" class="theme" id="green" 		  value="green">      Eco Green
				    	<img class="thumb" src="images/theme-ecogreen.png" > </span>
  				<br> <span class="themespan"><input type="radio" name="theme" class="theme" id="blackandwhite" value="blackandwhite">  Black & White
				    	<img class="thumb" src="images/theme-black-and-white.png" > </span>
  				<br> <span class="themespan"><input type="radio" name="theme" class="theme" id="redandblack"   value="redandblack">Red and Black
				    	<img class="thumb" src="images/theme-red-and-black.png" > </span>
  				<br> <span class="themespan"><input type="radio" name="theme" class="theme" id="kate"          value="kate">       Summer
				    	<img class="thumb" src="images/theme-summer.png" > </span>
  				<br> <span class="themespan"><input type="radio" name="theme" class="theme" id="magenta"       value="magenta">    Magenta
				    	<img class="thumb" src="images/theme-magenta.png" > </span>
  				<br> <span class="themespan"><input type="radio" name="theme" class="theme" id="blueandgreen"  value="blueandgreen">  Blue-Green
				    	<img class="thumb" src="images/theme-blue-green.png" > </span>
			</div>
			<hr>
			<a href="looma-speech-test.php"> LINK TO:  Looma speech test page </a>

			<!-- NOTE: the THEME buttons must be RADIO buttons to immediately trigger the change
			<button class="theme" id="green"         title="Eco Green"></button>
			<button class="theme" id="looma"         title="Looma Classic"></button>
			<button class="theme" id="hotpink"       title="Hot Pink"></button>
			<button class="theme" id="blackandwhite" title="Black & White"></button>
			<button class="theme" id="white"  	     title="White on White"></button>	-->
		</span>
	</div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>
   	<script src="js/looma-settings.js" type="text/javascript"></script>
	</body>
</html>