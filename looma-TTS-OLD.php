<?php
/*
	Author: Akshay Srivatsan
	Date: July 8, 2016
    UPdated: JUN 2025, by Skip
	Notes: Make sure "piper" [or, https://github.com/MycroftAI/mimic] has been installed
        on the Looma server and
        that the voices have been copied to /var/www/html/piper/
 *
    IMPORTANT: make sure the binary for piper [check "which piper"] is in the $PATH of the webserver process
               usually, put the piper binary in /usr/local/bin
 *
    Usage: looma-TTS.php?text=TEXT&voice=VOICE&engine=ENGINE&lang=LANGUAGE&rate=RATE  [URLencode the parameter text strings]
        TEXT = the (English) text to convert to audio
        VOICE = the voice to speak with
        ENGINE = "piper" (or "mimic" [legacy])
        LANG = 'np' or 'en'
        RATE = speed relative to 1=normal rate

    extended FEB 2023 by Skip - add larynx engine for Nepali speech
    extended JUN 2025 by Skip - add piper engine for Nepali speech
 */

$text =   isset($_REQUEST['text'])   ? htmlentities($_REQUEST["text"]) : null;
if ($text === null) return;

$voice =  isset($_REQUEST['voice'])  ? $_REQUEST["voice"] : null;
$engine = isset($_REQUEST['engine']) ? $_REQUEST["engine"] : 'piper';
//$lang =   isset($_REQUEST['lang'])   ? $_REQUEST['lang'] : null;

// RATE parameter sets speaking rate ( rate > 1 means FASTER)
// default RATE for Looma is 2/3 - speak slower so Nepali
// students can understand easier
$rate =   isset($_REQUEST['rate'])   ? $_REQUEST['rate'] : 2/3;

//debug:

    //echo "text is $text, voice is $voice, engine is $engine, lang is $lang, rate is $rate";
    //return;

// detecting devanagari is now done in looma-utilities.js LOOMA.speak()
if (preg_match('/\p{Devanagari}/u', $text))
    {
        // detects Devanagari characters,
        // good tutorial here: https://www.regular-expressions.info/unicode.html
        //$text = "I do not know how to speak Nepali.";
        $lang = 'np';
    }


date_default_timezone_set("UTC");
$date = new DateTime();

// The client side may break up a long text into multiple short texts
// and then call this server page for each
// If multiple phrases are submitted, this server page could be called
// more than once per second.Adding the random number will ensure a unique filename.

$outputFileName = "/tmp/website.looma.tts.speak." . $date->getTimestamp() . "_" . mt_rand() . ".wav";
if (file_exists($outputFileName)) // IF we get conflicting filenames, generate a different filename
    { $outputFileName = "/tmp/website.looma.tts.speak." . $date->getTimestamp() . "_" . mt_rand() . "_" . mt_rand() . ".wav";}

if ($engine === 'piper') {
    if (!$voice) {
        if ($lang = 'np') $voice = "ne_NP-google-medium.onnx";
        else              $voice = "en_US-amy-medium.onnx";
    };

    //echo "engine is $engine, voice is $voice";

    $command = "echo " . escapeshellarg($text) . " | piper " .
        " --model /usr/share/piper/$voice --output_file $outputFileName";  // move voices to inside ../Looma ???

    //DEBUG
    //echo "command is $command";
    //return;

} else if ($engine === 'mimic') {
    if (empty($voice)) {
        // Good mimic voices: cmu_us_bdl (male), cmu_us_jmk (male),
        //              cmu_us_ljm (female), cmu_us_aup (male), mycroft_voice_4.0 (male)
        $voice = "cmu_us_aup";
    }

    if ($lang === 'np') $text = "I do not know how to speak Nepali.";

    $voiceDir = "../voices/";
    $voiceFile = $voiceDir . $voice . ".flitevox";

    $mimicCommand = exec("which mimic");
    $command = "$mimicCommand -t " .
        escapeshellarg($text) .
        " --setf duration_stretch=" . (string) $rate .  // to slow down to 2/3 rate, we stretch to 1.5
        "  -voice " . escapeshellarg($voiceFile) .
        " -o " . $outputFileName;

} else return;

//echo "exec'ing command";return;

header("Access-Control-Allow-Origin: *");
header("Content-Type: audio/wav");


//DEBUG
       // echo "output file is $outputFileName";
        ///echo "command is $command";
        //return;



// execute the shell command to convert 'text' to output .wav file
exec($command);

    echo "exec'd command"; return;

// generate the wave file
// send the .wav file to the client
readfile($outputFileName);           // play the wave file to the client side

unlink($outputFileName);             // delete the wave file
?>
