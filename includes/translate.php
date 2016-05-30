
<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: includes/translate.php
Description:  functions and translation array for Keywords used in Looma 2
-->

<?php
	// array $TKW (TranslateKeyWords) has the english to native translations for all Looma
	// KEYWORD and TOOLTIP buttons. To change languages, say from nepali to swahili, just change this array
	$TKW = array (

	// translate array UPDATED Jan 2016 from latest spreadsheet from SABU //

			"Documents" => "कागजातहरु",
			"Power-off" => "बन्द गर्ने",
			"Exit" => "निकास",
			"Volume" => "मात्रा",
			"Pen" => "कलम",
			"Paintbrush" => "रङ्ग ब्रश",
			"Eraser" => "रबड",
			"Erase" => "मेटाउन",
			"Clear" => "स्पष्ट",
			"Enter" => "प्रविष्ट",
			"Help" => "मदत",
			"Undo" => "अन्डु",
			"Black" => "कालो",
			"Red" => "रातो",
			"Orange" => "सुन्तला रङ्ग",
			"Yellow" => "पहेलो",
			"Green" => "हरियो",
			"Blue" => "नीलो",
			"Indigo" => "इन्डिगो",
			"Violet" => "बैंगनी",
			"Gray" => "खैरो",
			"Quit" => "छोड्ने",
			"Teacher handbooks" => "शशिक्षक हैंड बुक",
			"Looma" => "लुमा",
			"Audio" => "अडियोे",
			"Video" => "भिडियोे",
			"ePaath" => "ई–पाटी",
			"Pictures" => "तस्बीर",
			"Internet" => "इन्टरनेट",
			"Settings" => "सेटिङ्स",
			"Information" => "जानकारी",
			"Textbooks" => "पाठ्यपुस्तक",
			"Handbooks" => "हैंड बुक्स",
			"PDFs" => "पिडिएफहरु",
			"Looma Dictionary" => "लुमा शब्दकोश",
			"Dictionary" => "शब्दकोश",
			"Looma Calculator" => "लुमा क्याल्कुलेटर",
			"Calculator" => "क्याल्कुलेटर",
			"Looma Library" => "लुमा पुस्तकालय",
			"Library" => "पुस्तकालय",
			"Looma Maps" => "लुमा नक्सा",
			"Maps"  => "नक्सा",
			"Enter English word here" => "यहाँ अंग्रेजी शब्द प्रविष्ट गर्नुहोस्",
			"Submit" => "प्रस्तुत",
			"Paint" => "रङ लगाउनुहोस्",
			"Menu" => "मेनु",
			"New Problem" => "नयाँ समस्या",
			"Correct problems" => "सही समस्या",
			"File" => "फाइल",
			"Save file" => "सेभ फाइल",
			"Open file" => "फाइल खोल्नुहोस्",
			"Looma Practice Exercises" => "लुमा अभ्यास व्यायाम",
			"Vocabulary Games" => "शब्दावली खेल",
			"Arithmetic Games" => "अङ्क गणित खेल",
			"Click flashcard for definition" => "च्लिच्क कार्ड फोर देफिनिशन",
			"Click to select a map" => "नक्सा चयन गर्न क्लिक गर्नुहोस््",
			"Click to select a game" => "खेल खेल्न क्लिक गर्नुहोस््",
			"Click to select a drawing" => "एक रेखाचित्र चयन गर्न क्लिक गर्नुहोस््",
			"Click to change theme" => "थेम परिवर्तन गर्न क्लिक गर्नुहोस्",
			"Back" => "फिर्ता",
			"Home" => "घर",
			"Next" => "अगाडी",
			"First" => "पहिलो",
			"Last" => "अन्तिम",
			"Zoom-in" => "भित्र जूम",
			"Zoom-out" => "बाहिर जूम",
			"Play" => "खेल",
			"Mute" => "ध्वनि बन्द्द",
			"Un-mute" => "ध्वनि सुचारुु",
			"Full screen" => "पूरा पर्दा",
			"Class" => "कक्षा ",
			"Topic" => "विषय",
			"Class 1" => "कक्षा १",
			"Class 2" => "कक्षा २",
			"Class 3" => "कक्षा ३",
			"Class 4" => "कक्षा ४",
			"Class 5" => "कक्षा ५",
			"Class 6" => "कक्षा ६",
			"Class 7" => "कक्षा ७",
			"Class 8" => "कक्षा ८",
			"0" => "०",
			"1" => "१",
			"2" => "२",
			"3" => "३",
			"4" => "४",
			"5" => "५",
			"6" => "६",
			"7" => "७",
			"8" => "८",
			"9" => "९",
			"Nepali" => "नेपाली",
			"English" => "अंग्रेजी",
			"Math" => "गणित",
			"Science" => "विज्ञान",
			"Social Studies" => "सामाजिक अध्ययन",
			"Web" => "वेब",
			"Draw" => "चचित्र कोर",
			"Info" => "जानकारी",
			"Settings" => "सेटिङ",
			"Games" => "खेलहरु",
			"अनुवाद" => "Translate",
			"Activities" => "गतिविधिहरु",
			"Add" => "जोड",
			"Subtract" => "घटाऊ",
			"Multiply" => "गुणन",
			"Divide" => "भाग",
			"Pick an old drawing:" => "पुरानो रेखाचित्र छान्नुहोस्",
			"File saved" => "फाइल बचत",
			"Back to the Paint page" => "फिर्ता रंग पृष्ठमा"
	); //end array TKW

function keyword($english) {

	// this function generates the span (for 'english') label
	// and a hidden span (for 'native) label.
	// JS function LOOMA.translate(), will toggle the two spans' hidden state
	// so it shows the label in the right language
	// the HTML generated for each KEYWORD label has a class="english-keyword" initially visible button
	// and a class="native" initially hidden button
	//
	// each label has a span with class='tip' to show a tooltip with the translation when hovering over the phrase
	global $TKW;
	$native = (array_key_exists($english, $TKW) ? $TKW[$english] : $english); //default if no translation, = 'english'

	echo "<span class='english-keyword'>"
			 . $english .
			 "<span class='xlat'>" . $native . "</span>" .
		 "</span>";
	echo "<span class='native-keyword' hidden>"
			. $native .
	    	"<span class='xlat'>" . $english . "</span>" .
		 "</span>";

}; 	//end function KEYWORD()

function tooltip($english) {
		global $TKW;
		$native = (array_key_exists($english, $TKW) ? $TKW[$english] : $english); //default if no translation, = 'english'

		echo "<span class='tip english-tip yes-show'>" . $english . "</span>";
		echo "<span class='tip native-tip'>" . $native . "</span>";

}  //end function TOOLTIP()
?>

