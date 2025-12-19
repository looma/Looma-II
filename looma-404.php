<!doctype html>
<!--
Author:

Filename: looma-404.php
Date: 6/2015
Description: custom 404 page for looma browser if no internet present

-->
	<?php
        $page_title = 'Looma 404 ';
        include ('includes/header.php');
    ?>
    <link rel="stylesheet" href="css/looma-404.css">

  </head>

  <body>
    <div id="main-container-horizontal">
    <br><br><br><br><br><br><br><br><br><br>
    <img src="images/logos/LoomaLogoTransparent.png" height="100px">
    <br><br><br><br>
    <h1 >Looma - page not found</h1>

    <?php   include('includes/looma-control-buttons.php');?>
    <button class='control-button' id='dismiss' ></button>
</div>
     	<?php include ('includes/toolbar.php'); ?>
    	<?php include ('includes/js-includes.php'); ?>

  </body>
<?php include ('includes/js-includes.php'); ?>
</html>
