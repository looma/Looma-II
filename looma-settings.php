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
?>
	<link rel="stylesheet" href="css/looma-settings.css">
	</head>

	<body>
	<div id="main-container-horizontal">
        <h1 class="title">Looma Settings Page</h1>
	    <div id="user-tools">
        <br><br>
        <?php
            //makeActivityButton('pdf', $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom, $grade, $epversion, $nfn, $npg, $prefix,$lang)
            makeActivityButton('pdf','', 'user_manual_en.pdf', 'Looma User Manual', 'User Manual','images/logos/LoomaLogoTransparentTrimmed.png',null,null,null,'',1,null,null,null,'',null,null,null);
        ?>
        </div>

         <div id="tools">
             <span id="login-status"></span>
             <button class="login"></button><br><br>

            <a href="looma-edit-lesson.php">
                <button class="settings-control">Lesson Plan Editor</button>
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

             <a href="looma-edit-video.php">
                 <button class="settings-control">Video Editor</button>
             </a>

             <a href="looma-edit-activities.php">
                 <button class="admin-control">Activity Editor</button>
             </a>

             <br>
             <a href="looma-register-user.php">
                 <button id="registeruser" class="exec-control" >Users</button>
             </a>

             <a href="looma-import-content.php">
                 <button id="importcontent" class="exec-control" >Import Content</button>
             </a>

             <a href="looma-dictionary-autogen-editor.php">
                 <button id="speechtest" class="exec-control" >Dictionary Editor</button>
             </a>

             <br>
             <button id="exit-kiosk" class="looma-control-button">
                 <!-- <span class="xlat">To exit Kiosk mode type Alt-F4 on a keyboard</span> -->
             </button>
             <button id="shutdown" class="looma-control-button">
                 <!-- <span class="xlat">To shutdown Looma type Crtl-W on a keyboard</span> -->
             </button>
            <br><br>


             <div id="voicelist" class="settings-control">
                 <span>Change voice of Looma speaking:  </span>
                 <select id="voices">
                     <option data-engine="mimic" class="voice" id="cmu_us_aup"  value="cmu_us_aup">   Indian male (aup) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_awb"  value="cmu_us_awb">   Scottish male (awb) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_bdl"  value="cmu_us_bdl">   US male (bdl) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_clb"  value="cmu_us_clb">   US female (clb) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_aew"  value="cmu_us_aew">   US male (aew) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_ahw"  value="cmu_us_ahw">   German male (ahw) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_axb"  value="cmu_us_axb">   Indian female (axb) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_eey"  value="cmu_us_eey">   US female (eey) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_fem"  value="cmu_us_fem">   German male (fem) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_gka"  value="cmu_us_gka">   Indian male (gka) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_jmk"  value="cmu_us_jmk">   US male (jmk) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_ksp"  value="cmu_us_ksp">   Indian male (ksp) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_ljm"  value="cmu_us_ljm">   US female (ljm) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_rms"  value="cmu_us_rms">   US male (rms) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_rxr"  value="cmu_us_rxr">   US male (rxr) </option>
                     <option data-engine="mimic" class="voice" id="cmu_us_slt"  value="cmu_us_slt">   US female (slt) </option>
                     <option data-engine="mimic" class="voice" id="mycroft_voice_4.0"  value="mycroft_voice_4.0">   English male (mycroft) </option>
                 </select>
             </div>

             <a href="looma-speech-test.php">
                 <button id="speechtest" class="settings-control">Speech Test</button>
             </a>

             <br><div id="themelist" class="admin-control">
                 <span>Change theme of Looma's pages:  </span>
                 <select id="themes">
                     <option class="theme" id="looma"         value="looma">         Looma Classic
                         <img class="thumb" src="images/theme-looma.png" ></option>
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
         </div>


    </div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

   	<script src="js/looma-settings.js"> </script>
	</body>
</html>
