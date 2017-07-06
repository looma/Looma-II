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
?>

</head>

<body>
        <!-- new iFrame June 2017 - used to open the text-editor iFrame when called from in another editor, e.g. lesson plan
            initially hidden by CSS, shown when New Text File button in filecommands.js is clicked  -->
        <div id="textdiv">
            <iframe id="textframe" src="./looma-text-frame.php" allowTransparency="true"> </iframe>
        </div>


</body>