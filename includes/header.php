<?php       //NOTE: cookies must be sent before any other data is sent to the client

header("Cache-Control: no-cache");
header("Pragma: no-cache");

//if (file_exists('../content/CEHRD')) echo '../content/CEHRD exists'; exit;
    //if (file_exists('../content/CEHRD')) $LOOMA_SERVER = 'CEHRD';

    // set $LOOMA_SERVER to the web server for this page
    // $_SERVER['$SERVER_NAME'] values are "learning.cehrd.edu.np:, "looma.website",
    //      "india.looma.website", "test.looma.website",
    //      and for looma boxes: "looma", or "india.looma"
    //UseCanonicalName On
//ServerName looma-local
    // Also, Turn on error reporting - only for localhost & test debugging, not on production server or looma box
    if        ($_SERVER['SERVER_NAME'] === 'learning.cehrd.edu.np') {
        $LOOMA_SERVER = 'CEHRD';
        error_reporting(0);
    } else if ( $_SERVER['SERVER_NAME'] === 'nepal.looma.website') {
        $LOOMA_SERVER = 'CEHRD';
        error_reporting(0);
    } else if ( $_SERVER['SERVER_NAME'] === '54.213.0.169') {
        $LOOMA_SERVER = 'CEHRD';
        error_reporting(0);
    } else if ($_SERVER['SERVER_NAME'] === 'looma.website') {
        $LOOMA_SERVER = 'looma';
        error_reporting(0);
    } else if ( $_SERVER['SERVER_NAME'] === 'india.looma.website') {
        $LOOMA_SERVER = 'INDIA';
        error_reporting(0);
    } else if ( $_SERVER['SERVER_NAME'] === 'india.looma') {
         $LOOMA_SERVER = 'INDIA';
         error_reporting(0);
    } else if ( $_SERVER['SERVER_NAME'] === 'test.looma.website') {
        $LOOMA_SERVER = 'test';
        error_reporting(E_ALL);
    } else {
        $LOOMA_SERVER = 'looma';
        error_reporting(E_ALL);
    }

   // set 'source' cookie and 'theme' cookie if needed, and refresh page
    if (!isset($_COOKIE['source']) || $_COOKIE['source'] !== $LOOMA_SERVER ||
        !isset($_COOKIE['theme'])  || $_COOKIE['theme']  !== $LOOMA_SERVER) {
              setcookie('source',$LOOMA_SERVER,0,"/");
              setcookie('theme', $LOOMA_SERVER,0,"/");
              header("Refresh:0");  //reload page to get cookies updated
              exit;
    }

// get operating environment of server
// settng global variables: $ENV_OS, $ENV_WINDOWS, $ENV_IP, $ENV_CPU
    $ENV_OS = PHP_OS;
    if ($ENV_OS === 'Darwin') $ENV_OS = 'MacOS';
    //$ENV_OS = PHP_OS_FAMILY;
    $ENV_WINDOWS = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN'; // boolean - true for Windows

    if ($ENV_WINDOWS) $ENV_CPU = shell_exec("echo %PROCESSOR_ARCHITECTURE%");
    else              $ENV_CPU = shell_exec('uname -m');

    if ($ENV_WINDOWS)
        $ENV_IP = getHostByName(getHostName());
    else
        $ENV_IP = shell_exec("ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'");
/*
    $ENV_IP = $_SERVER['SERVER_ADDR'];
    if ($ENV_IP === '::1') $ENV_IP = '127.0.0.1';
*/
    print "<!DOCTYPE html>";

    // display Looma or CEHRD logo and title
    if ($LOOMA_SERVER === 'CEHRD') {
       print "<title>Learning Portal</title>";
       print '<link rel="icon" type="image/png" href="images/logos/CEHRD-logo small.jpg">';
    } else {  //server default is  'looma'
        print "<title>{$page_title}</title>";
        print '<link rel="icon" type="image/png" href="images/logos/looma favicon yellow on blue.png">';
    }
    //echo 'source is ' . $_COOKIE['source']; exit;

?>
<html lang="en">
  <head>

<!--
    Author: Skip
    Owner:  VillageTech Solutions (villagetechsolutions.org)
    Date:   2015 03
    Revision: Looma 2.0.0
    File: header.php
-->
	<meta charset="utf-8">
    <meta name="viewport"  content="width=device-width, initial-scale=1">
  	<meta name="author"    content="Skip">
    <meta name="project"   content="Looma">
    <meta name="url"       content="https://looma.website">
    <meta name="owner"     content="Looma Education Corporation">
    <meta name="copyright" content="Looma Education Corporation">

      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <meta name="description" content="Looma Education: Nepal.
    Looma is an affordable and low power-consuming audio-visual education computer
    that provides reliable access to educational content for an entire classroom--offline.
    It combines a computer, A/V projection system, webcam, and massive library of media files,
    teacher tools, dictionary, learning games, educational videos, etc., replacing the Internet.
    It uses only 55 W, easily provided by solar, replacing electrical grid power.
    The current version of Looma is configured for grade K-12 education in Nepal. Configurations for other
    languages and countries are planned.">

<?php
    header_remove('X-Powered-By');
    header_remove('Server');

        require_once ('includes/looma-translate.php');
    //    require_once ('includes/mongo-connect.php');
        require_once ('includes/looma-log-user-activity.php');

        $documentroot = str_replace("Looma","",getenv("DOCUMENT_ROOT"));

        //$documentroot is used in looma-utilities.php for "realpath" checking
?>

      <!-- <div class="watermark">Under Construction</div>  -->

      <link rel="stylesheet" href="css/looma.css">             <!-- Looma CSS -->
      <link rel="stylesheet" href="css/looma-keyboard.css">    <!-- Looma keyboard CSS -->

    <?php  /*retrieve 'theme' cookie from $_COOKIE and use it to load the correct 'css/looma-theme-xxxxxx.css' stylesheet*/
            /*        if ( $LOOMA_SERVER === 'CEHRD' )         $settheme = "CEHRD";
                    else if (isset($_COOKIE['theme'])) $settheme = $_COOKIE['theme'];
                    else                               $settheme = 'looma';

                    echo "<link rel='stylesheet' href='css/looma-theme-" . $settheme . ".css' id='theme-stylesheet'>";
            */
    echo "<link rel='stylesheet' href='css/looma-theme-" .  $_COOKIE['theme'] . ".css' id='theme-stylesheet'>";

      //  require_once('includes/looma-isloggedin.php');

    function keyIsSet($key, $array) { return isset($array[$key]);} //compatibility shim for php 5.x "array_key_exists()"

    // set correct PHP timezone for this server
    if      ($_SERVER['SERVER_NAME'] === 'learning.cehrd.edu.np') {
        date_default_timezone_set("Asia/Kathmandu");
    } else if ($_SERVER['SERVER_NAME'] === '54.214.229.222' || $_SERVER['SERVER_NAME'] === 'looma.website') {
        date_default_timezone_set("America/Los_Angeles");
    } else if ( $_SERVER['SERVER_NAME'] === 'india.looma.website') {
        date_default_timezone_set("Asia/Kolkata");
    } else {
        date_default_timezone_set("America/Los_Angeles");
    }
        echo "<div id='timezone' hidden>" . date_default_timezone_get() . "</div>";
?>


