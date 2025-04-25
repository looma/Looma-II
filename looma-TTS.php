<?php
/*
	Author: Akshay Srivatsan
	Date: July 8, 2016
	Notes: Make sure https://github.com/MycroftAI/mimic has been installed
        on the Looma server and
        that the voices have been copied to /var/www/html/voices/*.flitevox.
 *
    IMPORTANT: make sure the binary for mimic [check "which mimic"] is in the $PATH of the webserver process
               usually, put the mimic binary in /usr/bin
 *
    Usage: looma-mimic.php?text=TEXT&voice=VOICE  [URLencode the parameter text strings]
        TEXT = the (English) text to convert to audio
        VOICE = the voice to speak with - either "cmu_us_*" or "mycroft_voice_4.0"

    extended FEB 2023 by Skip - add larynx engine for Nepali speech
 */

$voiceDir = "../voices/";

$text = htmlentities($_REQUEST["text"]);
$voice = $_REQUEST["voice"];
$engine = $_REQUEST["engine"];

// RATE parameter sets speaking rate ( rate > 1 means FASTER)
// default RATE for Looma is 2/3 - speak slower so Nepali
// students can understand easier
$rate = $_REQUEST["rate"] ? ( $_REQUEST['rate']) : 2/3;


// detecting devanagari is now done in looma-utilities.js LOOMA.speak()
/* if (preg_match('/\p{Devanagari}/u', $text))
    {
        // detects Devanagari characters,
        // good tutorial here: https://www.regular-expressions.info/unicode.html
        $text = "I do not know how to speak Nepali.";
    }
 */

date_default_timezone_set("UTC");
$date = new DateTime();

// The client side may break up a long text into multiple short texts
// and then call this server page for each
// If multiple phrases are submitted, this server page could be called
// more than once per second.Adding the random number will ensure a unique filename.

$outputFileName = "/tmp/website.looma.tts.mimic." . $date->getTimestamp() . "_" . mt_rand() . ".wav";
//DEBUG  echo "output file name: " . $outputFileName;
if (file_exists($outputFileName)) // IF we get conflicting filenames, generate a different filename
    { $outputFileName = "/tmp/website.looma.tts.mimic." . $date->getTimestamp() . "_" . mt_rand() . "_" . mt_rand() . ".wav";}

//DEBUG  echo $outputFileName . '   ';
//DEBUG  echo shell_exec('echo $PATH');
//DEBUG  echo shell_exec('which mimic');return;
//DEBUG  echo "input text is : " . $text . "   ";

if ($engine === 'mimic') {

    if (empty($voice)) {
        // Good Voices: cmu_us_bdl (male), cmu_us_jmk (male),
        //              cmu_us_ljm (female), cmu_us_aup (male), mycroft_voice_4.0 (male)
        $voice = "cmu_us_aup";
    }
    $voiceFile = $voiceDir . $voice . ".flitevox";

    $mimicCommand = exec("which mimic");
    $command = "$mimicCommand -t " .
        escapeshellarg($text) .
        " --setf duration_stretch=" . (string)1 / $rate .  // to slow down to 2/3 rate, we stretch to 1.5
        "  -voice " . escapeshellarg($voiceFile) .
        " -o " . $outputFileName;

} else if ($engine === 'larynx') {

    $command = "echo " . escapeshellarg($text) . " | ../larynx/larynx " .
        " --model ../larynx/voice/ne-google-low.onnx --output_file $outputFileName";

} else if ($engine === 'piper') {
    error_log($outputFileName);

    $command = "echo " . escapeshellarg($text) . " | ../piper/piper " .
        " --model ../piper/ne_NP-google-medium.onnx --output_file $outputFileName";
} else return;

/*DEBUG
    $sample = escapeshellarg("sample text to speak 3");
    $command = "mimic -t " . $sample . " -o /tmp/temp3";
*/

header("Access-Control-Allow-Origin: *");
header("Content-Type: audio/wav");
exec($command);                     // generate the wave file
readfile($outputFileName);           // play the wave file to the client side
unlink($outputFileName);             // delete the wave file
?>
