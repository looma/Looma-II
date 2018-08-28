<?php
function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Dictionary Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Author:
Email: skip@stritter.com
Filename: yyy.html
Date: x/x/2015
Description:
-->

<head>

</head>

<body>
	<br><br>
	Enter a phrase to speak:  <input type="text" id="text" size="250" value="Hello this is Looma"> </input><br><br>
    <button id="mimic">Speak with mimic [looma default]</button><br><br>
    <button id="synthesis">Speak with speechSynthesis</button><br><br>
	<!--<button id="responsive">Speak with responsiveVoice</button><br><br> -->
	</br>
	<!--<button id="pico">Speak with pico2wave</button><br><br> -->
	<!--<button id="other">Speak with other</button><br><br> -->
</body>

<?php include ('includes/js-includes.php'); ?>
            <!--<script src="js/responsiveVoice.js"></script> -->
      <script src="js/looma-speech-test.js"></script>


</html>
