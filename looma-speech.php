<?php
/*
	Author: Akshay Srivatsan
	Date: August 7, 2015

	Notes: if this file causes an empty response, make sure the directory "tmp" exists.
 		   In addition, make sure PHP has permission to write into that directory (call "chmod 777 /var/www/html/Looma/tmp").

    NOTE [skip] to avoid conflicts between multiple simultaneous users
             i. name the tmp .wav file "tmp/" . uniqid() . ".wav"
        and  ii. delete the file after sending it the client
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: audio/wav");
//$text = urldecode($_GET["text"]);  //skip's version
$text  = htmlspecialchars($_GET["text"]);   //akshay's version
$unique_filename = "/tmp/" . uniqid("audio") . ".wav"; //unique filename prefixed with "audio"
exec('pico2wave -w ' . $unique_filename . ' "' . $text . '"');
readfile($unique_filename);
exec('rm ' . $unique_filename);

?>