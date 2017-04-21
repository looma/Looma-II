<!doctype html>
<!--
Author:
Email: skip@stritter.com
Filename: convert.php
Date: 6/2015
Description: one-time conversion to change 'ch_id' in 'activities' collection from scalar to array

-->
	<?php $page_title = 'Looma xxxx ';
	      include ('includes/header.php');
	      include ('includes/mongo-connect.php')
	?>
  </head>

  <body>

    <?php
        $cursor = $activities_collection -> find();

//NOTE: one-time conversion to change 'ch_id' in 'activities' collection from scalar to array
//  do not run again
//
// code commented out so it wont be run inadvertently

/*
        foreach ($cursor as $item) {
            echo "Item: " . (isset($item['dn']) ? $item['dn'] : "<none>") . "  (" . $item['_id']. ")<br>";

            $chapter = $item['ch_id'];
            $id =      $item['_id'];

            $activities_collection -> update(array('_id' => $id), array('$unset' =>array('ch_id' => 1)));
            $activities_collection -> update(array('_id' => $id), array('$addToSet' => array('ch_id' => $chapter)));
        }
*/
    ?>

    <?php include ('includes/js-includes.php'); ?>
   </body>
</html>