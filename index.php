<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: index.php   [home page for Looma]
Description: displays all the classes and on-click, all the subjects, plus toolbar for other pages
-->

<?php $page_title = 'Looma Home Page';
	  include ('includes/header.php'); 
	  include ('includes/mongo-connect.php');
	  
	  define ("CLASSES", 8);
?>
	</head>

	<body>
	<section>
	<div id="main-container-horizontal">

		<img src="images/logos/LoomaLogoTransparent.png" class="looma-logo" width="75%"/>
	
    	<!--  display CLASS buttons  -->
    	<div class="button-div" id="row1">

  	 <!--	
			//*****************
			// NOTE: consider using db.textbooks.distinct("class") to get the 
			// list of CLASSes that this database contains, instead of hardwiring Class names on button labels
			//*****************	
    --> 	
    	
    	<button type="button" class="class button-8" id="class1" data-mask="0110111111">
    			<p class="little"><?php keyword('Class') ?></p><?php keyword('1') ?>  </button>
		<button type="button" class="class button-8" id="class2" data-mask="0110111111">
    			<p class="little"><?php keyword('Class') ?></p><?php keyword('2') ?>  </button>
		<button type="button" class="class button-8" id="class3" data-mask="0110111111">
    			<p class="little"><?php keyword('Class') ?></p><?php keyword('3') ?>  </button>
		<button type="button" class="class button-8" id="class4" data-mask="0110111111">
    			<p class="little"><?php keyword('Class') ?></p><?php keyword('4') ?>  </button>
		<button type="button" class="class button-8" id="class5" data-mask="0110111111">
    			<p class="little"><?php keyword('Class') ?></p><?php keyword('5') ?>  </button>
		<button type="button" class="class button-8" id="class6" data-mask="0110111111">
    			<p class="little"><?php keyword('Class') ?></p><?php keyword('6') ?>  </button>
		<button type="button" class="class button-8" id="class7" data-mask="0110111111">
    			<p class="little"><?php keyword('Class') ?></p><?php keyword('7') ?>  </button>
		<button type="button" class="class button-8" id="class8" data-mask="0110111101">
    			<p class="little"><?php keyword('Class') ?></p><?php keyword('8') ?>  </button>    	
	</div>	
		<br><br><br>
		
		<!--  display SUBJECT buttons, 
			  all hidden until CLASS button is pressed, 
			  then show SUBJECT buttons based on data-mask  -->
			  
	<?php 
		$subjects = array('nepali', 'english', 'math', 'science', 'social studies');
	
    		//*****************
			// NOTE: consider using  db.textbooks.distinct("subject") to get the 
			// list of SUBJECTs that this database contains
			//*****************
    	
		//$i = 0; [old code?? delete??]		
	?>
    			
    <div class="button-div" id="row2">
		<button type="button" class="subject button-5 img" id="nepali"  hidden> 
			<?php keyword('Nepali') ?>  <br>
			<img class="en-tb" >  <img class="np-tb" ><br>
		</button>
		<button type="button" class="subject button-5 img" id="english" hidden> 
			<?php keyword('English') ?>    <br>
			<img class="en-tb" >  <img class="np-tb" ><br>
		</button>
		<button type="button" class="subject button-5 img" id="math"    hidden> 
			<?php keyword('Math') ?>    <br>
			<img class="en-tb" >  <img class="np-tb" ><br>
		</button>
		<button type="button" class="subject button-5 img" id="science" hidden> 
			<?php keyword('Science') ?>    <br>
			<img class="en-tb" >  <img class="np-tb" ><br>
		</button>
		<button type="button" class="subject button-5 img" id="social studies" hidden> 
			<?php keyword('Social Studies') ?>    <br>
			<img class="en-tb" >  <img class="np-tb" ><br>
		</button>
	</div>	
	
	</div>   
	</section>	
   	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?>   	   		
   	<script src="js/looma-home.js"></script>          <!-- Looma Javascript -->
