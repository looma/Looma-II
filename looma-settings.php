<!doctype html>
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-settings.php
Description:  for Looma 2
-->

<?php $page_title = 'Looma Settings';
	  include ('includes/header.php');
?>
	<link rel="stylesheet" href="css/looma-settings.css">
	</head>

	<body>
	<div id="main-container-horizontal">
	    <div id="settings">
			<h3 class="title">Looma Settings Page</h3>
            <br><br><br><br>

            <div id="themelist">
                <span>Change theme of Looma's pages:  </span>
                <select id="themes">
                    <option class="theme" id="looma"         value="looma">Looma Classic
                            <img class="thumb" src="images/theme-looma.png" ></option>
                    <option class="theme" id="style-sheet"   value="style-sheet">   Style Sheet
                            <img class="thumb" src="images/theme-stylesheet.png" > </option>
                    <option class="theme" id="white"         value="white">      White
                            <img class="thumb" src="images/theme-white.png" > </option>
                    <option class="theme" id="green"         value="green">      Eco Green
                            <img class="thumb" src="images/theme-ecogreen.png" > </option>
                    <option class="theme" id="blackandwhite" value="blackandwhite">  Black & White
                            <img class="thumb" src="images/theme-black-and-white.png" > </option>
                    <option class="theme" id="redandblack"   value="redandblack">    Red and Black
                            <img class="thumb" src="images/theme-red-and-black.png" > </option>
                    <option class="theme" id="kate"          value="kate">       Summer
                            <img class="thumb" src="images/theme-summer.png" > </option>
                    <option class="theme" id="magenta"       value="magenta">    Magenta
                            <img class="thumb" src="images/theme-magenta.png" > </option>
                    <option class="theme" id="blueandgreen"  value="blueandgreen">    Blue-Green
                            <img class="thumb" src="images/theme-blue-green.png" > </option>
                </select>
            </div>

            <div id="voicelist">
                <span>Change voice of Looma speaking:  </span>
                <select id="voices">
                    <option data-engine="mimic" class="voice" id="cmu_us_bdl"  value="cmu_us_bdl">   US male (bdl) </option>
                    <option data-engine="mimic" class="voice" id="cmu_us_clb"  value="cmu_us_clb">   US female (clb) </option>
                    <option data-engine="mimic" class="voice" id="cmu_us_aew"  value="cmu_us_aew">   US male (aew) </option>
                    <option data-engine="mimic" class="voice" id="cmu_us_ahw"  value="cmu_us_ahw">   German male (ahw) </option>
                    <option data-engine="mimic" class="voice" id="cmu_us_aup"  value="cmu_us_aup">   Indian male (aup) </option>
                    <option data-engine="mimic" class="voice" id="cmu_us_awb"  value="cmu_us_awb">   Scottish male (awb) </option>
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

            <div id="synth-voices"></div>
        </div>

         <div id="tools">

            <a href="looma-lesson-plan.php">
                <button class="settings-control">Lesson Plan Editor</button>
            </a>

            <a href="looma-text-editor.php">
                <button class="settings-control">Text Editor</button>
            </a>

             <a href="looma-evi-editor.php">
                 <button class="settings-control">Video Editor</button>
             </a>

             <a href="looma-upload-file.php">
                 <button class="settings-control">Upload Files</button>
             </a>

             <a href="looma-edit-activities.php">
                 <button class="settings-control">Edit Activities</button>
             </a>

             <a href="looma-speech-test.php">
                 <button id="speechtest" class="admin-control">Speech Test</button>
             </a>

             <a href="looma-dictionary-autogen-editor.php">
                 <button id="speechtest" class="admin-control" >Dictionary Editor</button>
             </a>

             <a href="looma-register-user.php">
                 <button id="speechtest" class="exec-control" >Users</button>
             </a>

 <!--           <a href="../auto-gen-dictionary/editor.html">
                    <button class="admin-control">Dictionary Generator</button>
                </a>

                <a href="../Looma-contentNav/looma-contentNav.php">
                    <button class="admin-control">Content Navigator</button>
                </a>

                <a href="looma-slideshow.php">
                    <button class="admin-control">Slideshow Editor</button>
                </a>

                <a href="looma-activity-register-to-chapter.php">
                    <button id="register" class="admin-control">Register Activities</button>
                </a>
-->
             <br><br><br><br>
             <span id="login-status"></span>
             <button class="login"></button>

         </div>
	</div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

   	<script src="js/looma-settings.js"> </script>
	</body>
</html>
