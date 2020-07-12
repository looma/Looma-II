<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: includes/looma-translate.php
Description:  functions and translation array for Keywords used in Looma 2
-->

<?php
include_once ('includes/looma-translations.php');

function keyword($english) {

	// this function generates the span (for 'english') label
	// and a hidden span (for 'native') label.
	// JS function LOOMA.translate(), will toggle the two spans' hidden state
	// so it shows the label in the right language
	// the HTML generated for each KEYWORD label has a class="english-keyword" initially visible button
	// and a class="native-keyword" initially hidden button
	//
	global $TKW;

	//NOTE: should make this case insensitive

	$native = (isset($TKW[$english]) ? $TKW[$english] : $english); //default if no translation is the english
	echo "<span class='english-keyword'>"
			 . $english .
			 "<span class='xlat'>" . $native . "</span>" .
		 "</span>";
	echo "<span class='native-keyword' >"
			. $native .
	    	"<span class='xlat'>" . $english . "</span>" .
		 "</span>";

}    //end function KEYWORD()

function tooltip($english) {
        // each label has a span with class='tip' to show a tooltip with the translation when hovering over the phrase
		global $TKW;
		$native = (isset($TKW[$english]) ? $TKW[$english] : $english); //default if no translation is the english

		echo "<span class='tip english-tip yes-show'>" . $english . "</span>";
		echo "<span class='tip native-tip'>"           . $native  . "</span>";

}  //end function TOOLTIP()
?>

