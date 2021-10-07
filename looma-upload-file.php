<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}
function loginLevel() { return $_COOKIE['login-level'];}
// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin && loginLevel() !== 'exec' && loginLevel() !== 'admin') header('Location: looma-login.php');
error_log("Starting Content Import session. logged in as: " . $loggedin . " at login level: " . loginLevel());
?>

<!doctype html>
<!--
Filename: looma-upload-file.php
Description: admin tool for adding content files to Looma

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 3.0
 -->

<?php   $page_title = 'Looma Import Content';
require_once ('includes/header.php');

?>

<link rel = "Stylesheet" type = "text/css" href = "css/looma-upload-file.css">

</head>

<body>

    <div id="main-container">

        <div id="header" class="inner-div">
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>Looma Import Content</span>
        </div>

        <div id="search-bar" class="inner-div">
            <p class="hint">This tool is used to import media files into Looma</p>
            <p class="hint">&nbsp;&nbsp;&nbsp;1. Enter filename and thumbnail filename to upload</p>
            <p class="hint">&nbsp;&nbsp;&nbsp;2. Enter display name, keywords, etc for the file in right hand panel</p>
            <p class="hint">&nbsp;&nbsp;&nbsp;3. Click "Submit" to import and register the new media file</p>
        </div>

        <div id="outerResultsDiv"></div>

        <div id="previewpanel" class="inner-div">
            <form id='changes' name='changes' enctype="multipart/form-data">

                <div class="upload">
                    <label>Click to Select New File :
                        <span id="filename"></span>
                        <input type="file" name="upload"       id="upload"       form="changes">
                    </label>
                    <br><br><br>
                    <label>Click to Select Thumbnail:
                        <span id="thumbname"></span>
                        <input type="file" name="upload-thumb" id="upload-thumb" form="changes">
                    </label>
                </div>

                <input type='hidden' name='collection'    value='activities' />
                <input type="hidden" name="MAX_FILE_SIZE" value="8388608">
                <input type="hidden" name="cmd"           value="uploadFile">
                <input type="hidden" name="ft"            value="" id="ft-changes">

                <div><label class="text-label">New display name: </label><input id='dn-changes' name='dn' type='text'></input>
                    <button class='chng-clear' id='dn-clear'>X</button>
                </div>

                <div><label class="text-label">Folder: </label><input id='fp-changes' name='fp' type='text'></input>
                    <button class='chng-clear' id='fp-clear'>X</button>
                </div>

                <?php

                /*****************************************/
                /*********** Keyword Dropdowns  **********/
                /*****************************************/
                echo "<div id='keyword-changes' class='keyword-filter   '>";


                // get the ROOT document of the TAGs collection
                $query = array('name' => 'root', 'level' => 0);
                $root = mongoFindOne($tags_collection, $query);


                echo "<span id='keyword-changes-menu'>Keywords:
                            <select name='key1' id='key1-menu' class='    keyword-changes keyword-dropdown black-border' data-level=1 form='changes'>
                                <option value=''>Select keyword...</option>";

                for($x = 0; $x < sizeof($root['children']); $x++) {
                    $y = $root['children'][$x]['name'];
                    $z = $root['children'][$x]['kids'];
                    echo "<option value='" . $y . "' id='" . $y . "' data-kids='" . $z. "'>" . $y . "</option>";
                }
                echo "</select>";

                echo "<select name='key2' disabled id='key2-menu' class='   keyword-changes keyword-dropdown black-border' data-level=2 form='changes'>
                                <option value='' selected></option>";
                echo "</select>";

                echo "<select name='key3' disabled id='key3-menu' class='    keyword-changes keyword-dropdown black-border' data-level=3 form='changes'>
                                            <option value='' selected></option>";
                echo "</select>";

                echo "<select name='key4' disabled id='key4-menu' class='    keyword-changes keyword-dropdown black-border' data-level=4 form='changes'>
                                            <option value='' selected></option>";
                echo "</select>";

                echo "</span>";
                echo "<button class='chng-clear' id='keyword-clear'>X</button>";

                echo "</div>";



                /**************************************/
                /********* File Source  Fields ********/
                /**************************************/
                echo "<div id='source-div' class='chkbox-filter media-filter'>";
                echo keyword("Source:");
                $sources = array(
                    array("ck12",    "phet", "TED"), // not used
                    array("Dr Dann", "PhET", "TED"), //internal names for IDs  #xxx-chk and #xxx-checkbox
                    array("CK-12",   "PhET", "TED") //the displayed name for source values
                );

                for($x = 0; $x < count($sources[1]); $x++) {
                    /*           echo "<span class='src-chk' data-id='" . $sources[0][$x] ."-chk'>
                                         <input data-id='" . $sources[1][$x] ."' class='media-input flt-chkbx' type='checkbox' name='src[]'' value='" . $sources[1][$x] . "'>
                                         <label class='filter-label' for='" . $sources[0][$x] . "'>" . $sources[2][$x] . "</label>
                                       </span>";}
                 */

                    echo "<span  class='src-chk' data-id='" .  $sources[1][$x] . "-chk'>";
                    echo "<label class='filter-label' for='" . $sources[1][$x] . "-checkbox'>";
                    echo "<input id='"  .$sources[1][$x] . "-checkbox' class='media-input flt-chkbx media-filter' type='radio' name='src[]' value='" . $sources[1][$x] . "'>";
                    echo keyword($sources[2][$x]);
                    echo "</label></span>";
                }
                echo "<button class='chng-clear' id='source-clear'>X</button>";

                echo "</div>";

                /**************************************/
                /*********** Grade Limits  **********/
                /**************************************/
                echo "<div id='grade-limits'>";
                    echo "<label>Low grade</label><input type='number' min='1' max='10'  value='1' id='cl_lo' class='class-limit'></input>";
                    echo "<label>High grade</label><input type='number' min='1' max='10 'value='10'  id='cl_hi' class='class-limit'></input>";
                echo "</div>";

                /**************************************/
                /*********** Grade Dropdown  **********/
                /**************************************/
                echo "<div id='textbook-changes'>";
                echo "<span id='grade-changes' >
                                <span class='drop-menu'><label>Grade:</label><select id='grade-drop-menu' class='chapter-changes black-border'  form='changes' name='class'>
                                    <option value='' selected>Select...</option>";
                for($x = 1; $x <= 8; $x++){echo "<option value='" . $x . "' id='" . $x . "'>" . $x . "</option>";}

                echo "</select></span>";
                echo "</span>";


                /**************************************/
                /********* Subject Dropdown  **********/
                /**************************************/
                echo "<br><span id='subject-changes' >
                      <span class='drop-menu'><label>Subject:</label><select id='subject-drop-menu' class='chapter-changes black-border' name='subj' form='changes'>
                        <option value='' selected>Select...</option>";

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
                echo "<br><span id='chapter-changes' >
                        <span class='drop-menu'><label>Chapter:</label><select id='chapter-drop-menu' class='chapter-changes black-border' name='chapter' form='changes'>
                                <option value='' selected>Select...</option>
                      </select></span>";
                echo "</span>";

                echo "<button class='chng-clear' id='textbook-clear'>X</button>";
                echo "</div>";
                ?>

                <br> <button id="submit-changes" class="edit-control" form='changes'>Submit</button>
                     <button id='clear-changes'  class="edit-control" form='changes'>Clear</button>
            </form>
        </div>

        <div id="details">
            <div id="details-contents"></div>
            <button id="user-submit">Submit</button>
            <button id="user-cancel">Cancel</button>
        </div>
    </div>

    <img id="padlock"
         draggable="false"
         src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >

    <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>

    <?php   include('includes/looma-control-buttons.php');?>
    <button class='control-button' id='dismiss' ></button>

<?php include ('includes/js-includes.php'); ?>

<script src="js/jquery-ui.min.js"></script>
<script src="js/jquery.hotkeys.js"></script>
<script src="js/tether.min.js"></script>
<script src="js/bootstrap.min.js"></script>

    <script src="js/looma-search.js"></script>
    <script src="js/looma-upload-file.js"></script>

</body>
