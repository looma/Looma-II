<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: index.php   [home page for Looma]
Description: displays all the classes and on-click, all the subjects, plus toolbar for other pages
-->

<?php $page_title = 'Looma Home Page';
require_once ('includes/header.php');
define ("CLASSES", 8);
?>

<link rel="stylesheet" href="css/looma-home.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="head">
        <img src="images/logos/LoomaLogoTransparent.png" class="looma-logo"/>
    </div>

    <!--  display CLASS buttons  -->
    <div id="classes" class="button-div">

        <!--
             //*****************
             // NOTE: consider using db.textbooks.distinct("class") to get the
             // list of CLASSes that this database contains, instead of hardwiring Class names on button labels
             //*****************
     -->

        <button type="button" class="class " id="class1" data-name="Grade1" data-mask="0110111111">
            <p class="little">Grade</p><?php keyword('1') ?>  </button>
        <button type="button" class="class " id="class2" data-name="Grade2" data-mask="0110111111">
            <p class="little">Grade</p><?php keyword('2') ?>  </button>
        <button type="button" class="class " id="class3" data-name="Grade3" data-mask="0110111111">
            <p class="little">Grade</p><?php keyword('3') ?>  </button>
        <button type="button" class="class " id="class4" data-name="Grade4" data-mask="0110111111">
            <p class="little">Grade</p><?php keyword('4') ?>  </button>
        <button type="button" class="class " id="class5" data-name="Grade5" data-mask="0110111111">
            <p class="little">Grade</p><?php keyword('5') ?>  </button>
        <button type="button" class="class " id="class6" data-name="Grade6" data-mask="0110111111">
            <p class="little">Grade</p><?php keyword('6') ?>  </button>
        <button type="button" class="class " id="class7" data-name="Grade7" data-mask="0110111111">
            <p class="little">Grade</p><?php keyword('7') ?>  </button>
        <button type="button" class="class " id="class8" data-name="Grade8" data-mask="0110111101">
            <p class="little">Grade</p><?php keyword('8') ?>  </button>
    </div>

    <div id="subjects" class="button-div">
        <button type="button" class="subject  img" id="nepali"  >
            <?php keyword('Nepali') ?>  <br>
            <img class="en-tb" >  <img class="np-tb" ><br>
        </button>
        <button type="button" class="subject  img" id="english" >
            <?php keyword('English') ?>    <br>
            <img class="en-tb" >  <img class="np-tb" ><br>
        </button>
        <button type="button" class="subject  img" id="math"    >
            <?php keyword('Math') ?>    <br>
            <img class="en-tb" >  <img class="np-tb" ><br>
        </button>
        <button type="button" class="subject  img" id="science" >
            <?php keyword('Science') ?>    <br>
            <img class="en-tb" >  <img class="np-tb" ><br>
        </button>
        <button type="button" class="subject  img" id="social studies" >
            <?php keyword('Social Studies') ?>    <br>
            <img class="en-tb" >  <img class="np-tb" ><br>
        </button>
    </div>

</div>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-home.js"></script>
</body>
