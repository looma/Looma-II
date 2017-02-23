<!doctype html>
<!--
Author:
Email: skip@stritter.com
Filename: yyy.html
Date: 6/2015
Description: looma PHP template

-->
	<?php $page_title = 'Looma Video Player ';
	      include ('includes/header.php'); ?>
  </head>

  <body>
    <div id="main-container-horizontal">
       <div id="fullscreen">
            <?php include ('looma-video-player.php');
            /*echo "<iframe src='looma-video-player.php?fn=Above.mp4&fp=../content/videos/&dn=Above' allowfullscreen frameborder=0></iframe>";
            */
             ?>
            <button  id="fullscreen-control"></button><br>
       </div>

    </div>
    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-screenfull.js"></script>

   </body>
</html>