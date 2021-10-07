<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-paint.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma Paint';
	  include ('includes/header.php');

    logPageHit('paint');

 ?>
  	<!-- Replace .ico & apple-touch-icon.png in the root of your domain and delete these references -->
    <link rel="stylesheet" href="css/looma-paint.css">        	 <!-- Looma CSS -->

</head>

<body>
	<div id="main-container">

		<!--
			<span class="screensize"> screensize </span>
			<span class="bodysize"> body size </span>
			<br>
		-->

		<div class="button-div drop">
			<div class="dropdown">
    			<button class="drop-button" id="color"><img id="colorButton">
        			<div class="drop-content">
        				<img draggable="false" src="images/reddot.png"    name="color" value="red">
        				<img draggable="false" src="images/orangedot.png" name="color" value="orange">
        				<img draggable="false" src="images/yellowdot.png" name="color" value="yellow">
        				<img draggable="false" src="images/greendot.png"  name="color" value="green">
        				<img draggable="false" src="images/bluedot.png"   name="color" value="blue">
        				<img draggable="false" src="images/indigodot.png" name="color" value="indigo">
        				<img draggable="false" src="images/violetdot.png" name="color" value="violet">
        				<img draggable="false" src="images/greydot.png"   name="color" value="grey">
        				<img draggable="false" src="images/blackdot.png"  name="color" value="black">
        			</div>
    			</button>
			</div>

            <div class="dropdown">
		      <button class="drop-button" id="size"><img draggable="false" src="images/medium.png">
        			<div class="drop-content">
        				<img draggable="false" src="images/extrathin.png"  name="size" value="2">
        				<img draggable="false" src="images/thin.png"       name="size" value="5">
        				<img draggable="false" src="images/medium.png"     name="size" value="10">
        				<img draggable="false" src="images/thick.png"      name="size" value="20">
        				<img draggable="false" src="images/extrathick.png" name="size" value="30">
        			</div>
                </button>
            </div>

            <div class="dropdown">
    			<button class="drop-button" id="shape"><img draggable="false" src="images/scribble.png">
        			<div class="drop-content" >
        				<img draggable="false" src="images/scribble.png"  name="shape" value="scribble">
        				<img draggable="false" src="images/line.png"      name="shape" value="line">
        				<img draggable="false" src="images/rectangle.png" name="shape" value="rectangle">
        				<img draggable="false" src="images/circle.png"    name="shape" value="oval">
        				<img draggable="false" src="images/heart.png"     name="shape" value="heart">
        			</div>
                </button>
            </div>

            <div class="dropdown">
    			<button class="drop-button" id="pencil"><img draggable="false" src="images/draw.png">
        			<div class="drop-content" >
        				<img draggable="false" src="images/draw.png"  name="pencil" value="draw">
        				<img draggable="false" src="images/erase.png" name="pencil" value="erase">
        			</div>
                </button>
            </div>

            <div class="dropdown">
    			<button class="drop-button"><img draggable="false" src="images/undo.png">
        			<div class="drop-content" >
        				<img draggable="false" src="images/undo.png"  id="undo">
        				<img draggable="false" src="images/clear.png" id="clear">
        			</div>
                </button>
            </div>

            <div class="dropdown">
                <button class="drop-button"><?php keyword('File'); ?>
        			<div class="drop-content" >
        				<p id="save"><?php keyword('Save file'); ?></p>
        				<p id="open"><?php keyword('Open file'); ?></p>
        			</div>
                </button>
            </div>

			<div class="dropdown">
		    	<button class="drop-button" id="back"><img draggable="false" src="images/back-arrow.png"></button>
            </div>

		</div>

		<div id="canvas-div">
			<div id="notice" hidden><?php keyword("File saved");?></div>
   			<canvas id="canvas"></canvas>
		</div>
	</div>
    <h1 class = "credit">Created by Audrey, John, Akshay</h1>

</body>
   	<?php include ('includes/js-includes.php'); ?>
	<script src="js/paper-full.js"></script>
	<script src="js/looma-paint.js"></script></html>

   	<!-- JS for this page here:     <script src="js/looma-xxxx.js"></script>       -->
