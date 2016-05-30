<!doctype html>
<!--
Author:
Email: skip@stritter.com
Filename: yyy.html
Date: x/x/2015
Description: 
-->

	<?php  $page_title = 'Looma Arithmetic Review';
	include ('includes/header.php'); ?>

	<link href="css/looma-arithmetic.css" type="text/css" rel="stylesheet" />

	</head>
	<body>	
	  <div id="main-container-horizontal">	
        <h3 id="grade">          <span id="gradeValue"> </span></h3>
        <h3 id="topic">          <span id="topicValue"> </span></h3>
        <h3 id="problem-count">  <?php keyword("Correct problems"); ?> : <span id="countValue"> </span></h3>
        
        <h1 class="credit"> Created by Joe</h1>


        <button id="next"     class="navigate" onclick="nextGenProb()"                  >
        	<?php keyword("New Problem"); ?></button>
        <button id='homePage' class="navigate" onclick="location.href='looma-arith.php'">
        	<?php keyword("Menu"); ?> </button>

        <div id="work-area">
        
        	<img id="division-symbol" src="images/long-division.png" style="visibility:hidden">
         <!-- for division only - hidden for other operators-->
       
        	<div name="num1"  id="num1"  ></div>
        	<div name="num2"  id="num2"  ></div>

			<!--enter digits into the answer line rigth-to-left for '+', '-', '*'. but, left-to-right for '/'   -->
			<input type="text" id="answer" name="answer" >
       		
       		<hr   id='answerLine' style="visibility:hidden">
        	<div id="operation" >  </div>
        	
        	<div class="button-group">       		
				<button id="enter" class="looma-button blue-footer"> <?php keyword("Enter"); ?> </button>
        		<button id="help"  class="looma-button blue-footer"> <?php keyword("Help"); ?>  </button>
        		<button id="reset" class="looma-button blue-footer"> <?php keyword("Clear"); ?> </button>
 			</div>
 		
       		<h2 id="message-correct" style="visibility: hidden">CORRECT - Click 'New Problem' to generate a new problem</h2>
     	  	<h2 id="message-wrong"   style="visibility: hidden">Please try again</h2>
     	 </div>
     	</div>
     	
     	
       	<div id="calculator">
       	
			<input type="text" id="calcDisplay" />
			
			<table id="calcTable">
			  <tr>
				<td id="1" class="numButton">1</td>
				<td id="2" class="numButton">2</td>
				<td id="3" class="numButton">3</td>
				<td id="+" class="numButton opButton">+</td>
				<td rowspan="2" id="clr">C</td>
			  </tr>
			  <tr>
				<td id="4" class="numButton">4</td>
				<td id="5" class="numButton">5</td>
				<td id="6" class="numButton">6</td>
				<td id="-" class="numButton opButton">-</td>
			  </tr>
			  <tr>
				<td id="7" class="numButton">7</td>
				<td id="8" class="numButton">8</td>
				<td id="9" class="numButton">9</td>
				<td id="*" class="numButton opButton">*</td>
				<td rowspan="2" id="+-">+/-</td>
			  </tr>
			  <tr>
				<td id="0"      class="numButton">0</td>
				<td id="."    class="numButton">.</td>
				<td id="=" class="numButton" >=</td>
				<td id="/" class="numButton opButton">÷</td>
			</tr>
			</table>
       	</div>
	</div>	

       	<script src="js/looma-arithmetic.js" type="text/javascript"></script>
		<script src="js/looma-utilities.js" type="text/javascript"></script>
 

   	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?> 
	<!--Include other JS here -->
       	<script src="js/looma-arith-problems.js" type="text/javascript"></script>
</html>
