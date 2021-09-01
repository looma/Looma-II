<!doctype html>
<!--
Name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-games.php [replaces old version]
-->

<?php $page_title = 'Games Page';
require_once ('includes/header.php');
require_once ('includes/mongo-connect.php');
define ("CLASSES", 10);
?>

<link rel="stylesheet" href="css/looma-home.css">
<link rel="stylesheet" href="css/looma-games.css">

</head>

<body>
<div id="main-container-horizontal">

    <h1 class="title"> <?php keyword("Games"); ?> </h1>


    <!--  display CLASS buttons  -->
    <div id="classes" class="button-div">
        <?php
        //$classes = $textbooks_collection->distinct("class");
        $classes = mongoDistinct($textbooks_collection, "class");

        for ($i = 1; $i <= sizeOf($classes); $i++) {
            echo "<button type='button' class='class' id=class$i>";
           // echo "<div class='little'>"; keyword("Grade"); echo "</div>";
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


    <a href="looma-bagh-chal.php" id="bagh-chal-href">
        <button id="bagh-chal"class="looma-control-button"></button>
    </a>

</div>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

<script src="js/looma-games.js"></script>
</body>
