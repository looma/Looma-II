<!doctype html>
<!--
Author:

Filename: looma-503.html
Date: 6/2015
Description: custom 404 page for looma browser if no internet present

-->
<?php $page_title = 'Looma 503 ';
include ('includes/header.php'); ?>
</head>

<body>
<br><br><br><br><br><br><br><br><br><br>
<span><img src="images/logos/LoomaLogoTransparent.png" height="100px"></span>
<h2>This Looma is not connected to the internet</h2>

<?php   include('includes/looma-control-buttons.php');?>
<button class='control-button' id='dismiss' ></button>
</body>
<?php include ('includes/js-includes.php'); ?>

</html>
