<!--
Name: Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 1.0
File: video-editor-file-viewer.php
Description: Accesses files for the video editor. Mainly copied from looma-library.php
-->

<?php
include ('includes/mongo-connect.php');

/*
This path is hardwired. The $folder variable is declared in looma-edited-video.php
*/
$path = '../content/' . $folder . '/';
$fileArr = array();
                                
                                
foreach (new DirectoryIterator($path) as $fileInfo)
{
    $file =  $fileInfo->getFilename();

    //DEBUG  echo "   found " . $file . "<br>";

    //skip ".", "..", and any ".filename" and any filename with '_thumb' in the name
    if (($file[0]  == ".") || strpos($file, "_thumb") || $file == "thumbnail.png") continue;  

    if ($fileInfo -> isFile())
    {
        $ext = $fileInfo -> getExtension();
        $file = $fileInfo -> getFilename();
        $base = trim($fileInfo -> getBasename($ext), ".");  //$base is filename w/o the file extension

        //If the file is a .txt file (used to store edited videos) it gives it the correct display name
        if(substr($file, strlen($file) - 4) == ".txt")
        {
            $dn = str_replace('_', ' ', substr($file, 0, strlen($file) - 8) . "_Edited");
        }
        else
        {
            // look in the database to see if this file has a DISPLAYNAME
            $query = array('fn' => $file);

            $projection = array('_id' => 0, 
                'dn' => 1, 
            );		
            $activity = $activities_collection -> findOne($query, $projection);

            $dn = ($activity && array_key_exists('dn', $activity)) ? $activity['dn'] : $base;
        }
                                
        switch (strtolower($ext))
        {
            case "video":
            case "mp4":
            case "mov":

            case "image":
            case "jpg":
            case "png":
            case "gif":

            case "audio":
            case "mp3":

            case "pdf":

            makeButton($file, $path, $ext, $base, $dn, $path . $base . "_thumb.jpg");
            break;

            case "txt":
                makeButton($file, $path, $ext, $base, $dn, $path . substr($base, 0, strlen($base) - 4) . "_thumb.jpg");
                break;

            default:
                // ignore unknown filetypes
                // echo "DEBUG: " . $fileInfo -> getFilename() . "unkown filetype in looma-library.php";
            };  //end SWITCH
    }
}
                        
?>