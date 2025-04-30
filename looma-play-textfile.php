<!doctype html>
<!--
Filename: looma-play-textfile.php

Author: Skip
Owner:  Looma Education Company
Date:   MAR 2025
Revision: 1.0
-->

<?php $page_title = 'Looma Teacher Aid';
require_once ('includes/header.php');
/* header.php imports: CSS: looma.css, looma-keyboard.css, bootstrap.css */
?>

<link rel="stylesheet" href="css/looma-play-textfile.css">

</head>

<body>
<?php
    $ch_id = $_GET['ch_id'];
    $grade = $_GET['grade'];
    $subject = $_GET['subject'];
    $dn = $_GET['dn'];
    $type = $_GET['type'];

?>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <?php
        echo "<h2>$type of $grade $subject \"$dn\"</h2>";
        ?>
        <div id="textdisplay">

            <?php
            $fh = fopen("../content/chapters/$grade/$subject/en/$ch_id.$type",'r');
            while ($line = fgets($fh)) {
                // <... Do your work with the line ...>
                echo($line);
            }
            fclose($fh);
            ?>
        </div>

        <?php include ('includes/looma-control-buttons.php');?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>      <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->

<script src="js/looma-template.js"></script>          <!--  Javascript for this page-->
</body>
</html>
