<!doctype html>
<!--
Filename: looma-editor-template.php
Description: template for Looma editor tools, like Lesson Plan Editor, Slideshow Editor, etc

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 3.0
 -->

<?php   $page_title = 'Looma Activity Editor';
include ('includes/header.php');
if (!loggedin()) header('Location: looma-login.php');
?>

<link rel = "Stylesheet" type = "text/css" href = "css/looma-edit-activities.css">

</head>

<body>

<section>
    <div id="main-container">

        <div id="header" class="inner-div">
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>Looma Activity Editor</span>
        </div>

        <div id="search-bar" class="inner-div">

            <?php require_once ('includes/looma-search.php');?>

        </div>

        <div id="outerResultsDiv">
            <div id="innerResultsMenu">
                <p class="hint">This tool is used to edit Looma Activities</p>
                <p class="hint">1. Use the search bar at the top to select Activities</p>
                <p class="hint">2. Check the checkbox of the Activity or Activities to modify</p>
                <p class="hint">3. Mouse over the INFO button to see details of an Activity</p>
                <p class="hint">4. Modify the Display Name in place in the search results list</p>
                <p class="hint">5. Use the entries at the right to specify properties to set</p>
                <p class="hint">6. Click "Submit" to make the changes</p>
            </div>
            <div id="results-div"></div>
            <div id="innerResultsDiv">
            </div>
        </div>
        <div id="previewpanel" class="inner-div">
            <form id='changes' name='changes'>
                <input type='hidden'                         value='activities'   name='collection'/>
                <input type='hidden' id='changes-cmd'        value='editActivity' name='cmd'/>

                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>
                <input type='hidden' class='changes-activities' value=''           name='activities[]'/>

                <div>New display name: <input id='dn-changes' class='media-filter' name='dn' type='text'></input>
                    <button class='chng-clear' id='dn-clear'>X</button>
                </div>
        <?php

            /*****************************************/
            /*********** Keyword Dropdowns  **********/
            /*****************************************/
            echo "<div id='keyword-changes' class='keyword-filter media-filter'>";


            // get the ROOT document of the TAGs collection
            $query = array('name' => 'root', 'level' => 0);
            $root = $tags_collection -> findOne($query);


            echo "<span id='keyword-changes-menu'>Keywords:
                            <select name='key1' id='key1-changes-menu' class='media-filter  keyword-changes keyword-dropdown black-border' data-level=1 form='changes'>
                                <option value=''>Select keyword...</option>";

            for($x = 0; $x < sizeof($root['children']); $x++) {
                $y = $root['children'][$x]['name'];
                $z = $root['children'][$x]['kids'];
                echo "<option value='" . $y . "' id='" . $y . "' data-kids='" . $z. "'>" . $y . "</option>";
            };
            echo "</select>";

            echo "<select name='key2' disabled id='key2-changes-menu' class='media-filter keyword-changes keyword-dropdown black-border' data-level=2 form='changes'>
                                <option value='' selected></option>";
            echo "</select>";

            echo "<select name='key3' disabled id='key3-changes-menu' class='media-filter  keyword-changes keyword-dropdown black-border' data-level=3 form='changes'>
                                            <option value='' selected></option>";
            echo "</select>";

            echo "<select name='key4' disabled id='key4-changes-menu' class='media-filter  keyword-changes keyword-dropdown black-border' data-level=4 form='changes'>
                                            <option value='' selected></option>";
            echo "</select>";

            echo "</span>";
            echo "<button class='chng-clear' id='keyword-clear'>X</button>";

            echo "</div>";


            /**************************************/
            /********* File Source  Fields ********/
            /**************************************/
            echo "<div id='source-changes' class='chkbox-filter media-filter'>
                                <span>Source:</span>";

            $sources = array(
                array("ck12", "phet", "epth", "khan", "w4s", "TED"),
                array("Dr Dann", "PhET", "ePaath", "khan", "wikipedia", "TED"),
                array("CK-12", "PhET", "ePaath", "Khan", "Wikipedia", "TED"),
            );
            for($x = 0; $x < count($sources[0]); $x++){
                echo "<span class='src-chng' data-id='" . $sources[0][$x] ."-chng'>
                                    <input data-id='" . $sources[1][$x] ."' class='media-input flt-chkbx source-changes' type='radio' form='changes' name='src' value='" . $sources[1][$x] . "'>
                                    <label class='filter-label' for='" . $sources[0][$x] . "'>" . $sources[2][$x] . "</label>
                                  </span>";};
            echo "<button class='chng-clear' id='source-clear'>X</button>";
            echo "</div>";


            /**************************************/
            /*********** Grade Dropdown  **********/
            /**************************************/
            echo "<div id='textbook-changes'>";
            echo "<span id='grade-changes' >
                                <span class='drop-menu'>Grade:<select id='grade-chng-menu' class='chapter-changes black-border'  form='changes' name='class'>
                                    <option value='' selected>Select...</option>";
            for($x = 1; $x <= 8; $x++){echo "<option value='" . $x . "' id='" . $x . "'>" . $x . "</option>";};

            echo "</select></span>";


            echo "</span>";


            /**************************************/
            /********* Subject Dropdown  **********/
            /**************************************/
            echo "<span id='subject-changes' >
                      <span class='drop-menu'>Subject:<select id='subject-chng-menu' class='chapter-changes black-border' name='subj' form='changes'>
                        <option value='' selected>Select...</option>";

            $classInfo = array(
                array("all", "EN", "N", "M", "S", "SS", "H", "V"),
                array("All", "English", "Nepali", "Math", "Science", "Social Studies", ),"Health", "Vocation"
            );
            for($x = 1; $x < count($classInfo[0]); $x++) {
                echo "<option name='subj' value='" . $classInfo[0][$x] . "'>" . $classInfo[1][$x] . "</option>";};

            echo "</select></span>";
            echo "</span>";


            /**************************************/
            /********* Chapter Dropdown  **********/
            /**************************************/
            echo "<span id='chapter-changes' >
                        <span class='drop-menu'>Chapter:<select id='chapter-chng-menu' class='chapter-changes black-border' name='chapter' form='changes'>
                                <option value='' selected>Select...</option>
                      </select></span>";
            echo "</span>";

            echo "<button class='chng-clear' id='textbook-clear'>X</button>";
            echo "</div>";

            echo "</form>";
            ?>

            <button id="check-all"      class="edit-control">Check All</button>
            <button id="uncheck-all"    class="edit-control">Uncheck All</button>
            <button id="submit-changes" class="edit-control">Submit</button>

<!--
            <form id="upload" enctype="multipart/form-data">

                <input type="hidden" name="MAX_FILE_SIZE" value="524288">
                <input type="hidden" name="cmd" value="upload-file">

                <span><strong>File:</strong> <input type="file" name="upload" form="upload"></span>
                <span><strong>Thumbnail:</strong> <input type="file" name="upload-thumb" form="upload"></span>

                <div align="center"><input type="submit" name="submit" value="Submit"></div>
  -->
            </form>

        <div id="hints">
                <br>
                <p class="hint"></p>
            </div>
        </div>

        <div id="details" class="popup"></div>
    </div>

    <img id="padlock"
         draggable="false"
         src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >

    <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>


    <?php   include('includes/looma-control-buttons.php');?>
    <button class='control-button' id='dismiss' ></button>

</section>

<?php include ('includes/js-includes.php'); ?>

<script src="js/jquery-ui.min.js"></script>
<script src="js/jquery.hotkeys.js"></script>
<script src="js/tether.min.js"></script>
<script src="js/bootstrap.min.js"></script>

<script src="js/looma-search.js"></script>
<script src="js/looma-edit-activities.js"></script>
<!--    <script src="js/looma-lesson-plan.js"></script> -->

