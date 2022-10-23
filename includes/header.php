<?php       //NOTE: cookies must be sent before any other data is sent to the client

    //if (file_exists('../content/CEHRD')) echo '../content/CEHRD exists'; exit;
    //if (file_exists('../content/CEHRD')) $LOOMA_SERVER = 'CEHRD';

    // set $SERVER_NAME to the web server for this page
    // Turn on error reporting - only for localhost debugging, not on production server or looma box
if      ($_SERVER['SERVER_NAME'] === 'learning.cehrd.edu.np') {
        $LOOMA_SERVER = 'CEHRD';
        error_reporting(0);
    } else if ($_SERVER['SERVER_NAME'] === '54.214.229.222' || $_SERVER['SERVER_NAME'] === 'looma.website') {
        $LOOMA_SERVER = 'looma';
        error_reporting(0);
    } else if ( $_SERVER['SERVER_NAME'] === 'india.looma.website') {
        $LOOMA_SERVER = 'looma india';
      //  date_default_timezone_set("Asia/Kolkata")
        error_reporting(0);
    } else if ( $_SERVER['SERVER_NAME'] === 'test.looma.website') {
        $LOOMA_SERVER = 'looma test';
        error_reporting(E_ALL);
    } else {
        $LOOMA_SERVER = 'looma local';
        error_reporting(E_ALL);
    }

    //echo "server[server_name) is " . $_SERVER['SERVER_NAME'];exit;

/*
    if ($LOOMA_SERVER === 'looma local')
        ini_set('open_basedir', "/var/www/html/Looma:/var/www/html/content:/var/www/html/maps2018:/var/www/html/ePaath:/tmp");
    else
        ini_set('open_basedir', "/usr/local/var/www/Looma:/usr/local/var/www/content:/usr/local/var/www/maps2018:/usr/local/var/www/ePaath:/tmp");
    // NOTE: apparently "ini_set()" cannot set "open_basedir" (at least on MAC).
    // be sure open_basedir is set in PHP.ini or in httpd.conf/apache2.conf
*/
     // to check the open_basedir setting, temporarily uncomment this line:
        //echo "The open_basedir value is ". ini_get('open_basedir');

    if (!isset($_COOKIE['source']) || $_COOKIE['source'] !== $LOOMA_SERVER) {
        setcookie('source',$LOOMA_SERVER,0,"/");
        if ($LOOMA_SERVER === 'CEHRD') setcookie('theme', 'CEHRD',0,"/");
        if ($LOOMA_SERVER === 'looma india') setcookie('theme', 'INDIA',0,"/");
        header("Refresh:0");  //reload page to get cookies updated
        exit;
    }

    print "<!DOCTYPE html>";

    if ($LOOMA_SERVER === 'CEHRD') {
       print "<title>Learning Portal</title>";
       print '<link rel="icon" type="image/png" href="images/logos/CEHRD-logo small.jpg">';
    } else {  //server default is  'looma'
        print "<title>{$page_title}</title>";
        print '<link rel="icon" type="image/png" href="images/logos/looma favicon yellow on blue.png">';
    }
    //echo 'source is ' . $_COOKIE['source']; exit;

?>
<!--<html lang="en" class="no-js"> -->
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

    <meta name="description" content="Looma Education: Nepal.
    Looma is an affordable and low power-consuming audio-visual education computer
    that provides reliable access to educational content for an entire classroom--offline.
    It combines a computer, A/V projection system, webcam, and massive library of media files,
    teacher tools, dictionary, learning games, educational videos, etc., replacing the Internet.
    It uses only 55 W, easily provided by solar, replacing electrical grid power.
    The current version of Looma is configured for grade K-12 education in Nepal. Configurations for other
    languages and countries are planned.">

<?php
   // ini_set('display_errors', 1);
    header_remove('X-Powered-By');
    header_remove('Server');


        require_once ('includes/looma-translate.php');
        require_once ('includes/mongo-connect.php');
        require_once ('includes/looma-log-user-activity.php');

        $documentroot = str_replace("Looma","",getenv("DOCUMENT_ROOT"));
        //echo 'DocmumentRoot is ' . $documentroot;
?>

      <!-- <div class="watermark">Under Construction</div>  -->

      <link rel="stylesheet" href="css/looma.css">             <!-- Looma CSS -->
      <link rel="stylesheet" href="css/looma-keyboard.css">    <!-- Looma keyboard CSS -->

    <?php  /*retrieve 'theme' cookie from $_COOKIE and use it to load the correct 'css/looma-theme-xxxxxx.css' stylesheet*/
        if ( $LOOMA_SERVER === 'CEHRD' )         $settheme = "CEHRD";
        else if (isset($_COOKIE['theme'])) $settheme = $_COOKIE['theme'];
        else                               $settheme = 'looma';

        echo "<link rel='stylesheet' href='css/looma-theme-" . $settheme . ".css' id='theme-stylesheet'>";

      //  require_once('includes/looma-isloggedin.php');

        function keyIsSet($key, $array) { return isset($array[$key]);} //compatibility shim for php 5.x "array_key_exists()"
    ?>


