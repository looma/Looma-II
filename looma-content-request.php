
<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Activity Edit session. logged in as: " . $loggedin);
?>

<!--
Filename: looma-content-request.php
Programmer : Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: May 2020
-->
<!doctype html>

<?php   $page_title = 'Looma Content Request Form';
require_once ('includes/header.php');
require_once ('includes/mongo-connect.php');

function info($msg,$id, $type) {  // creates an information popup
    echo "<img id='" . $id . "' class='q' src='images/question.jpeg'/>";
    echo "<div id='info-" . $id . "' class='info-text " . $type . "'>";
    echo "<p>  &nbsp; $msg</p>";
    echo "</div>";
} // end info()
?>

<link rel = "Stylesheet" type = "text/css" href = "css/looma-search.css">
<link rel = "Stylesheet" type = "text/css" href = "css/looma-content-request.css">

</head>

<body>
    <div id="main-container">
        <div id="header" class="inner-div">
            <img src="images/logos/LoomaLogoTransparent.png"  height="100%"/>
            <span>New Content Settings</span>
        </div>

        <!-- DIV for SETTINGS input -->
        <div id="settingsDiv">
            <form id='settingsForm' name='settings'>
                Display name:
                <?php info("Enter a display name for this item","q-dn", "settings"); ?>
                <input id='dn-setting' class='settings-filter black-border' name='dn' type='text'></input>

                Nepali display name:
                <?php info("[Optional] Enter a Nepali display name for this item","q-ndn", "settings"); ?>
                <input id='ndn-setting' class='settings-filter black-border' name='ndn' type='text'></input>
                <br>

            <!--/*****************************************/
            /*********** Keyword Dropdowns  **********/
            /*****************************************/ -->
            <div id='keyword-setting' class='keyword-filter settings-filter'>
            <span id='keyword-setting-menu'>Keywords:-set
                <?php info("[Optional] Select keywords for this item", "q-key-set", "settings"); ?>
                <select name='key1' id='key1-setting-menu' class='settings-filter  keyword-setting keyword-dropdown black-border' data-level=1 form='changes'>
                            <option value=''>Select keyword...</option>
  <?php
            // get the ROOT document of the TAGs collection
                    $query = array('name' => 'root', 'level' => 0);
                    $root = $tags_collection -> findOne($query);
                    for($x = 0; $x < sizeof($root['children']); $x++) {
                        $y = $root['children'][$x]['name'];
                        $z = $root['children'][$x]['kids'];
                        echo "<option value='" . $y . "' id='" . $y . "' data-kids='" . $z. "'>" . $y . "</option>";
                    }
  ?>
                </select>

                <select name='key2' disabled id='key2-setting-menu' class='settings-filter keyword-setting keyword-dropdown black-border' data-level=2 form='changes'>
                                <option value='' selected></option>
                </select>

                <select name='key3' disabled id='key3-setting-menu' class='settings-filter  keyword-setting keyword-dropdown black-border' data-level=3 form='changes'>
                                            <option value='' selected></option>
                </select>

                <select name='key4' disabled id='key4-setting-menu' class='settings-filter  keyword-setting keyword-dropdown black-border' data-level=4 form='changes'>
                                            <option value='' selected></option>
                </select>
            </span>
            </div>

            <br>

            Filename:
            <?php info("Paste in the exact file name of this item","q-fn", "settings"); ?>
            <input id="fn-setting" class="black-border"></input>

            URL:
            <?php info("Paste in the URL where this item can be found","q-url", "settings"); ?>
            <input id="url-setting" class="black-border"></input>

            Lowest grade:
            <?php info("[Optional] Select the lowest grade appropriate for this item","q-lo", "settings"); ?>
            <select id="lo-setting" class="black-border">
                <option value=null>none</option>
                <option value=1>1</option><option value=2>2</option><option value=3>3</option>
                <option value=4>4</option><option value=5>5</option><option value=6>6</option>
                <option value=7>7</option><option value=8>8</option><option value=9>9</option>
                <option value=10>10</option>
            </select>

            Highest grade:
            <?php info("[Optional] Select the highest grade appropriate for this item","q-hi", "settings"); ?>
            <select id="hi-setting" class="black-border">
                <option value=null>none</option>
                <option value=1>1</option><option value=2>2</option><option value=3>3</option>
                <option value=4>4</option><option value=5>5</option><option value=6>6</option>
                <option value=7>7</option><option value=8>8</option><option value=9>9</option>
                <option value=10>10</option>
            </select>

            <button id="settings-submit">Submit</button>
            <button id="settings-clear">Clear</button>

            <br/>

            List of English chapters:
            <?php info("[Optional] Enter chapter IDs this item should be associated with","q-ch_ids", "settings"); ?>
            <input id="ch_id-setting" class="black-border">
            </input>

            List of Nepali chapters:
            <?php info("[Optional] Enter Nepal language chapter IDs this item should be associated with","q-nch_ids", "settings"); ?>
            <input id="nch_id-setting" class="black-border">
            </input>


        </form>
    </div>


    <!-- ********************************************************************* -->
    <!-- ********************************************************************* -->
    <!-- **************** CHAPTER SEARCH SECTION ***************************** -->

        <!-- CHAPTER SEARCH DIV-->
        <div id="chapter-search-bar" class="inner-div">
            <div id='search-panel'>
                <form id='search' name='search'>
                    <input type='hidden' id='collection' value='chapters' name='collection'/>
                    <input type='hidden' id='cmd' value='search' name='cmd'/>
                    <input type='hidden' id='includeLesson' value=false name='includeLesson'/>
                    <input type='hidden' id='pageno' value='1' name='pageno'/>
                    <input type='hidden' id='pagesz' value='500' name='pagesz'/>

            <!--    /**************************************/
                    /************* Search Bar *************/
                    /**************************************/  -->
                    <div id='search-bar-div' class='media-filter'>
                        Chapter title:
                        <?php info("[Optional] Chapter title (or substring) to search for","q-ch", "search"); ?>
                        <input id='search-term' type='text' autofocus class='black-border'
                               name='search-term' placeholder='Enter Chapter Title...'></input>

                        <button id='media-submit' class = 'filesearch' name='search' value='media' type='submit'></button>
                        <button class='clear-search' type='button'><?php keyword("Clear")?></button>
                    </div>

                    <?php

                    /*****************************************/
                    /*********** Keyword Dropdowns  **********/
                    /*****************************************/
                        echo "<div id='keyword-div' class='keyword-filter media-filter'>";

                        // get the ROOT document of the TAGs collection
                        $query = array('name' => 'root', 'level' => 0);
                        $root = $tags_collection -> findOne($query);

                        echo "<span id='keyword-drop-menu'>";
                        echo  keyword("Keywords:");
                        info("[Optional] Select keywords to search for chapters", "q-key", "search");
                        echo "<select name='key1' id='key1-menu' class='media-filter  keyword-filter keyword-dropdown black-border' data-level=1 form='search'>
                        <option value=''>Select...</option>";

                        for($x = 0; $x < sizeof($root['children']); $x++) {
                            $y = $root['children'][$x]['name'];
                            $z = $root['children'][$x]['kids'];
                            echo "<option value='" . $y . "' data-id='" . $y . "' data-kids='" . $z. "'>";
                            echo $y;  //    keyword($y);
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
                    ?>

                    <!-- /**************************************/
                    /*********** Chapter Search Section  **/
                    /**************************************/ -->
                        <div id='chapter-search'>
                    <!-- /**************************************/
                    /*********** Language Dropdown  **********/
                    /**************************************/ -->
                    <span id='lang-div' class='chapter-filter'>
                    <span class='drop-menu'>Language:
                        <?php info("[Optional] Select chapter language","q-lang", "search"); ?>
                        <select id='lang-drop-menu' class='chapter-input black-border' name='lang' form='search'>
                            <option value='en' selected>English</option>
                            <option value='np' >Nepali</option>
                        </select></span>
                    </span>
                    </span>

                     <!-- /**************************************/
                    /********* Grade Dropdown  **********/
                    /**************************************/ -->
                    <span id='grade-div' class='chapter-filter'>
                            <span class='drop-menu'>Grade:
                    <?php info("[Optional] Select chapter grade","q-grade", "search"); ?>
                        <select id='grade-drop-menu' class='chapter-input black-border' name='class' form='search'>
                            <option value='' selected>(any)...</option>
                            <?php    for($x = 1; $x <= 10; $x++){echo "<option value='" . $x . "' data-id='" . $x . "'>" . $x . "</option>";}
                            ?>
                        </select></span>
                        </span>
                    </span>


                    <!-- /**************************************/
                    /********* Subject Dropdown  **********/
                    /**************************************/ -->
                        <span id='subject-div' class='chapter-filter'><span class='drop-menu'>
                      Subject:
                         <?php info("[Optional] Select chapter subject", "q-subj", "search"); ?>
                        <select id='subject-drop-menu' class='chapter-input black-border' name='subj' form='search'>
                        <option value='' selected>(any)...</option>
                        <?php
                            $classInfo = array(
                                array("all", "EN", "N", "M", "S", "SS", "H", "V"),
                                array("all", "english", "nepali", "math", "science", "social studies", "health", "vocation"),
                                array("All", "English", "Nepali", "Math", "Science", "Social Studies", "Health", "Vocation")
                            );
                            for($x = 1; $x < count($classInfo[0]); $x++) {
                                echo "<option name='subj' value='" . $classInfo[1][$x] . "'>" . $classInfo[2][$x] . "</option>";}
                        ?>
                        </select></span>
                        </span>


                    <!-- /**************************************/
                    /********* Chapter Dropdown  **********/
                    /**************************************/ -->
                      <span id='chapter-div' class='chapter-filter'><span class='drop-menu'>
                      <span class='drop-menu'>Chapter:<select id='chapter-drop-menu' class='chapter-input black-border' name='chapter' form='search'>
                        <option value='' selected>(any)...</option>
                        </select></span>
                        </span>

                </div>
            </form></div>
        </div>

        <div id="innerResultsDiv">
            <span class="hint">Search Results</span>
        </div>
        <div id="preview">
            <span class="hint">Chapter Preview</span>
        </div>
        <div id="hints"><br><p class="hint"></p></div>
        <div id="details"></div>

    <img id="padlock"
         draggable="false"
         src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >

    <p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>

    <?php   include('includes/looma-control-buttons.php');?>
    <button class='control-button' id='dismiss' ></button>

    <?php include ('includes/js-includes.php');
                //include ('includes/looma-filecommands.php');
    ?>

    <script src="js/jquery-ui.min.js"></script>
    <script src="js/jquery.hotkeys.js"></script>
    <script src="js/tether.min.js"></script>
    <script src="js/bootstrap.min.js"></script>

    <script src="js/looma-search.js"></script>
    <script src="js/looma-content-request.js"></script>

</body>
</html>

