@<?php
/*
	Author: Akshay Srivatsan
	Date: July 8, 2016
    UPdated: JUN 2025, by Skip
    extended FEB 2023 by Skip - add larynx engine for Nepali speech
    extended JUN 2025 by Skip - add piper engine for Nepali speech

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

    The client side may break up a long text into multiple short texts
    and then call this server page for each
    If multiple phrases are submitted, this server page could be called
    more than once per second.Adding the random number will ensure a unique filename.
*/

$text =   (isset($_REQUEST['text']) && $_REQUEST['text'] != "")   ? htmlentities($_REQUEST["text"]) : null;
$text = escapeshellarg($text);
//if ($text === null) return;

$voice =   ( isset($_REQUEST['voice'])  && $_REQUEST['voice']  != "undefined") ? $_REQUEST["voice"] : null;
$engine =  ( isset($_REQUEST['engine']) && $_REQUEST['engine'] != "undefined") ? $_REQUEST["engine"] : null;

if      ( ! $engine && exec('which piper')) $engine = 'piper';
else if ( ! $engine && exec('which mimic')) $engine = 'mimic';
//else return;

// RATE parameter sets speaking rate ( rate > 1 means FASTER)
// default RATE for Looma is 2/3 - speak slower so Nepali
// students can understand easier
$rate =  ( isset($_REQUEST['rate']) && $_REQUEST['rate'] != "undefined")   ? $_REQUEST['rate'] : 2/3;
$speed = 1/$rate;

// detecting devanagari is now done in looma-utilities.js LOOMA.speak()
if (preg_match('/\p{Devanagari}/u', $text))
     $text_lang = 'np';
else $text_lang = 'en';

date_default_timezone_set("UTC");
$date = new DateTime();

$outputFileName = "/tmp/website.looma.tts.speak." . $date->getTimestamp() . "_" . mt_rand() . ".wav";
if (file_exists($outputFileName)) // IF we get conflicting filenames, generate a different filename
{ $outputFileName = "/tmp/website.looma.tts.speak." . $date->getTimestamp() . "_" . mt_rand() . "_" . mt_rand() . ".wav";}

//echo "in TTS.php, engine is $engine, text is $text,  voice is $voice, speed is $speed"; //return;

/* OLD CODE
if ($engine === 'piper') {   /////// * * * PIPER * * *  /////////
    if ($text_lang === "np") {
        $voice = "ne_NP-google-medium.onnx";
        $voiceport = "5001";
    } else {
        $voice = "en_US-amy-medium.onnx";
        $voiceport = "5000"
    };

// this command "curl" calls the piper-tts[http] server running in background, to get low latency response
    // port 5000 is for English voice, port 5001 is for Nepali voice
        $command = "curl -X POST -H 'Content-Type: application/json'" .
            " -d \"{ 'text': $text }\" " .
            " -o $outputFileName localhost:$voiceport";

  this command calls piper directly, but has high latency (>2sec) to respond because it reloads the voice on each call
     if ( ! exec('which piper')) return;
     $voiceFile = "../piper/voices/$voice";
     $command = "echo  "  .  $text  . " | piper " .
        "  --model $voiceFile" .
        "  --length_scale $speed" .
        "  --output_file $outputFileName";
END OLC CODE*/

if ($engine === 'piper') {   /////// * * * PIPER * * *  /////////
    if ($text_lang === "np") {
        $voice = "ne_NP-google-medium.onnx";
        $voiceport = "5001";
    } else {
        $voice = "en_US-amy-medium.onnx";
        $voiceport = "5000";
    };

// this command "curl" calls the piper-tts[http] server running in background, to get low latency response
    // port 5000 is for English voice, port 5001 is for Nepali voice
        $text = trim($text,"'");
        $command = "curl -X POST -H 'Content-Type: application/json'" .
            " -d '{ \"text\": \"$text\" }' " .
            " -o $outputFileName localhost:$voiceport";

//echo $command;return;

 /* this command calls piper directly, but has high latency (>2sec) to respond because it reloads the voice on each call
     if ( ! exec('which piper')) return;
     $voiceFile = "../piper/voices/$voice";
     $command = "echo  "  .  $text  . " | piper " .
        "  --model $voiceFile" .
        "  --length_scale $speed" .
        "  --output_file $outputFileName";
*/





} else if ($engine === 'mimic') {  /////// * * * MIMIC * * *  /////////
    if (empty($voice)) {
        // Good mimic voices: cmu_us_bdl (male),cmu_us_jmk (male),cmu_us_ljm (female),cmu_us_aup (male), mycroft_voice_4.0 (male)
        $voice = "cmu_us_aup";
    }

    if ($text_lang === 'np') $text = "I do not know how to speak Nepali.";

    $voiceFile = "../mimic/voices/$voice" . ".flitevox";

    $mimicCommand = exec("which mimic");
    $command = "$mimicCommand " .
        " -t $text" .
        "  --setf duration_stretch=$speed" .  // to slow down to 2/3 rate, we stretch to 1.5
        "  -voice " . escapeshellarg($voiceFile) .
        "  -o " . $outputFileName;

} else return;

header("Access-Control-Allow-Origin: *");
header("Content-Type: audio/wav");

// execute the shell command to convert 'text' to voice and output a .wav file
exec($command);
// send the .wav file to the client
readfile($outputFileName);           // play the wave file to the client side
//unlink($outputFileName);             // delete the wave file
?>
