<!doctype html>
<!--
LOOMA php code file
Filename: looma-play-pdf.php
Description:

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:   APR 2020
Revision: Looma 5.7
-->

<?php $page_title = 'Looma PDF Viewer';
    include ('includes/header.php');
    require_once ('includes/looma-utilities.php');
  //  include_once ('includes/js-includes.php');
    $filepath = $_REQUEST['fp'];
    if ( strpos($filepath, 'chapters')) logFiletypeHit('chapter');
    else                                logFiletypeHit('pdf');
?>
<link rel="stylesheet" href="css/font-awesome.min.css">
</head>

<body>

<div id="main-container-vertical">
    <div id="fullscreen">

<?php
    include('includes/looma-pdf-toolbar.php');
    include('includes/looma-pdf-viewer.php');
    include('includes/looma-control-buttons.php');

    downloadButton($filepath, $filename);
?>
     <div id="thumbs"></div>
   </div>
</div>

<?php
include ('includes/toolbar-vertical.php');
include ('includes/js-includes.php');
?>
</body>
