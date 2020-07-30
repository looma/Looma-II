<!--
Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Date:   2015 03
Revision: Looma 2.0.0

File: header.php
-->

<html lang="en" class="no-js">
  <head>
	<meta charset="utf-8">
    <meta name="viewport"  content="width=device-width, initial-scale=1">
  	<meta name="author"    content="Skip">
    <meta name="project"   content="Looma">
    <meta name="url"       content="https://looma.website">
    <meta name="owner"     content="Looma Education Corporation">
    <meta name="copyright" content="Looma Education Corporation">

    <meta name="description" content="Looma Education: Nepal.
    Looma is an affordable and low power-consuming audio-visual education computer
    that provides reliable access to educational content for an entire classroom--offline.
    It combines a computer, A/V projection system, webcam, and massive library of media files,
    teacher tools, dictionary, learning games, educational videos, etc., replacing the Internet.
    It uses only 55 W, easily provided by solar, replacing electrical grid power.
    The current version of Looma is configured for grade K-12 education in Nepal. Configurations for other
    languages and countries are planned.">

    <link rel="icon"     type="image/png" href="images/logos/looma favicon yellow on blue.png">
      <!--
  	<link rel="icon"     type="image/png" href="images/favicon-32x32.png">
  	-->
      <!--
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
                  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
                  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
                  <link rel="manifest" href="/site.webmanifest">
                  <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
                  <meta name="msapplication-TileColor" content="#da532c">
                  <meta name="theme-color" content="#ffffff">

       -->
      <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"> <!-- uses latest IE rendering engine-->
    <!--[if lt IE 9]> <script src="js/html5shiv.min.js"></script>  <![endif]-->

	<?php
  	    // Turn on error reporting
		error_reporting(E_ALL);
		ini_set('display_errors', 1);

		require_once ('includes/looma-translate.php');

		define ("CONTENT_PATH", "../content");
	?>

  	<title> <?php print $page_title; ?> </title>

    <link rel="stylesheet" href="css/tether.min.css">        <!-- needed by bootstrap.css -->
    <link rel="stylesheet" href="css/bootstrap.min.css">     <!-- Bootstrap CSS still needed ?? yes, for glyphicons-->
    <link rel="stylesheet" href="css/looma.css">             <!-- Looma CSS -->
    <link rel="stylesheet" href="css/looma-keyboard.css">    <!-- Looma keyboard CSS -->

    <?php  /*retrieve 'theme' cookie from $_COOKIE and use it to load the correct 'css/looma-theme-xxxxxx.css' stylesheet*/
        if(isset($_COOKIE["theme"])) $theme = $_COOKIE["theme"]; else $theme = "looma";
        echo "<link rel='stylesheet' href='css/looma-theme-" . $theme . ".css' id='theme-stylesheet'>";

        function loggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

    function keyIsSet($key, $array) { return isset($array[$key]);} //compatibility shim for php 5.x "array_key_exists()"
    ?>


