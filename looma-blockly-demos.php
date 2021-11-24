<!doctype html>
<!--
Author: Mitsuka Kiyohara, Aayush Goyal
Filename: looma-blockly-demos.php
Date: May 2021
Description: Initial "demos" page. Takes the user to each demo.
-->

<?php  $page_title = 'Looma Blockly Demos';
    include ("includes/header.php");
    require('includes/looma-utilities.php');
    //require('includes/translate.php');
?>

<body>

<div id="main-container-horizontal" class='scroll'>
    <h1 class="credit"> Created by Aayush and Mitsuka</h1>
    <h1 class="title"> <?php keyword("Looma Blockly Demos"); ?> </h1>

        <?php 
            //make buttons for each demo found in mongodb collection blockly_demos
            $buttons = 1;
            $maxButtons = 3;

            echo "<table><tr>";

            $query = array();



            $demos = mongoFind($blockly_demos_collection, $query, null, null, null);

            foreach ($demos as $demo) {
              // $demo = Sdemos.next();
                echo "<td>";
                $dn = $demo['dn'];
                $ndn = isset($demo['ndn']) ?  $demo['ndn'] : "";
                $ft = "blockly-demo";
                $thumb = "images/logos/blockly.jpg";
                $id = $demo['_id'];  //mongoID of the descriptor for this lesson
                //use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom, $nfn, $npg,$prefix,$lang)
                makeActivityButton($ft, "", "", $dn, $ndn, $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);
                echo "</td>";
                $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";}

            } //end FOREACH demo
            echo "</tr></table>";
        ?> 

    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-blockly-demos.js"></script>
</body>
</html>

