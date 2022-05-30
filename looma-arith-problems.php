<!doctype html>
<!--
Author:

Filename: yyy.html
Date: x/x/2015
Description:
-->

	<?php  $page_title = 'Looma Arithmetic Review';
	include ('includes/header.php'); ?>

    <link href="css/looma-numpad.css" rel="stylesheet">    <!-- Looma number pad CSS -->
	<link href="css/looma-arith-problems.css" type="text/css" rel="stylesheet" />

</head>
<body>
  <div id="main-container-horizontal">
      <div id="fullscreen">
          <div id="game">
            <div id="title">
                <span id="gradeValue"> </span>
                <span id="topicValue"> </span>
                <?php keyword("Correct problems"); ?> : <span id="countValue"> </span>
            </div>
            <div id="left">
                  <button id='homePage' class="navigate" >
                      <?php keyword("More Games"); ?>
                  </button>
              </div>
            <div id="right">
                <button id="next"     class="navigate">
                  <?php keyword("New Problem"); ?>
                </button>
            </div>

            <div id="work-area">
                <h2 id="message">&nbsp;</h2>
               <div name="num1"  id="num1"  ></div>
                <div name="num2"  id="num2"  ></div>
                <div id="operation" >  </div>
                <img id="division-symbol" src="images/long-division.png">

                <hr   id='answerLine'>

                <input type="text" id="answer" class="nokeyboard" name="answer" >

                <div class="button-group">
                    <button id="enter" class="looma-button blue-footer"> <?php keyword("Enter"); ?> </button>

                    <button id="clear" class="looma-button blue-footer"> <?php keyword("Clear"); ?> </button>
                </div>
             </div>
          </div>
          <?php include('includes/looma-control-buttons.php') ?>
      </div>
  </div>

  <h1 class="credit"> Created by Joe</h1>

   	<?php include ('includes/toolbar.php'); ?>
      <script src="js/jquery.min.js">      </script>      <!-- jQuery -->
      <script src="js/looma-utilities.js"> </script>      <!-- Looma utility functions -->
      <script src="js/looma.js">           </script>      <!-- Looma common page functions -->
      <script src="js/looma-screenfull.js"></script>      <!-- implements FULLSCREEN mode  -->
      <!--Include other JS here -->
    <script src="js/looma-numpad.js" type="text/javascript"></script>
    <script src="js/looma-arith-problems.js" type="text/javascript"></script>
</html>
