<!doctype html>
<!--
Filename: yyy.html
Date: 6/2015
Description: looma PHP template

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Date:   2018
Revision: Looma 3
-->

<?php $page_title = 'Looma Page Template';
    require_once ('includes/header.php');
?>

    <link rel="stylesheet" href="css/typography.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">
        <div id="left" contenteditable="true">
            <p>left hand text</p>
        </div>
        <div id="right" contenteditable="true">
            <p>right hand text</p>
        </div>
    </div>

    <div id="fullscreen-buttons">
        <?php include ('includes/looma-control-buttons.php');?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>


</body>
</html>
