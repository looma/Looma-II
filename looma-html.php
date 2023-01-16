<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-html.php
Description:  base page for showing HTML content. call with URL=looma.html.php?fp=filepath&fn=filename
-->

<?php $page_title = 'Looma HTML';
require_once ('includes/header.php');
require_once ('includes/looma-utilities.php');

//logFiletypeHit('html');
?>
<link rel="stylesheet" href="css/looma-html.css">
</head>

<body>
<?php

if (isset($_GET['fp'])) $filepath = $_REQUEST['fp']; else $filepath = "../content/";
if (isset($_GET['fn'])) $filename = $_REQUEST['fn']; else $filename = null;

     if (!realpath($filepath)) { echo "<br><h1>File not found</h1>"; exit;}
else if  ( ! is_dir(realpath($filepath)))
                    { echo "<br><h1>Access not permitted</h1>"; exit;}

if  ( ! preg_match("/content/",realpath($filepath)) &&
      ! preg_match("/ePaath/",realpath($filepath)))
                    { echo "<br><h1>Access not permitted</h1>"; exit;}

//NOTE: the ff should include recording ePaath hits
if      ( strpos($filepath, 'W4S2013')) logFiletypeHit('wikipedia');
else if ( strpos($filepath, 'PhET'))    logFiletypeHit('PhET');
// next line commented. counting HTML hits is distorted by Wikipedia navigation
//else                                                    logFiletypeHit('html');

?>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <!-- NOTE the iframe below has name='looma-frame', and wikipedia articles in looma have <a xxx.htm target="looma-frame" -->
        <?php echo "<iframe id='iframe' name='looma-frame' src='$filepath$filename' allowfullscreen>" ?></iframe>
        <?php include('includes/looma-control-buttons.php')?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-html.js"></script>
