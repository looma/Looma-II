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
    <link rel="stylesheet" href="css/looma-text.css">
</head>

<body>
	<div id="main-container-horizontal">
	    <div id="fullscreen">
    <?php
            $id = $_REQUEST['id'];
            //mongo look-up $id in text-file-collectio
            $entry = $text_files_collection->findOne(array("_id" => new MongoId($id)));  //had ", array("order")" param ????
            echo $entry['html'];
     ?>
       <button id="fullscreen-control"></button>
	   </div>
	</div>

<?php
   		/*include either, but not both, of toolbar.php or toolbar-vertical.php*/
	      include ('includes/toolbar.php');
   		/*include ('includes/toolbar-vertical.php'); */
   		  include ('includes/js-includes.php');
    ?>
     <script src="js/looma-screenfull.js"></script>
     <script src="js/looma-text.js"></script>
</body>
