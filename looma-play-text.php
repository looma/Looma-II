<!doctype html>
<!--
LOOMA php code file
Filename: xxx.php
Description:

Programmer name:
Email:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision: Looma 2.0.x

Comments:
-->

<?php $page_title = 'Looma - Text File';
	  include ('includes/header.php');
	  include ('includes/mongo-connect.php');
?>

    <link rel="stylesheet" href="css/looma-play-text.css">
    <link rel="stylesheet" href="css/looma-text-display.css">

</head>

<body>
	<div id="main-container-horizontal">
    <?php
	    if (!isset($_REQUEST['id']) && !isset($_REQUEST['dn']))
            {
            echo "<div><img src='images/logos/LoomaLogoTransparent.png' alt='Looma Logo'/></div>";
            echo "<h2>file not found</h2>";
            }
        else {
            echo "<div id='fullscreen'>";
                include ('includes/looma-control-buttons.php');

                    if (isset($_REQUEST['id'])) {
                        $id = $_REQUEST['id'];
                        echo "<div id='the_id' data-id=" . rawurlencode($id) . " hidden></div>";
                    } else if (isset($_REQUEST['dn'])) {
                        $dn = $_REQUEST['dn'];
                        echo "<div id='the_dn' data-dn=" . rawurlencode($dn) . " hidden></div>";
                    };
                echo "<div id='editor'>";
                    echo "<div class='text-display'>";
                    echo "</div>";
                echo "</div>";
            echo "</div>";
            }
    ?>

	</div>

    <?php
	      include ('includes/toolbar.php');
   		  include ('includes/js-includes.php');
    ?>
     <script src="js/looma-play-text.js"></script>
</body>
