<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-settings.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma Settings';
      require_once ('includes/header.php');
      require_once ('includes/looma-utilities.php');
      logPageHit('settings');
?>
	<link rel="stylesheet" href="css/looma-settings.css">
	</head>

	<body>
	<div id="main-container-horizontal">
        <h1 class="title">Looma Settings Page</h1>
	    <div id="user-tools">
        <br><br>
            <a href="looma-library.php?fp=../content/Looma%20User%20Manuals/">
                <button class="logo">
                    <img src="images/logos/Looma-english-amanda 2x1 crop transparent.png">
                    <br> Looma User Manuals
                </button></a>

        </div>

         <div id="tools">
             <span id="login-status"></span>
             <button class="login"></button>
             <button class="change-password settings-control"></button><br><br>

            <a href="looma-edit-lesson.php">
                <button class="settings-control">Lesson Editor</button>
            </a>

             <a href="looma-edit-text.php">
                 <button class="settings-control">Text Editor</button>
             </a>

             <a href="looma-text-translator.php">
                 <button class="settings-control">Text Translator</button>
             </a>

             <a href="looma-edit-slideshow.php">
                 <button class="settings-control">Slideshow Editor</button>
             </a>

           <!--  <a href="looma-edit-video.php">
                 <button class="settings-control">Video Editor</button>
             </a>
            -->

             <a href="looma-edit-activities.php">
                 <button class="admin-control">Resource Editor</button>
             </a>

             <a href="looma-edit-dictionary.php">
                 <button id="requestcontent" class="admin-control" >Dictionary Editor</button>
             </a>

             <a href="looma-text-scan.php">
                 <button id="textscan" class="admin-control" >Scan Text Files</button>
             </a>
         <!--
             <a href="looma-content-request.php">
                 <button id="requestcontent" class="admin-control" >Request Resource</button>
             </a>
        -->
             <br>
             <a href="looma-register-user.php">
                 <button id="registeruser" class="exec-control" >Users</button>
             </a>

             <a href="looma-import-content.php">
                 <button id="update" class="exec-control" > Import Content </button>
             </a>

<?php    // enable line below to restrict UPDATE to Looma boxes [$LOOMA_SERVER === 'looma local']
  //  if ($LOOMA_SERVER === 'looma local') {
  //      echo "<a href = 'looma-update.php' >";
  //      echo "   <button id = 'update' class='exec-control' > Update Code and Content </button >";
  //      echo "</a >";
  //  };
?>

             <br>

             <br><div id="themelist" class="exec-control">
                 <span>Change theme of Looma's pages:  </span>
                 <select id="themes">
                     <option class="theme" id="looma"         value="looma">         Looma Classic
                         <img class="thumb" src="images/theme-looma.png" ></option>
                     <option class="theme" id="CEHRD"         value="CEHRD">         CEHRD
                         <img class="thumb" src="images/theme-CEHRD.png" ></option>
                     <option class="theme" id="style-sheet"   value="style-sheet">   Style Sheet
                         <img class="thumb" src="images/theme-stylesheet.png" > </option>
                     <option class="theme" id="white"         value="white">         White
                         <img class="thumb" src="images/theme-white.png" > </option>
                     <option class="theme" id="green"         value="green">         Eco Green
                         <img class="thumb" src="images/theme-ecogreen.png" > </option>
                     <option class="theme" id="blackandwhite" value="blackandwhite"> Black & White
                         <img class="thumb" src="images/theme-black-and-white.png" > </option>
                     <option class="theme" id="redandblack"   value="redandblack">   Red and Black
                         <img class="thumb" src="images/theme-red-and-black.png" > </option>
                     <option class="theme" id="kate"          value="kate">          Summer
                         <img class="thumb" src="images/theme-summer.png" > </option>
                     <option class="theme" id="magenta"       value="magenta">       Magenta
                         <img class="thumb" src="images/theme-magenta.png" > </option>
                     <option class="theme" id="blueandgreen"  value="blueandgreen">  Blue-Green
                         <img class="thumb" src="images/theme-blue-green.png" > </option>
                 </select>
             </div>
             <br><br>
             <div >
                 <div id="voicegender" class="admin-control">
                     <span>Female or male voice</span>
                     <input type='radio' name='gender' value='cmu_us_axb' class='gender filter-radio black-outline' id='female' checked>
                     <label class='filter-label' for='gender'>Female</label>
                     <input type='radio' name='gender' value='cmu_us_aup' class='gender filter-radio black-outline' id='male'>
                     <label class='filter-label' for='gender'>Male</label>
                 </div>
                 <div id="speechtestdiv" class="admin-control">
                     <a href="looma-test-speech.php">
                        <button id="speechtest" class="settings-control exec-control">Speech Test</button>
                    </a>
                 </div>
             </div>


         </div>


    </div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

   	<script src="js/looma-settings.js"> </script>
	</body>
</html>
