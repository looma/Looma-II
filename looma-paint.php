<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-paint.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma Paint';
	  include ('includes/header.php');
	  include ('includes/mongo-connect.php');

 ?>
  	<!-- Replace .ico & apple-touch-icon.png in the root of your domain and delete these references -->
    <link rel="stylesheet" href="css/looma-paint.css">        	 <!-- Looma CSS -->


</head>

<body>
	<div id="main-container">
		      <!--  <h1 class="credit"> Created by Audrey, John and Akshay</h1>  -->

		<!--
			<span class="screensize"> screensize </span>
			<span class="bodysize"> body size </span>
			<br>
		-->

		<div class="button-div drop">
			<button class="drop-button" id="color"><img id="colorButton">
			<div class="drop-content">
				<img src="images/reddot.png"    name="color" value="red">
				<img src="images/orangedot.png" name="color" value="orange">
				<img src="images/yellowdot.png" name="color" value="yellow">
				<img src="images/greendot.png"  name="color" value="green">
				<img src="images/bluedot.png"   name="color" value="blue">
				<img src="images/indigodot.png" name="color" value="indigo">
				<img src="images/violetdot.png" name="color" value="violet">
				<img src="images/greydot.png"   name="color" value="grey">
				<img src="images/blackdot.png"  name="color" value="black">
			</div>
			</button>

		<button class="drop-button" id="size"><img src="images/medium.png">
			<div class="drop-content">
				<img src="images/extrathin.png"  name="size" value="2">
				<img src="images/thin.png"       name="size" value="5">
				<img src="images/medium.png"     name="size" value="10">
				<img src="images/thick.png"      name="size" value="20">
				<img src="images/extrathick.png" name="size" value="30">
			</div>
			</button>
			<button class="drop-button" id="shape"><img src="images/scribble.png">
			<div class="drop-content" >
				<img src="images/scribble.png"  name="shape" value="scribble">
				<img src="images/line.png"      name="shape" value="line">
				<img src="images/rectangle.png" name="shape" value="rectangle">
				<img src="images/circle.png"    name="shape" value="oval">
				<img src="images/heart.png"     name="shape" value="heart">
			</div>
			</button>
			<button class="drop-button" id="pencil"><img src="images/draw.png">
			<div class="drop-content" >
				<img src="images/draw.png"  name="pencil" value="draw">
				<img src="images/erase.png" name="pencil" value="erase">
			</div>
			</button>
			<button class="drop-button"><img src="images/undo.png">
			<div class="drop-content" >
				<img src="images/undo.png"  id="undo">
				<img src="images/clear.png" id="clear">
			</div>
			</button>
			<button class="drop-button"><?php keyword('File'); ?>
			<div class="drop-content" >
				<p id="save"><?php keyword('Save file'); ?></p>
				<p id="open"><?php keyword('Open file'); ?></p>
			</div>
			</button>
			<button class="drop-button" id="back"><img src="images/back-arrow.png"></button>
		</div>

		<div id="canvas-div">
			<div id="notice" hidden><?php keyword("File saved");?></div>
   			<canvas id="canvas"></canvas>
		</div>
	</div>
</body>
   	<?php include ('includes/js-includes.php'); ?>
	<script src="js/paper-full.js"></script>
	<script src="js/looma-paint.js"></script></html>

   	<!-- JS for this page here:     <script src="js/looma-xxxx.js"></script>       -->
