<?php
/*
	Author: Akshay Srivatsan
	Date: July 8, 2016
	Notes: Make sure https://github.com/MycroftAI/mimic has been installed on the Looma server
    and that the voices have been copied to /var/www/html/Looma/voices/*.flitevox.
 *
    Usage: looma-mimic.php?text=TEXT&voice=VOICE  [URLencode the parameter text strings]
        TEXT = the (English) text to convert to audio
        VOICE = the voice to speak with - either "cmu_us_*" or "mycroft_voice_4.0"
 */

$text = htmlentities($_REQUEST["text"]);
$voice = $_REQUEST["voice"];

if (empty($voice))
    {   // Good Voices: cmu_us_bdl (male), cmu_us_jmk (male), cmu_us_ljm (female), cmu_us_slt (female), mycroft_voice_4.0 (male)
        $voice = "mycroft_voice_4.0";
    }

if (preg_match('/[^\\p{Common}\\p{Latin}]/u', $text))
    {
        // Should detect Devanagari characters, according to http://stackoverflow.com/questions/3411566/how-can-i-detect-non-western-characters
        $text = "I do not know how to speak Nepali.";
    }

$voiceFile = "voices/" . $voice . ".flitevox";
date_default_timezone_set("UTC");
$date = new DateTime();
// The client side may break up a long text into multiple short texts and then call this server page for each
// If multiple phrases are submitted, this server page could be called more than once per second.
// Adding the random number will create a unique filename.
$outputFileName = "/tmp/website.looma.tts.mimic." . $date->getTimestamp() . "_" . mt_rand() . ".wav";

if (file_exists($outputFileName)) // IF we get conflicting filenames, generate a different filename
                                  //This is extremely unlikely. (There are 2^31 possibilities.)
    {
        $outputFileName = "/tmp/website.looma.tts.mimic." . $date->getTimestamp() . "_" . mt_rand() . "_" . mt_rand() . ".wav";
    }

$command = "~/mimic/bin/mimic -t " .
            escapeshellarg($text) .
           " -voice " .
            escapeshellarg($voiceFile) .
           " -o " . $outputFileName;

/*
$sample = escapeshellarg("sample text to speak 3");
$command = "mimic -t " . $sample . " -o /tmp/temp3";
*/

header("Access-Control-Allow-Origin: *");
header("Content-Type: audio/wav");
exec($command);                     // generate the wave file
readfile($outputFileName);          // play the wave file to the client side
 //unlink($outputFileName);            // delete the wave file
?>
