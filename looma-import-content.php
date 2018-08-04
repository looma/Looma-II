<!doctype html>
<!--
Name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 04
Revision: Looma 2.0.0
File: looma-import-content.php
Description:  navigate content folders and import media files into activities collection in the database
              derived from looma-library.php

      NOTES (2018 03)
        - navigates in folders in ../content/
        - allows selecting individual files
        - allows setting DN and SRC for those files
        - backend registers the files in ACTIVITIES collection in Mongo

      CHANGES TO MAKE
        - SORT the DIRs and FILEs before displaying
        - dont show 'hidden.txt'

-->

<html lang="en" class="no-js">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="author"  content="Skip">
    <meta name="project" content="Looma">
    <meta name="owner"   content="villagetechsolutions.org">
    <link rel="icon"     type="image/png" href="images/favicon-32x32.png">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"> <!-- uses latest IE rendering engine-->
    <!--[if lt IE 9]> <script src="js/html5shiv.min.js"></script>  <![endif]-->

    <?php   $page_title = 'Looma Import Content';?>
    <title> <?php print $page_title; ?> </title>

 <?php       require ('includes/mongo-connect.php');
        require('includes/looma-utilities.php');

        //returns login ID if user is logged in, else returns NULL
        function loggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};

        if (!loggedin()) header('Location: looma-login.php');

/////////////////////////
//////  main code  //////

    if (!loggedin()) header('Location: looma-login.php');

    $path = "../content";
    $parent  = "../content";

    if ( isset($_REQUEST["fp"]) ) {
        $path = $_REQUEST["fp"];
        if (strrpos($path,'/') > -1) {
            $parent = substr($parent, 0, strrpos($path,'/'));
            if ($parent == '..') $parent = '../content';
        }
        else $parent = '../content';
    }

?>

<html>

        <link rel="stylesheet" href="css/font-awesome.min.css">
        <link rel="stylesheet" type="text/css" href="css/looma.css">
        <link rel="stylesheet" type="text/css" href="css/looma-theme-looma.css">
        <link rel="stylesheet" type="text/css" href="css/looma-import-content.css">

    </head>

    <body>
        <div id = "main-container">

            <div id="header">
                <img id="logo" src="images/LoomaLogo.png">
                <span class="title">Import Content</span>
                <span class='foldername' id='dirname'><?php echo $path ?></span>
                <span id="showfolders">Change Folder<select id="folders"><option>......</option></select></span>
            </div>

<!--  *******************  -->

            <div id= "previewpanel">
                <div id="filelist"></div>
                <div id="hints">
                    <p class="hint">This program registers files in the Looma Content folders as Looma Activities </p>
                    <p class="hint">1. Navigate to a folder </p>
                    <p class="hint">2. Check the files to be registered</p>
                    <p class="hint">3. (optional) Enter 'source' in the bottom panel</p>
                    <p class="hint">4. Click "Import" to import the files</p>
                    <p class="hint">5. Click "Change folder" to move to another folder</p>
                </div>
            </div>

            <div id = "timeline">
                Folder: <span class='foldername' id="fn"></span>

                <span class="right">
                    <button id="check" class="control">Check all</button>
                    <button id="uncheck" class="control">Uncheck all</button>
                </span>
<br>
                <br><span>Check files to be registered, edit their Display Names, then click "Register"</span>

                <span class="right">
                    <button id="register"   class="control">  Register    </button>
                    <button id="cancel" class="control">  Cancel   </button>
                </span>

                <br> (Optional) select source of these files: <select name='source' id="source">
                    <option value='' selected></option>
                    <option value='khan'>Khan</option>
                    <option value='w4s'>Wikipedia for Schools</option>
                    <option value='ted'>TED</option>
                    <option value='PhET'>PhET</option>
                    <option value='flickr'>Flickr</option>
                    <option value='nasa'>NASA</option>
                    <option value='unsplash'>UnSplash</option>
                    <option value='google images'>Google Images</option>
                    <option value='Dr Dann'>Dr Dann</option>
                </select>
            </div>

            </div>

        <?php include ('includes/js-includes.php'); ?>
        <script src="js/jquery-ui.min.js">  </script>
        <script src="js/jquery.hotkeys.js"> </script>


       <script src="js/looma-import-content.js"></script>

    </body>
</html>


