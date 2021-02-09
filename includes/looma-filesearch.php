<!doctype html>
<!--
Name: Bo, Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2018 03
Revision: Looma 2.0.0
File: includes/looma-filesearch.php

Description:  search code for Looma Editors to find lesson-plans, slideshows, etc
    this is separate from looma-search.php which is for searching for any activity file
-->


<?php

/**************  Search  **************/
/**************************************/

/*
Description:  search code for Looma Editors to find lesson-plans, slideshows, etc
    this is separate from looma-search.php which is for searching for any activity file

#filesearch-panel has 2 sections #filesearch-type-filter and #filesearch-criteria
in #filesearch-type-filter, CSS sets all .typ-chk checkboxes to display:none. JS can turn on/off individual .typ-chk checkboxes.
*/
?>
<link rel="stylesheet" href="css/looma-filesearch.css">

<div id='filesearch-panel'>
    <form id='filesearch' name='filesearch'>
        <input type='hidden' id='collection' value='activities' name='collection'/>
        <input type='hidden' id='cmd' value='search' name='cmd'/>

        <?php
        /**************************************/
        /************* Search Bar *************/
        /**************************************/
        echo "<div id='filesearch-bar' class='media-filter'>
            <input id='filesearch-term' type='text' class='media-input black-border' type='search' name='filesearch-term' placeholder='Enter Search Term...'>&nbsp;
            <button id='media-submit' class = \"filesearch\" name=\"search\" value=\"value\" type=\"submit\">
            <button class='clear-search' type='button'>Clear</button>
        </div>";


        /**************************************/
        /********** File Type Fields **********/
        /**************************************/
        echo "<div id='filesearch-type' class='chkbox-filter media-filter'>
            <span>Type:</span>";

        $types = array(
            array("history", "slideshow", "map", "evi"), //tags used as IDs for checkbox html elements
            array("history", "slideshow", "map", "evi"), //the 'ft' values used in the DB
            array("History", "Slideshow", "Map", "Edited video"), //human readable versions for labels displayed on checkboxes
        );
        for($x = 0; $x < count($types[0]); $x++) {
            echo "<span class='typ-chk' id='" . $types[0][$x] ."-chk'>
                    <input id='" . $types[1][$x] ."' class='media-input flt-chkbx media-filter' type='checkbox' name='type[]' value='" . $types[1][$x] . "'>
                    <label class='filter-label' for='" . $types[0][$x] . "'>" . $types[2][$x] . "</label>
                  </span>";}
        echo "</div>";

    echo "</form></div>";

        ?>
        <!--  <script src="js/looma-filesearch.js">   </script>  -->
