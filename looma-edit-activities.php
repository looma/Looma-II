<?php
//function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}
require_once('includes/looma-isloggedin.php');

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = loggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Activity Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Filename: looma-editor-template.php
Description: template for Looma editor tools, like Lesson Plan Editor, Slideshow Editor, etc

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 3.0
 -->

<?php   $page_title = 'Looma Resource Editor';
include ('includes/header.php');
?>

<link rel = "Stylesheet" type = "text/css" href = "css/looma-edit-activities.css">

</head>

<body>

<section>
    <div id="main-container">

        <div id="header" class="inner-div">
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>Looma Resource Editor</span>
        </div>

        <div id="search-bar" class="inner-div">

            <?php require_once ('includes/looma-search.php');?>

        </div>

        <div id="outerResultsDiv">
            <div id="innerResultsMenu">
                <p class="hint">This tool is used to edit Looma Resources</p>
                <p class="hint">1. Use the search bar at the top to select Resources</p>
                <p class="hint">2. Check the checkbox of the Resource or Resources you want to modify</p>
                <p class="hint">3. Mouse over INFO button to see details of a Resource</p>
                <p class="hint">4. Modify Display Name at the right to change the name</p>
                <p class="hint">5. Use the entries at the right to set properties</p>
                <p class="hint">6. Click "Submit" to make the changes</p>
            </div>
            <div id="results-div"></div>
            <div id="innerResultsDiv">
            </div>
        </div>
        <div id="formpanel" >
            <form id='changes' name='changes'>
                <input type='hidden'                         value='activities'   name='collection'/>
                <input type='hidden' id='changes-cmd'        value='editActivity' name='cmd'/>
                <input type='hidden' id='changes-db'                              name='db'/>
                <input type='hidden' id='editor'             value=''             name='editor'/>
                <input type='hidden' id='date'               value=''             name='date'/>

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

                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>
                <input type='hidden' class='changes-db' value=''           name='db[]'/>

                <div>New display name: <input id='dn-changes' class='media-filter' name='dn' type='text'>
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
            }
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
            echo "<div id='source-changes' class='chkbox-filter media-filter'>Source:";

            $sources = array(
                array("ck12",    "phet", "epth",   "khan", "w4s",       "TED"),
                array("Dr Dann", "PhET", "ePaath", "khan", "wikipedia", "TED"),
                array("CK-12",   "PhET", "ePaath", "Khan", "Wikipedia", "TED")
            );

            for($x = 0; $x < count($sources[0]); $x++){
                echo "<span class='src-chng' data-id='" . $sources[0][$x] ."-chng'>
                                    <input data-id='" . $sources[1][$x] ."' class='media-input flt-chkbx source-changes' type='radio' form='changes' name='src' value='" . $sources[1][$x] . "'>
                                    <label class='filter-label' for='" . $sources[0][$x] . "'>" . $sources[2][$x] . "</label>
                                  </span>";}
        echo "<button class='chng-clear' id='source-clear'>X</button>";
            echo "</div>";

        /**** chapter low and high  Fields *****/
        /**************************************/
        /**************************************/

        echo "<div id='gradelevels'>";
            echo "Lowest Grade:       <input type='number' class='grade-filter' id='cl_lo' name='cl_lo' min='1' max='12' value='1'>";
            echo "    Highest Grade:  <input type='number' class='grade-filter' id='cl_hi' name='cl_hi' min='1' max='12' value='12'>";
            echo "<button class='chng-clear' id='grades-clear'>X</button>";
        echo "</div>";

        /********* Book type selector ********/
        /**************************************/
        echo "<div id='book-type'>
            <span>Attach to:  </span>";

        echo "<span class='chapter-type'>" .
            "<input class='media-input flt-chkbx source-changes' type='radio'  form='changes' name='src' value='textbooks' checked>" .
            "<label class='filter-label' for=''>  Textbooks </label>" .
            "</span>";

        echo "<span class='chapter-type'>" .
            "<input class='media-input flt-chkbx source-changes' type='radio' form='changes' name='src' value='other'>" .
            "<label class='filter-label' for=''>  Other books </label>" .
            "</span>";
        echo "<button class='chng-clear' id='textbook-clear'>X</button>";
        //echo "<button class='chng-clear' id='otherbook-clear'>X<button>";
        echo "</div>";


        /*******************************************************/
        /****** TEXT BOOKS  ************************************/
        /*******************************************************/

        echo "<p>
          <label class='drop-menu'>Language:  </label>
          <input type = 'radio'
                 form = 'changes'
                 name = 'lang'
                 value = 'en'
                 checked  />
          <label for = 'en'>English</label>
          <input type = 'radio'
                 form = 'changes'
                 name = 'lang'
                 value = 'np' />
          <label for = 'np'>Nepali</label>
                 </p>";

        echo "<div id='textbooks'>";
            /**************************************/
            /*********** TEXTBOOKS Grade Dropdown  **********/
            /**************************************/
            //echo "<div id='textbook-changes'>";


        echo "<div id='grade-changes' >
                <label class='drop-menu'>Grade:</label>
                    <select id='grade-chng-menu' class='book-changes black-border'  form='changes' name='class'>
                       <option value='' selected>Select...</option>";
                       for($x = 1; $x <= 12; $x++){echo "<option value='" . $x . "' id='" . $x . "'>" . $x . "</option>";}
        echo "</select>";
                //echo "</span>";
            echo "</div><br>";


            /**************************************/
            /********* TEXTBOOKS Subject Dropdown  **********/
            /**************************************/
            echo "<div id='subject-changes' >
                <label class='drop-menu'>Subject:</label>
                    <select id='subject-chng-menu' class='book-changes black-border' name='subj' form='changes'>
                        <option value='' selected>Select...</option>";

                        $classInfo = array(
                            array("all","EN",     "N",     "M",   "Ma", "S", "Sa",     "SS",  "SSa",          "H",      "V"),
                            array("All","English","Nepali","Math","Math Optional", "Science","Science Optional","Social Studies","Social Studies Optional","Health", "Vocation")
                        );
                        for($x = 1; $x < count($classInfo[0]); $x++) {
                            echo "<option name='subj' value='" . $classInfo[0][$x] . "'>" . $classInfo[1][$x] . "</option>";}
        echo "</select>";
               // echo "</span>";
            echo "</div><br>";


            /**************************************/
            /********* TEXTBOOKS Chapter Dropdown  **********/
            /**************************************/
            echo "<div id='chapter-changes' >
                <label class='drop-menu'>Chapter:</label>
                    <select id='chapter-chng-menu' class='book-changes black-border' name='chapter' form='changes'>
                        <option value='' selected>Select...</option>
                    </select>";
                //</label>";
            echo "</div>";

            //echo "</div>";
        echo "</div>";
        //echo "<button class='chng-clear' id='textbook-clear'>X</button>";

    /*******************************************************/
    /****** OTHER BOOK TYPES (e.g. Hesperian) **************/
    /*******************************************************/

        echo "<div id='otherbooks'>";
            /**************************************/
            /*********** OTHER BOOK source Dropdown  **********/
            /**************************************/
            //echo "<div id='otherbook-src'>";


        echo "<div id='otherbook-src' >
                <label for='src-chng-menu' class='drop-menu'>Book source: </label>
                    <select id='src-chng-menu' class='book-changes black-border'  form='changes' name='book-source'>
                        <option value='' selected>Select...</option>";

        echo "<option value='" . "hesp" . "' id='" . "hesperian" . "'>" . "Hesperian" . "</option>";
        echo "<option value='" . "8S-india" . "' id='" . "8S-india" . "'>" . "India 8S" . "</option>";

                    echo "</select>";
               // echo" </span>";
            echo "</div><br>";

            /**************************************/
            /********* OTHER BOOK Book Dropdown  **********/
            /**************************************/
            echo "<div id='otherbook-book' >
                <label for='book-chng-menu' class='drop-menu'>Title:</label>
                    <select id='book-chng-menu' class='book-changes black-border' name='book-name' form='changes'>
                        <option value='' selected>Select...</option>";

            /*
                        $bookInfo = array(
                            array('hesp-midw','hesp-cgeh','hesp-wwd','hesp-dvc',
                                  'hesp-haw','hesp-hcwb','hesp-hcwd','hesp-hhwl',
                                  'hesp-nwtnd','hesp-dent','hesp-wtnd','hesp-wwhnd'),
                            array("A Book for Midwives",
                                "Environmental Health",
                                "Women with Disabilities",
                                "Disabled village children",
                                "Health Actions for Women",
                                "Helping Children Who Are Blind",
                                "Helping Children Who Are Deaf",
                                "Helping Health Workers Learn",
                                "New Where There Is No Doctor",
                                "Where There Is No Dentist",
                                "Where There Is No Doctor",
                                "Where Women Have No Doctor"));
                        for($x = 1; $x < count($bookInfo[0]); $x++) {
                            echo "<option name='subj' value='" . $bookInfo[0][$x] . "'>" . $bookInfo[1][$x] . "</option>";};
            */
                echo "</select>";
                //echo "</span>";
            echo "</div><br>";


            /**************************************/
            /********* OTHER BOOK Chapter Dropdown  **********/
            /**************************************/
            echo "<div id='otherbook-chapter' >
                <label for='book-chapter-menu' class='drop-menu'>Chapter:</label>
                    <select id='book-chapter-menu' class='book-changes black-border' name='book-chapter' form='changes'>
                        <option value='' selected>Select...</option>
                    </select>";
               //echo "</span>";
            echo "</div>";

            //echo "</div>";
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

        <div id="details"></div>
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

