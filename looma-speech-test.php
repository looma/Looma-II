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
	<button id="synthesis">Speak with speechSynthesis</button><br><br>
	<button id="responsive">Speak with responsiveVoice</button><br><br>
	<button id="pico">Speak with pico2wave</button><br><br>
	<button id="other">Speak with other</button><br><br>
</body>

<?php include ('includes/js-includes.php'); ?>
 	   		<script src="js/responsiveVoice.js"></script>
<script>

   	function speak(engine, text) {
   		switch (engine) {
   			case 'synthesis':
  		 	if (speechSynthesis) { //careful with this - Looma may show existence of speechSynthesis but still not .speak()
   				var speech = new SpeechSynthesisUtterance(text);
   				//speech.voice ='Ellen';

				var voices = window.speechSynthesis.getVoices();
				speech.voice = voices.filter(function(voice) { return voice.name == 'Chrome OK US English Female HQ'; })[0];

 				speechSynthesis.speak(speech);}
 			else console.log ('speechSynthesis not present');
   			break;
   			case 'responsive':
   				if(responsiveVoice.voiceSupport()) {
   					responsiveVoice.setDefaultVoice("US English Female");
 	  				responsiveVoice.speak(text);}
 	  			else console.log ('responsiveVoice not present');

   			break;
   			case 'pico':
   				new Audio('/Looma/looma-speech.php?text=' + encodeURIComponent(text)).play();
   			break;
   			case 'other':
   			break;
   		};//end switch
   		}; //end speak()


   	$(document).ready (function() {
   		$('button').click(function(){
   			speak($(this).attr('id'), $('input#text').val());
   		});

	/*	$('button.synthesis').click(function(){speak('hello looma. speech is working');});

		$('input#text').change(function(){
			//$('input:textbox').val()
			LOOMA.speak(this:textbox.val());
		});
	*/
	}); //end document.ready function

</script>

</html>
