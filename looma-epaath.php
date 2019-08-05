<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2019 03
Revision: Looma 4.2
File: looma-epaath.php
Description:  base page for showing epaath content=
            call with "...?epversion=2015& fp= &fn=   "
            or, call with "...?epversion=2019&oleID=   "
-->

<?php $page_title = 'Looma ePaath';
include ('includes/header.php');
?>
<link rel="stylesheet" href="css/looma-html.css">
</head>

<body>
<?php
$epversion = $_REQUEST['epversion'];

if ($epversion == '2015') {  // old ePaath activities from 2016
        $filename = $_REQUEST['fn'];
        $filepath = $_REQUEST['fp'];
        $src = $filepath . $filename;
    }
    else {  // new ePaath activities from 2018
        $oleID = $_REQUEST['ole'];
        $grade = $_REQUEST['grade'];
        $src = '../ePaath/';
        if ($grade == '7' || $grade == '8') $src .= 'EPaath7-8/';

        $language = '&lang=';
        $language .= ($_COOKIE['language'] === 'english') ? 'en' : 'np';

        $src .= 'start.html?id=' . $oleID;
        $src .= $language . '&grade=' . $grade;
        //echo $language;return;
    }
?>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <!-- NOTE the iframe below has name='looma-frame', and wikipedia articles in looma have <a xxx.htm target="looma-frame" -->
        <?php echo "<iframe id='iframe' name='looma-frame' src='$src' allowfullscreen>" ?></iframe>
        <?php include('includes/looma-control-buttons.php')?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-html.js"></script>
