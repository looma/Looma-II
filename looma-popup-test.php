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

<?php $page_title = 'Looma - popup tester';
	  include ('includes/header.php');
	  /*OPTIONAL*/ include ('includes/mongo-connect.php');
?>
<style>
    button {height:30vh;
            width:30vh;
            }
</style>
</head>

<body>
	<div id="main-container-horizontal">

		<img src="images/logos/LoomaLogoTransparent.png" class="looma-logo" width="75%"/>
		<h1>This is looma-popup-test.php</h1>

            <button id="alert" >  alert   </button>
            <button id="confirm"> confirm </button>
            <button id="prompt">  prompt  </button>

	</div>

<?php
   		/*include either, but not both, of toolbar.php or toolbar-vertical.php*/
	      include ('includes/toolbar.php');
   		/*include ('includes/toolbar-vertical.php'); */
   		  include ('includes/js-includes.php');
    ?>
        <script src="js/looma-popup-test.js">  </script>
</body>
