<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Activity Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Filename: looma-chapterIDs.php
Description: template for Looma editor tools, like Lesson Plan Editor, Slideshow Editor, etc

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Dec 2020
Revision: Looma 3.0
 -->

<?php   $page_title = 'Looma Chapter IDsr';
include ('includes/header.php');
?>

<link rel = "Stylesheet" type = "text/css" href = "css/looma-edit-activities.css">

</head>

<body>
   <div id="main-container">
        <div id="formpanel" >
            <div id='changes' name='changes'>
                <input type='hidden'                         value='chapters'   name='collection'/>
                <h3>Find a Looma chapter ID:</h3>
                <?php
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

                echo "<div id='grade-changes' >
                <label class='drop-menu'>Grade:</label>
                    <select id='grade-chng-menu' class='book-changes black-border'  form='changes' name='class'>
                       <option value='' selected>Select...</option>";
                for($x = 1; $x <= 10; $x++){echo "<option value='" . $x . "' id='" . $x . "'>" . $x . "</option>";}
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
                echo "</div>";
                echo "</div><br>";
                ?>
                <h3>Verify a Looma chapter ID:</h3>
                <label>Enter a chapter ID: </label>
                <input type="text" id="ch_id">
                <p id="legal"></p>
                <?php    echo "</div>";

            echo "</div>";
            ?>
        </div>
    </div>

<?php include ('includes/js-includes.php'); ?>

<script src="js/jquery-ui.min.js"></script>
<script src="js/jquery.hotkeys.js"></script>
<script src="js/tether.min.js"></script>
<script src="js/bootstrap.min.js"></script>
   <script src="js/looma-chapterIDs.js"></script>
   <script src="js/looma-search.js"></script>

