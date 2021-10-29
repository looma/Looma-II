<!doctype html>
<?php
    $page_title = 'Looma Home Page';
    require_once ('includes/header.php');

    logUserActivity();
    logPageHit('home');

    ?>

    <link rel="stylesheet" href="css/looma-home.css">
</head>

<body>
    <div id="main-container-horizontal">

        <?php

        if($source === 'CEHRD') {
            //echo '<div id="head" class="cehrd">';
            echo '<img  id="logo"  class=" english-keyword" src="images/logos/CEHRD-banner-english.jpg" >';
               // echo '<img  id="logo"   src="images/logos/CEHRD-logo.png" >';
               // echo "<div id='logo-info' class='english-keyword'><br>
               //     <p>Government of Nepal</p>
               //     <p>Ministry of Education, Science and Technology</p>
               //     <p class='mid'>Center for Education and Human Resource Development</p>
               //     <p class='big'>LEARNING PORTAL </p>";
               // echo "</div>";
            echo '<img  id="native-logo" class=" native-keyword"  src="images/logos/CEHRD-banner-nepali.jpg" >';
            // echo "<div id='logo-info' class='native-keyword'><br>
               //     <p>नेपाल सरकार</p>
               //     <p>शिक्षा, विज्ञान तथा प्रविधि मन्‍‌त्रालय </p>
               //     <p>शिक्षा तथा मानव स्रोत विकास केन्द्र</p>
               //     <p class='big'>सिकाइ चौतारी </p>";
               // echo "</div>";
           // echo "</div>";
        } else {
           // echo '<div id="head">';
                echo '<img  id="logo"        class=" english-keyword" draggable="false"';
                echo 'src="images/logos/Looma-english-amanda 3x1.png" >';
                echo '<img  id="native-logo" class=" native-keyword" hidden draggable="false"';
                echo 'src="images/logos/Looma-nepali-amanda 3x1.png" >';
          //  echo "</div>";
        }
        ?>

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
            ?>
        </div>

        <div id="subjects" class="button-div"></div>

    </div>

    <?php
        if ($source === "CEHRD") {
            echo "<marquee id='marquee'>";
            echo "This CEHRD Learning Portal is still under construction. We welcome comments to iemis@cehrd.gov.np. Thank you.";
            echo "</marquee>";
        }
    ?>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-home.js"></script>
</body>
</html>