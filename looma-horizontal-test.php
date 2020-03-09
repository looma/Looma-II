<!doctype html>
<!--
Author:

Filename: yyy.html
Date: 6/2015
Description: looma PHP template

-->
	<?php $page_title = 'Looma xxxx ';
	      include ('includes/header.php'); ?>
  </head>
        <link rel="stylesheet" href="css/looma-horizontal-test.css">

  <body>
       <div id="main-container-horizontal">
       <div id="playground">
        <?php
            for ($i = 1; $i<100; $i++) echo "<div class='test'>$i</div>"; $i++;
        ?>
     </div> </div>
      <button id="scroll-right" class="scroller">scroll right</button>
      <button id="scroll-left" class="scroller">scroll left</button>
      </div>


    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/looma-horizontal-test.js"></script>
   </body>
</html>
