<!DOCTYPE html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: index.php   [home page for Looma]
Description: displays all the classes and on-click, all the subjects, plus toolbar for other pages
-->

<?php $page_title = 'Looma Calculator';
	  include ('includes/header.php'); 
?>  
   <link rel="stylesheet" type="text/css" href="css/looma-calculator.css">    
      
<body>

	<div id="main-container-horizontal">
		<h1 class="title"><?php keyword('Looma Calculator') ?></h1>
       <h1 class="credit"> Created by Vikram</h1>

	<!--NOTE: need to redo this code and the JS so that the readout can be typed into directly -->
<input name="ReadOut" id="display" type="Text" maxlength=16 value="" readonly>
    <table>
<tr>
	<td><button id="btn1" class="calc-button" value="  1  " 		onclick="NumPressed('1')">
		<?php keyword('1') ?></button></td>
	<td><button id="btn2" class="calc-button" value="  2  " 		onclick="NumPressed('2')">
		<?php keyword('2') ?></button></td>        
	<td><button id="btn3" class="calc-button" value="  3  " 		onclick="NumPressed('3')">
		<?php keyword('3') ?></button></td>
	<td colspan="2"><button id="btnC" class="calc-button"  onclick="Clear()">
		<?php keyword('Clear') ?></button></td>
</tr>
<tr>
	<td><button id="btn4" class="calc-button" value="  4  " 		onclick="NumPressed('4')">
		<?php keyword('4') ?></button></td>
	<td><button id="btn5" class="calc-button" value="  5  " 		onclick="NumPressed('5')">
		<?php keyword('5') ?></button></td>        
	<td><button id="btn6" class="calc-button" value="  6  " 		onclick="NumPressed('6')">
		<?php keyword('6') ?></button></td>
	<td><button id="btnplus" class="calc-button" value="  +  " 		onclick="Operation('+')">+</button></td>
	<td><button id="btnminus" class="calc-button" value="   -   " 	onclick="Operation('-')">-</button></td>
</tr>
<tr>
	<td><button id="btn7" class="calc-button" value="  7  " 		onclick="NumPressed('7')">
		<?php keyword('7') ?></button></td>
	<td><button id="btn8" class="calc-button" value="  8  " 		onclick="NumPressed('8')">
		<?php keyword('8') ?></button></td>        
	<td><button id="btn9" class="calc-button" value="  9  " 		onclick="NumPressed('9')">
		<?php keyword('9') ?></button></td>
	<td><button id="btnmultiply" class="calc-button" value="  *  " 	onclick="Operation('*')">*</button></td>
	<td><button id="btndivide" class="calc-button" value="   /   " 	onclick="Operation('/')">/</button></td>
</tr>
<tr>
	<td><button id="btnplusminus" class="calc-button" value=" +/- " onclick="Neg()">+/-</button></td>
	<td><button id="btn0" class="calc-button" value="  0  " 		onclick="NumPressed('0')">
		<?php keyword('0') ?></button></td>
	<td><button name="btnDecimal" class="calc-button" value="   . " onclick="Decimal()">.</button></td>
	<td colspan="2"><button id="btnequal" class="calc-button" 	    onclick="Operation('=')">=</button></td>
</tr>
</table>
</div>
</div>
<button hidden style="height:4%;margin: 0 15px; float:right;"><a href="#"> <!--looma-calculator-nepali.php"-->Nepali Calculator</a></button>
 
  	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?>   	 
	<script SRC="js/looma-calculator.js"></script>





</body>
</html>