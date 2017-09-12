<!doctype html>
<!--
Author: lauren henze, lauren smith
Email: 
Filename: looma-map-basicMap.php
Date: Aug 2015
Description: 
-->
<?php $page_title = 'Nepal Map';
	  include ('includes/header.php'); 
	?>

    <link rel="stylesheet" href="css/looma-map.css">   
    <link rel="stylesheet" href="css/leaflet.css">   
<!--[if lt IE 9]> <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script> <![endif]-->

  </head>
  
  <body> 


      <h2>Basic Map</h2>
  	<div id="basicMap" style="width: 100%; height: 90%"></div>  	

   	<?php include ('includes/toolbar.php'); ?>   	   		
   	<?php include ('includes/js-includes.php'); ?> 
	<!--Include other JS here --> 
	<script src="js/leaflet.js"></script>	
	<!--<script src="js/mapbox-standalone.js"></script>	 -->
	<!-- <script src="js/mbtiles.js"></script>	-->
	<script src="js/topojson.js"></script>
	<script src="js/looma-map-basicMap.js"></script>
      
    <link rel="stylesheet" href="fullscreen/Control.FullScreen.css" />
    <script src="fullscreen/Control.FullScreen.js"></script>

  </body>
</html>