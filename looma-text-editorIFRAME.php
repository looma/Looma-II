<!doctype html>
<!--
LOOMA php code file
Filename: looma-text-editor.php
Description: popup php for creating and editing text slides for Looma Lesson Planner/Edited Video/Slideshow

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:Oct 2016
Revision: Looma 2.4

Comments:
-->

<?php $page_title = 'Looma - text editor';
	  include ('includes/header.php');
    if (!loggedin()) header('Location: looma-login.php');
?>

<link rel="stylesheet" href="css/font-awesome.min.css">
<link rel="stylesheet" href="css/bootstrap-wysiwyg.css">
<link rel="stylesheet" href="css/looma-text-editor.css">

</head>

<body>
    <!-- new iFrame June 2017 - used to open the text-editor iFrame when called from in another editor, e.g. lesson plan
         initially hidden by CSS, shown when New Text File button in filecommands.js is clicked  -->
        <div id="textdiv">
            <iframe id="textframe" src="./looma-text-frame.php" allowTransparency="true"> </iframe>
        </div>



<?php     include ('includes/toolbar.php');
include ('includes/js-includes.php');
?>
<script src="js/jquery.hotkeys.js">           </script>
<script src="js/tether.min.js">  </script>
<!--<script src="js/popper.js">  </script>  -->
<script src="js/bootstrap.min.js">           </script>
<script src="js/bootstrap-wysiwyg.min.js">   </script>

<?php     include ('includes/looma-filecommands.php');
include ('includes/looma-search.php');
?>

<script src="js/looma-text-editor.js">   </script>
</body>
>
