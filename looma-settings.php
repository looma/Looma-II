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
			<h3 class="title">Looma Settings page</h3>

            <div id="themelist"
                <h4>Change themes with these buttons</h4><br>
                     <span class="themespan"><input type="radio" name="theme" class="theme" id="looma"        value="looma">      Looma Classic
                        <img class="thumb" src="images/theme-looma.png" > </span>
                <br> <span class="themespan"><input type="radio" name="theme" class="theme" id="style-sheet"   value="style-sheet">   Style Sheet
                        <img class="thumb" src="images/theme-stylesheet.png" > </span>
                <br> <span class="themespan"><input type="radio" name="theme" class="theme" id="white"        value="white">      White
                        <img class="thumb" src="images/theme-white.png" > </span>
                <br> <span class="themespan"><input type="radio" name="theme" class="theme" id="green"        value="green">      Eco Green
                        <img class="thumb" src="images/theme-ecogreen.png" > </span>
                <br> <span class="themespan"><input type="radio" name="theme" class="theme" id="blackandwhite" value="blackandwhite">  Black & White
                        <img class="thumb" src="images/theme-black-and-white.png" > </span>
                <br> <span class="themespan"><input type="radio" name="theme" class="theme" id="redandblack"   value="redandblack">    Red and Black
                        <img class="thumb" src="images/theme-red-and-black.png" > </span>
                <br> <span class="themespan"><input type="radio" name="theme" class="theme" id="kate"          value="kate">       Summer
                        <img class="thumb" src="images/theme-summer.png" > </span>
                <br> <span class="themespan"><input type="radio" name="theme" class="theme" id="magenta"       value="magenta">    Magenta
                        <img class="thumb" src="images/theme-magenta.png" > </span>
                <br> <span class="themespan"><input type="radio" name="theme" class="theme" id="blueandgreen"  value="blueandgreen">    Blue-Green
                        <img class="thumb" src="images/theme-blue-green.png" > </span>
            </div>


            <div id="voicelist">
                <h4>Change voices with these buttons</h4><br>

                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_bdl"  value="cmu_us_bdl">   US male (bdl) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_clb"  value="cmu_us_clb">   US female (clb) </span>
                 <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_aew"  value="cmu_us_aew">   US male (aew) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_ahw"  value="cmu_us_ahw">   German male (ahw) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_aup"  value="cmu_us_aup">   Indian male (aup) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_awb"  value="cmu_us_awb">   Scottish male (awb) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_axb"  value="cmu_us_axb">   Indian female (axb) </span>
                 <br>
               <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_eey"  value="cmu_us_eey">   US female (eey) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_fem"  value="cmu_us_fem">   German male (fem) </span>
                 <br>
               <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_gka"  value="cmu_us_gka">   Indian male (gka) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_jmk"  value="cmu_us_jmk">   US male (jmk) </span>
                 <br>
               <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_ksp"  value="cmu_us_ksp">   Indian male (ksp) </span>
                <br
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_ljm"  value="cmu_us_ljm">   US female (ljm) </span>
                 <br>
               <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_rms"  value="cmu_us_rms">   US male (rms) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_rxr"  value="cmu_us_rxr">   US male (rxr) </span>
                  <br>
              <span class="voicespan"><input type="radio" name="voice" class="voice" id="cmu_us_slt"  value="cmu_us_slt">   US female (slt) </span>
                <br>
                <span class="voicespan"><input type="radio" name="voice" class="voice" id="mycroft_voice_4.0"  value="mycroft_voice_4.0">   English male (mycroft) </span>
            </div>

          <hr>
            <a href="looma-speech-test.php"> LINK TO:  Looma speech test page </a>

            <hr>
            <p id="login-status"></p>
            <div>
                <button class="login"></button>

                <a href="../Looma-lesson-planner/FrontEnd/index2.html">
                    <button id="lesson-planner" class="settings-control">Looma Lesson Planner</button>
                </a>
                <a href="../auto-gen-dictionary/editor.html">
                    <button id="dictionary-gen" class="settings-control">Looma Dictionary Generator</button>
                </a>
            </div>

	</div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

   	<script src="js/looma-settings.js"> </script>
	</body>
</html>