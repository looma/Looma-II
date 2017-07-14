<!doctype html>
<!--
Name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 04
Revision: Looma 2.0.0
File: looma-import-content.php
Description:  navigate content folders and import media files into activities collection in the database
              derived from looma-library.php
-->

<?php   $page_title = 'Looma Import';
        require ('includes/header.php');
        require ('includes/mongo-connect.php');

        if (!loggedin()) header('Location: looma-login.php');

                function folderName ($path) {
                    // strip trailing '/' then get the last dir name, by finding the remaining last '/' and substr'ing
                     $a = explode("/", $path);
                     return $a[count($a) - 2];
                };  //end FOLDERNAME()

                function isEpaath($fp) {
                    //echo "<br>DEBUG: in isEpaath, FP is " . $fp . " Substr is " . mb_substr($fp, -7, 7);

                    if (mb_substr($fp, -7, 7) == "epaath/")
                         return true;
                    else return false;
                }; //end function isEpaath

                function isHTML($fp) {

                    //echo "DEBUG: in isHTML - fp = " . $fp . " and fileexists = " . (file_exists($fp . "/index.html")?"true":"false"). "<br>";

                    if (file_exists($fp . "/index.html") && !isEpaath($fp))
                         return true;
                    else return false;
                };  //end function isHTML

                function thumb_image ($fp) {  //for directories, look for filename "thumbnail.png" for a thumbnail representing the contents
                    if (file_exists($fp . "/thumbnail.png")) {
                         return "<img src='$fp/thumbnail.png' >"; }
                    else return "";
                }; //end function thumbnail

/////////////////////////
//////  main code  //////

    if (!loggedin()) header('Location: looma-login.php');

    $content = "../content";
    if ( isset($_REQUEST["fp"]) ) $path = $_REQUEST["fp"]; else $path = $content;

?>

<html>

        <link rel="stylesheet" href="css/font-awesome.min.css">
        <link rel="stylesheet" href="css/looma-filecommands.css">
        <link rel="stylesheet" type="text/css" href="css/looma-import-content.css">

    </head>

    <body>
        <div id = "main-container-horizontal">
            <div id="headerDiv">

                <div id="navbar">
                    <img id="logo" src="images/LoomaLogo.png">
                    <span>Import Content</span>
                    <div id="titleDiv"> Current folder: <span class='foldername' id='dirname'><?php echo $path ?></span></div>
                </div>

                <div id="querybar">
                    <form id="search" name="search">
                        <input type="hidden" value="activities" name="collection" />
                        <input type="hidden" id="cmd" value="search" name="cmd" />
                    </form>
                    <!--  *******************

                    <div id="subfolders">
                        <button id="showfolders">Change folder</button><br>
                        <div id="folderlist">

                        </div>
                    </div>
                      *******************  -->

                 </div>
           </div>
<!--  *******************  -->


    <div id="commands">
        <div class="btn-group">
          <button type="button" id="showfolders" class="btn btn-info" data-toggle="dropdown" aria-expanded="false">Change folder</button>
          <div id="folderlist" class="dropdown-menu">
                <!-- links to parent folder and sub-folders inserted here by JS -->
          </div>
        </div>
      </div>
<!--  *******************  -->

            <div id="container">

                <div id= "previewpanel">
                    <div id="filelist"></div>
                    <span class="hint">Preview</span>
                </div></div>

                <div id = "timeline">
                    Folder: <span class='foldername' id="fn"></span>

                    <br><button id="check">Check all</button>

                    Select source of these files: <select name='source' id="source">
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

                    Enter tags for these files: <input type='tags' id='tags'></input>

                    <br><button id="uncheck">Uncheck all</button>

                    Select 'area' for these files: <select name='area' id="area">
                        <option value='' selected></option>
                        <option value='science'>Science</option>
                        <option value='math'>Math</option>
                        <option value='english'>English</option>
                        <option value='nepali'>Nepali</option>
                        <option value='social studies'>Social Studies</option>
                    </select>
                    Enter 'sub-area' for these files: <input type='text' name='subarea' id="subarea"></input>

                    <br>Click files to register, select source, area, etc, then click "Submit"<button id="submit">Submit</button>
              </div>

               <div id="hints">
                   <p class="hint">1. Navigate to a folder </p>
                   <p class="hint">2. Filter list of files shown</p>
                   <p class="hint">3. Check the files to import</p>
                   <p class="hint">4. Enter information in the bottom panel</p>
                   <p class="hint">5. Click "Import" to import the files</p>
                   <p class="hint">6. Click "Change folder" to move to another folder</p>
               </div>

               <div id="activity-controls" hidden>
                    <button id="import"   class="control">  Import    </button>
                    <!--
                        <button id="unassign" class="control">  Un-assign from this chapter</button>
                        <button id="assign" class="control">  Assign to another chapter  </button>
                    -->
                    <button id="cancel" class="control">  Cancel   </button>
                </div>

            </div>
        </div>

<?php   include ('includes/js-includes.php');
?>
        <script src="js/jquery-ui.min.js">  </script>
        <script src="js/jquery.hotkeys.js"> </script>
        <script src="js/tether.min.js">  </script>
        <script src="js/bootstrap.min.js">  </script>

<?php
        include ('includes/looma-search.php');
?>
       <script src="js/looma-import-content.js"></script>

    </body>
</html>


