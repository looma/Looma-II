<!--
    <meta http-equiv="Cache-Control" content="no-cache">
    <meta http-equiv="pragma" content="no-cache">

    OR

    header("Cache-Control: no-cache");
    header("Pragma: no-cache");

-->
<?php
   // header('Cache-Control: no-cache');
    $page_title = 'Looma Online';
    require_once ('includes/header.php');

    logUserActivity();
    logPageHit('home');
?>
    <link rel="stylesheet" href="css/looma-home.css">

<!-- textbooks are no longer kept in ../content
    <link rel="prefetch" href="../content/textbooks/Class1/English/English-1-2465.pdf" />
-->

</head>

<body>
    <div id="main-container-horizontal">

    <?php

        if($LOOMA_SERVER === 'CEHRD') {
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
        } else {  // $LOOMA_SERVER is 'looma' or 'looma local'

            echo '<div id="partner-logo-div">';
                echo '<img  id="partner-logo" draggable="false"';
                if (file_exists("images/logos/partner-logo.png")) echo 'src="images/logos/partner-logo.png"';
                echo '>';
            echo '</div>';

           echo '<div id="CEHRD-logo-div">';
                echo '<img  id="CEHRD-logo" draggable="false"';
                echo ' src="images/logos/CEHRD-logo.png" >';
                echo '<span id="CEHRD-text">MoEST, CEHRD</span>';
            echo '</div>';

            echo '<div id="looma-logo-div" >';
                echo '<img  id="looma-logo"        class=" english-keyword" draggable="false"';
                echo 'src="images/logos/Looma-english-amanda 3x1.png" >';
                echo '<img  id="looma-native-logo" class=" native-keyword" hidden draggable="false"';
                echo 'src="images/logos/Looma-nepali-amanda 3x1.png" >';
            echo '</div>';

           // echo "</div>";
        }
    ?>

        <!--  display CLASS buttons  -->
        <div id="classes" class="button-div">
            <?php
                $classes = mongoDistinct($textbooks_collection, "class");
                $z = []; foreach ($classes as $y) $z[] = (int) substr($y, 5); //sort($z);
                for ($i = 1; $i <= 12; $i++) {
                    if ( in_array($i, $z)) {
                        echo "<button type='button' class='class' id='class$i'>";
                        echo "<div>"; keyword((string) $i); echo "</div>";
                        echo "</button>";
                } else {
                        echo "<button disabled type='button' class='class empty' id='class$i'>";
                        echo "<div>"; keyword((string) $i); echo "</div>";
                        echo "</button>";
                    }
                }
            ?>
        </div>

        <div id="subjects" class="button-div"></div>

    </div>

    <?php
    /*    if ($LOOMA_SERVER === "CEHRD") {
            echo "<marquee id='marquee'>";
            echo "This CEHRD Learning Portal is still under construction. We welcome comments to iemis@cehrd.gov.np. Thank you.";
            echo "</marquee>";
        }
  */  ?>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>
    <script src="js/looma-home.js"></script>
</body>
</html>