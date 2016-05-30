<!DOCTYPEhtml>


<html lang="en">
  <head>
    <meta charset="utf-8">
  	<meta name="author" content="skip stritter">
    <title>Looma Map</title>
    <link rel="stylesheet" href="css/looma-map.css">   
    <link rel="stylesheet" href="css/leaflet.css">   
<!--[if lt IE 9]> <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script> <![endif]-->
	<style>
		.street-legend {
		line-height: 18px;
		color: #555;
		float: right;
		margin-right: 8px;
		margin-left: 4px;
		background-color: #fff;
		z-index: 1000;}

		.topLegend {
		line-height: 18px;
		color: #555;
		float: right;
		margin-right: 4px;
		margin-left: 4px;
		background-color: #fff;
		z-index: 1000;}

		.basLegend {
		line-height: 18px;
		color: #555;
		float: right;
		margin-right: 4px;
		margin-left: 4px;
		background-color: #fff;
		z-index: 1000;}
	</style>
  </head>
  
  <body> 

  	
  	<br><h2>Leaflet map</h2>	

      <h3>Basic Map</h3>
  	<div id="basicMap" style="width: 600px; height: 400px"></div>  	
      <h3>Administrative Zone and District Map</h3>
	<div id="NepalZones" style="width: 600px; height: 400px"></div>
      <h3>Street Map of Kathmandu and Patan</h3>
  	<div id="streetMap" style="width: 600px; height: 400px"></div>
      <h3>Topography Map</h3>
  	<div id="topography" style="width: 600px; height: 400px"></div>

  	
  	 <!-- Javascript links should come last, except for html5shiv -->
    <script src ="js/jquery.js"></script>
	<script src="js/leaflet.js"></script>	
	<script src="js/mapbox.standalone.js.map"></script>	
	<!-- <script src="js/mbtiles.js"></script>	-->
	<script src="js/topojson.js"></script>
	<script src="js/looma-map-leaflet.js"></script>
      
    <link rel="stylesheet" href="fullscreen/Control.FullScreen.css" />
    <script src="fullscreen/Control.FullScreen.js"></script>

  </body>
</html>
