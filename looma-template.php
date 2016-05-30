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

<?php $page_title = 'Looma - put page title here';
	  include ('includes/header.php');
	  /*OPTIONAL*/ include ('includes/mongo-connect.php');
?>

</head>

<body>
	<div id="main-container-horizontal">

		<img src="images/logos/LoomaLogoTransparent.png" class="looma-logo" width="75%"/>
		<h1>This is looma-template.php</h1>

	</div>

<?php
   		/*include either, but not both, of toolbar.php or toolbar-vertical.php*/
	      include ('includes/toolbar.php');
   		/*include ('includes/toolbar-vertical.php'); */
   		  include ('includes/js-includes.php');
    ?>
</body>
