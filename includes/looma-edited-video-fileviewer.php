<!--
Name: Aaron, Connor, Ryan

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 1.0
File: looma-edited-video-fileviewer.php
Description: Accesses files for the video editor. Mainly copied from looma-library.php
-->

<?php
//include ('includes/mongo-connect.php');

/*
This path is hardwired. The $folder variable is declared in looma-edited-video.php
*/

$path = '../content/' . $folder . '/';

$fileArr = array();


   /*     function makeButton($file, $path, $ext, $base, $dn, $thumb)
        {
            // Copied from looma library
            //DEBUG   echo "making button with path= $path  file= $file   ext= $ext"; //DEBUG

            // ignore edited videos which are txt files
            if ($ext != "txt")
            {

            echo "<button class='activity play img'
                          data-fn='" .  $file .
                       "' data-fp='" .  $path .
                       "' data-ft='" .  $ext .
                       "' data-zm='" .  160 .
                       "' data-pg='1" .
                       //If the file is a .txt file (used to store edited videos) it pulls the information from the file
                       "' data-txt='" . ($ext == "txt" ? getJSON($file, $path, $ext) : null) .
                                    "'>";

            //text and tooltip for BUTTON
            echo "<span class='displayname'
                        class='btn btn-default'
                        data-toggle='tooltip'
                        data-placement='top'
                        title='" . $file . "'>" .
                  "<img src='" . $thumb . "'>" .
                                 $dn . "</span>";

            //finish BUTTON
            echo "</button>";

            }

        };  //end makeButton()
*/
    //echo "DEBUG (evi fileviewer)   looking in " . $path . "<br>";

foreach (new DirectoryIterator($path) as $fileInfo)
{
    $file =  $fileInfo->getFilename();

    //echo "DEBUG (evi fileviewer)   found " . $file . "<br>";

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

            $dn = ($activity && isset($activity['dn'])) ? $activity['dn'] : $base;
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

             //use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $ole_id, $url, $pg, $zoom)
              makeActivityButton($ext, $path, $file, $dn, "",$base . "_thumb.jpg", "", "", "", "", "", "", "", "") ;
              //makeButton($file, $path, $ext, $base, $dn, $path . $base . "_thumb.jpg");
            break;

            case "txt":
                //use makeActivityButton($ft, $fp, $fn, $dn, $ndn, $thumb, $ch_id, $mongo_id, $url, $pg, $zoom)
                //makeButton($file, $path, $ext, $base, $dn, "", $path . substr($base, 0, strlen($base) - 4) . "_thumb.jpg");
                break;

            default:
                // ignore unknown filetypes
                // echo "DEBUG: " . $fileInfo -> getFilename() . "unkown filetype in looma-library.php";
            }  //end SWITCH
    }
}

?>
