<!doctype html>
<!--
LOOMA php code file
Filename: looma-play-teacher-aid.php
Description: display Teacher Aid (text) files

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: FEB 2025
Revision:

Comments:
-->

<?php $page_title = 'Looma - Teacher Aid';
include ('includes/header.php');
?>

<link rel="stylesheet" href="css/looma-play-text.css">
<link rel="stylesheet" href="css/looma-text-display.css">

</head>

<body>
<div id="main-container-horizontal">
    <?php
    if ( ! isset($_REQUEST['ft']) || ! isset($_REQUEST['ch_id']))
    {
        echo "<div><img src='images/logos/LoomaLogoTransparent.png' alt='Looma Logo'/></div>";
        echo "<h2>file not found</h2>";
    }
    else {
        $ft = ($_REQUEST['ft']);
        $ch_id = ($_REQUEST['ch_id']);

        echo "<div id='fullscreen'>";

            $class =   ch_idToClass  ($ch_id);
            $subject = ch_idToSubject($ch_id);
            $fp = "../content/chapters/$class/$subject/en/$ch_id/$ft"
            $contents = file_get_contents($fp . $ft);

            echo "<div class='text-display'>";
                echo $contents;
            echo "</div>";
        echo "</div>";
    }
    ?>

</div>

<?php
include ('includes/toolbar.php');
include ('includes/js-includes.php');
?>
<script src="js/looma-play-teacher-aid.js"></script>
</body>
<?php
