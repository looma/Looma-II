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

/*
#search-panel has 5 sections. all optional. CSS sets them to display:none. use JS to make them visible
the sections are #type-filter, #class-subj-filter, #source-criteria, #keyword-filter and #search-criteria

in normal use, there is a radio button "media" and "chapter" that switches between showing search/type/keyword/source and showing class-subj-chapter

in addition, in #type-filter, CSS sets all .typ-chk checkboxes to display:none. JS can turn on/off individual .typ-chk checkboxes.
*/
?>
<link rel = "Stylesheet" type = "text/css" href = "css/looma-search.css">

<div id='search-panel'>
    <form id='search' name='search'>
        <input type='hidden' id='collection' value='activities' name='collection'/>
        <input type='hidden' id='cmd' value='search' name='cmd'/>
        <input type='hidden' id='includeLesson' value=true name='includeLesson'/>
        <input type='hidden' id='pageno' value='1' name='pageno'/>
        <input type='hidden' id='pagesz' value='500' name='pagesz'/>
        <input type='hidden' id='language' value='english' name='language'/>


  <!--  /**************************************/
        /********** Media v. Chapter **********/
        /**************************************/ -->
            <div id='search-kind'>
                <input type='radio' name='radio' value='activities' class='filter-radio black-outline' id='ft-media' checked>
                <label class='filter-label' for='ft-media'>Media</label>
                <input type='radio' name='radio' value='chapters' class='filter-radio black-outline' id='ft-chapter'>
                <label class='filter-label' for='ft-chapter'>Chapter</label>
            </div>

<!--   /**************************************/
       /*********** Media Search Section  ****/
       /**************************************/  -->
    <div id='media-search'>

        <!--    /**************************************/
                /************* Search Bar *************/
                /**************************************/  -->
            <div id='search-bar-div' class='media-filter'>
                <input id='search-term' type='text' autofocus class='media-input black-border' type='search' name='search-term' placeholder='Enter Search Term...') >&nbsp;
                <button id='media-submit' class = 'filesearch' name='search' value='media' type='submit'>
                    <img draggable="false" src="images/looma-search2.png">
                </button>
                <button class='clear-search' type='button'><?php keyword("Clear")?></button>
            </div>

        <?php
        /**************************************/
        /********** File Type Fields **********/
        /**************************************/
            echo "<div id='type-div' class='chkbox-filter media-filter'>";
                echo keyword("Type: ");

                $types = array(
                array("pdf", "video", "image",    "audio", "history", "html", "slideshow", "map", "lesson", "looma", "game", "text", "text-template"), //tags used as IDs for checkbox html elements
                array("pdf", "video", "image",    "audio", "history", "html", "slideshow", "map", "lesson", "looma", "game", "text", "text-template"), //the 'ft' values used in the DB
                array("PDF", "Video", "Pictures", "Audio", "History", "HTML", "Slideshow", "Map", "Lesson", "Page",  "Game", "Text", "Text Template"), //human readable versions for labels displayed on checkboxes
                );
                for($x = 0; $x < count($types[0]); $x++) {
                     echo "<span  class='typ-chk' data-id='"  . $types[0][$x] . "-chk'>";
                     echo "<label class='filter-label' for='" . $types[1][$x] . "-checkbox'>";
                     echo "<input id='" . $types[1][$x] . "-checkbox' class='media-input flt-chkbx media-filter' type='checkbox' name='type[]' value='" . $types[1][$x] . "'>";
                     echo keyword($types[2][$x]);  //keyword($types[2][$x]);
                     echo "</label></span>";
                    //if ($types[1][$x] == "map") echo "<br>";
                }
                echo "</div>";


            /*****************************************/
            /*********** Keyword Dropdowns  **********/
            /*****************************************/
            echo "<div id='keyword-div' class='keyword-filter media-filter'>";

            // get the ROOT document of the TAGs collection
            $query = array('name' => 'root', 'level' => 0);
            $root = mongoFindOne($tags_collection, $query);


            echo "<span id='keyword-drop-menu'>";
              echo  keyword("Keywords:");
                    echo "<select name='key1' id='key1-menu' class='media-filter  keyword-filter keyword-dropdown black-border' data-level=1 form='search'>";
                        echo "<option value='' data-dn='(any)' data-ndn='(कुनै)'>Select...</option>";

                        for($x = 0; $x < sizeof($root['children']); $x++) {
                            $y = $root['children'][$x]['name'];
                            $z = $root['children'][$x]['kids'];
                            echo "<option value='" . $y . "' data-id='" . $y . "' data-kids='" . $z. "'>";
                            echo     keyword($y);
                            echo "</option>";
                        }
        echo "</select>";

                    echo "<select name='key2' disabled id='key2-menu' class='media-filter keyword-filter keyword-dropdown black-border' data-level=2 form='search'>
                        <option value='' selected></option>";
                    echo "</select>";

                    echo "<select name='key3' disabled id='key3-menu' class='media-filter  keyword-filter keyword-dropdown black-border' data-level=3 form='search'>
                        <option value='' selected></option>";
                    echo "</select>";

                    echo "<select name='key4' disabled id='key4-menu' class='media-filter  keyword-filter keyword-dropdown black-border' data-level=4 form='search'>
                         <option value='' selected></option>";
                    echo "</select>";

            echo "</span></div>";


            /**************************************/
            /********* File Source  Fields ********/
            /**************************************/
            echo "<div id='source-div' class='chkbox-filter media-filter'>";
            echo keyword("Source:");
            $sources = array(
                array("CEHRD", "ck12",  "phet", "epaath",   "khan", "w4s",       "TED", 'hesperian'), // not used
                array("CEHRD", "Dr Dann", "PhET", "OLE",    "khan", "wikipedia", "TED", "hesperian"), //internal names for IDs  #xxx-chk and #xxx-checkbox
                array("CEHRD", "CK-12", "PhET", "ePaath", "Khan", "Wikipedia", "TED", "Hesperian"), //the displayed name for source values
            );

          for($x = 0; $x < count($sources[1]); $x++) {
              /*           echo "<span class='src-chk' data-id='" . $sources[0][$x] ."-chk'>
                                   <input data-id='" . $sources[1][$x] ."' class='media-input flt-chkbx' type='checkbox' name='src[]'' value='" . $sources[1][$x] . "'>
                                   <label class='filter-label' for='" . $sources[0][$x] . "'>" . $sources[2][$x] . "</label>
                                 </span>";}
           */

              echo "<span  class='src-chk' data-id='" .  $sources[1][$x] . "-chk'>";
              echo "<label class='filter-label' for='" . $sources[1][$x] . "-checkbox'>";
              echo "<input id='"  .$sources[1][$x] . "-checkbox' class='media-input flt-chkbx media-filter' type='checkbox' name='src[]' value='" . $sources[1][$x] . "'>";
              echo keyword($sources[2][$x]);
              echo "</label></span>";
          }

            echo "</div>";
        echo "</div>";

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


        /**************************************/
        /********* Chapter Dropdown  **********/
        /**************************************/
        echo "<span id='chapter-div' class='chapter-filter'>
            <span class='drop-menu'>Chapter:<select id='chapter-drop-menu' class='chapter-input black-border' name='chapter' form='search'>
                    <option value='' selected>(any)...</option>
          </select></span>";
        echo "</span>";

        echo "<button id='chapter-submit' class='chapter-filter filesearch black-border' name='search' value='chapter' type='submit'>";
            echo "<img draggable='false' src='/images/looma-search2.png'>";
            echo "</button>";
            
        echo "<button class='chapter-filter clear-search' type='button'>Clear</button>";
    echo "</div><br>";

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
    echo "</form></div>";

?>
