<!doctype html>
<!--
Author:
Email: skip@stritter.com
Filename: yyy.html
Date: 6/2015
Description: looma PHP template

-->
	<?php $page_title = 'Looma Search Test ';
	      include ('includes/header.php'); ?>
<link rel = "Stylesheet" type = "text/css" href = "css/looma-search.css">

  </head>

  <body>
    <div id="main=container-horizontal">
  	<br><br><br><br><br><br><br><br><br><br>

    <button id="search-open" style="float:right;margin:10px;">Search</button>
    </div>


    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <?php include ('includes/looma-search.php'); ?>

    <script src="js/looma-search.js">   </script>

   </body>
</html>
