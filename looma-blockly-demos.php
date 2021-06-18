<!doctype html>
<!--
Author: Mitsuka Kiyohara, Aayush Goyal
Filename: looma-demos.php
Date: May 2021
Description: Initial "demos" page. Takes the user to each demo.
-->


<?php  $page_title = 'Looma Timeline Histories';
    include ("includes/header.php");
    require ('includes/mongo-connect.php');
    require('includes/looma-utilities.php');
    //require('includes/translate.php');

function makeButton($id, $thumb, $dn) {

    //DEBUG   echo "making button with path= $path  file= $file   ext= $ext"; //DEBUG

    echo "<button class=' play activity img' data-ft=demos data-id='" . (string)$id . "'>"; 
    echo "<img src='" . $thumb . "'>";
    echo keyword($dn);

    //finish BUTTON
    echo "</button>";

}  //end makeButton()
?>

<body>
<link href='css/looma-demo.css' rel='stylesheet' type='text/css'> 
<!--<h1 class="credit"> Created by Aayush and Mitsuka</h1>-->

<div id="main-container-horizontal" class='scroll'>
    <h1 class="title"> <?php keyword("Looma Demos"); ?> </h1> 
    <!-- TEMPORARY SOLUTION -- TABLE OF CONTENTS THAT MUST BE LINKED TO HTML FILE 
    <div class="center">
        <br>
        <div id="toc_container">
            <ul class="toc_list">
                <li><a href="looma-template-blocklygenerator.php"> Blockly Generator </a></li>
                <li><a href="#Second_Point_Header">Maze</a></li>
                <li><a href="#Third_Point_Header">Puzzle</a></li>
                <li><a href="#Forth_Point_Header">Bird</a></li>
                <li><a href="#Fifth_Point_Header">Movie</a></li>
                <li><a href="#Sixth_Point_Header">Turtle</a></li>
            </ul>
        </div> 
    --> 


        <?php 
            //make buttons for timelines directory -- virtual folder, populated from histories collection in mongoDB 
            // instead of accessing files in mongoDB, access files through a function 
            $buttons = 1;
            $maxButtons = 3;

            echo "<table><tr>";

            //$demos = $demos_collection -> find($query);
            $demos = looma.demos.find()
            //mongoFindOne($demos_collection, null, null, null, null);

            foreach ($demos as $demo) {
               //echo "DEBUG   found lesson " . $lesson['dn'] . "<br>";
                echo "<td>";
                $dn = $demos['title'];
                $ndn = isset($demos['ndn']) ?  $demos['ndn'] : "";
                $ft = "demo"; //$ft = "history";
                //$thumb = "../content/timelines/" . $dn . "_thumb.jpg";
                //$thumb = $demos['thumb'];
                //$thumb = $path . "/thumbnail.png";
                $id = $demos['_id'];  //mongoID of the descriptor for this lesson
                //use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom, $nfn, $npg,$prefix,$lang)
                makeActivityButton($ft, "", "", $dn, $ndn, "", "", $id, "", "", "", "", "", "", null, null,null,null); 
                    //changed $thumb to "" since not using here it for demo, 6th parameter
                //makeButton($id, $thumb, $dn);
                echo "</td>";
                $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";}

            } //end FOREACH demo
            echo "</tr></table>";
        ?> 

    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-histories.js"></script> <!--change to looma-demos.js -->  <!-- Looma Javascript -->

</body>
</html>

