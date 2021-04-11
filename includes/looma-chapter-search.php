<!doctype html>
<!--
Name: Bo, Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2018 03
Revision: Looma 2.0.0
File: includes/looma-search.php

Description:  displays and navigates content folders for Looma 2
-->
<!--
    <link rel="stylesheet" href="css/looma-search.css">
    <link rel="stylesheet" href="css/font-awesome.min.css">
-->

<?php
require_once ('includes/mongo-connect.php');

/****** creating the search tool ******/
/**************************************/
/**************  Search  **************/
/**************************************/
//
//special version of includes/looma-search.php with only CHAPTER search
?>
<link rel = "Stylesheet" type = "text/css" href = "css/looma-search.css">

<div id='search-panel'>
    <form id='search' name='search'>
        <input type='hidden' id='collection' value='chapters' name='collection'/>
        <input type='hidden' id='cmd' value='search' name='cmd'/>
        <input type='hidden' id='pageno' value='1' name='pageno'/>
        <input type='hidden' id='pagesz' value='500' name='pagesz'/>
        <input type='hidden' id='language' value='english' name='language'/>


    <?php
            /**************************************/
            /*********** Chapter Search Section  **/
            /**************************************/
            echo "<div id='chapter-search'>";

            /**************************************/
            /*********** Grade Dropdown  **********/
            /**************************************/
            echo "<span id='grade-div' class='chapter-filter'>
                    <span class='drop-menu'>Grade:<select id='grade-drop-menu' class='chapter-input black-border' name='class' form='search'>
                        <option value='' selected>(any)...</option>";
            for($x = 1; $x <= 10; $x++){echo "<option value='" . $x . "' data-id='" . $x . "'>" . $x . "</option>";}

            echo "</select></span>";


            echo "</span>";
            echo "</span>";

            echo "<br>";


            /**************************************/
            /********* Subject Dropdown  **********/
            /**************************************/
            echo "<span id='subject-div' class='chapter-filter'>
          <span class='drop-menu'>Subject:<select id='subject-drop-menu' class='chapter-input black-border' name='subj' form='search'>
            <option value='' selected>(any)...</option>";

            $classInfo = array(
                array("all", "EN", "N", "M", "S", "SS", "H", "V"),
                array("All", "English", "Nepali", "Math", "Science", "Social Studies", "Health", "Vocation"),
            );
            for($x = 1; $x < count($classInfo[0]); $x++) {
                echo "<option name='subj' value='" . $classInfo[0][$x] . "'>" . $classInfo[1][$x] . "</option>";}

            echo "</select></span>";
            echo "</span>";

            echo "<br>";

            /**************************************/
            /********* Chapter Dropdown  **********/
            /**************************************/
            echo "<span id='chapter-div' class='chapter-filter'>
            <span class='drop-menu'>Chapter:<select id='chapter-drop-menu' class='chapter-input black-border' name='chapter' form='search'>
                    <option value='' selected>(any)...</option>
          </select></span>";
            echo "</span>";

            echo "<button id='chapter-submit' class='chapter-filter filesearch black-border' name='search' value='chapter' type='submit'>";
                echo "<img draggable='false' src='images/looma-search2.png'>";
            echo "</button>";

            /*
            echo "<button class='chapter-filter clear-search' type='button'>Clear</button>";
            echo "</div><br>";
            */
            /*
            echo "<p id='chapter-lang'>
          <label class='drop-menu'>Language:  </label>
          <input type = 'radio'
                 name = 'chapter-language'
                 id = 'en'
                 value = 'en'
                 checked = 'checked' />
          <label for = 'en'>English</label>
          <input type = 'radio'
                 name = 'chapter-language'
                 id = 'np'
                 value = 'np' />
          <label for = 'np'>Nepali</label>
                 </p>";
        */
    echo "</div><br>";
    echo "</form></div>";
    ?>
