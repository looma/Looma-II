<!doctype html>
<!--
Author:

Filename: yyy.html
Date: 6/2015
Description: custom 404 page for looma browser if no internet present

-->
	<?php $page_title = 'Looma 404 ';
	      include ('includes/header.php'); ?>
    <link rel="stylesheet" href="css/looma-404.css">

  </head>

  <body>
  	<br><br><br><br><br><br><br><br><br><br>
    <img src="images/logos/LoomaLogoTransparent.png" height="100px">
    <br><br><br><br>
    <h1>Looma page not found</h1>

    <?php   include('includes/looma-control-buttons.php');?>
    <button class='control-button' id='dismiss' ></button>
  </body>
<?php include ('includes/js-includes.php'); ?></html>
