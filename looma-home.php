<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: index.php   [home page for Looma]
Description: displays all the classes and on-click, all the subjects, plus toolbar for other pages
-->

<?php $page_title = 'Looma Home Page';
require_once ('includes/header.php');
require_once ('includes/mongo-connect.php');
define ("CLASSES", 8);
?>

<link rel="stylesheet" href="css/looma-home.css">

</head>

<body>
<div id="main-container-horizontal">

    <div id="head">
			    <img   class=" english-keyword" draggable="false"
                      src="images/logos/Looma-english-amanda 3x1.png" >
			    <img     class=" native-keyword" hidden draggable="false"
                      src="images/logos/Looma-nepali-amanda 3x1.png" >
        <!-- <p class="select-message">Choose Grade Level</p><br> -->
    </div>
    <!--  display CLASS buttons  -->
    <div id="classes" class="button-div">


    <?php
        //$classes = $textbooks_collection->distinct("class");
        $classes = mongoDistinct($textbooks_collection, "class");

        for ($i = 1; $i <= sizeOf($classes); $i++) {
            echo "<button type='button' class='class' id=class$i>";
            //echo "<div class='little'>"; keyword("Grade"); echo "</div>";
            echo "<div>";                keyword((string) $i);     echo "</div>";
            echo "</button>";
        }
        //print_r ($classes); return;
    /*    $i = 1;
        foreach ($classes as $class) {
            echo "<button type='button' class='class' id=$class>";
                echo "<div class='little'>"; keyword("Grade"); echo "</div>";
                echo "<div>";                keyword((string) $i);     echo "</div>";
            echo "</button>";
            $i++;
        }
*/
     /*
            //echo "<p class='english-keyword little'>"+ "Grade" + "</p>";
            //echo "<p class='native-keyword little'>"+ $TKW["Grade"] + "</p>";
     */

    ?>
    </div>

    <div id="subjects" class="button-div"></div>

</div>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-home.js"></script>
</body>
