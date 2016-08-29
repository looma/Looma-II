<!--
Name: Ian Costello, modified by Thomas Woodside
Email: ian.costello@menloschool.org, thomas.woodside@gmail.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-slideshow-contentPreview.php
Description: Loads a preview of a page given an id

Edited by Thomas Woodside for use in Looma Picture Player
-->
<?php
  function previewfromPHP($db_id) {
    $m = new MongoClient();
    $fileDB = $m->looma;
    $activities = $fileDB -> activities;

    //Create Query For Activity
    $query = array('_id' => new MongoId($db_id));
    //Only Get File Type and Filename
    $projection = array(
        'ft' => 1,
        'fn' => 1,
    );

    $activity = $activities->findOne($query, $projection);

    $ft = $activity['ft'];
    $fn = $activity['fn'];
    get_include_lookup_path($ft, $fn);
  }

  function get_include_lookup_path($ft, $fn) {
    switch ($ft) {
      case "image":
        image($fn, $ft, "../content/pictures/");
        break;
      case "jpg":
        image($fn, $ft, "../content/pictures/");
        break;
      case "png":
        image($fn, $ft, "../content/pictures/");
        break;
      case "gif":
        image($fn, $ft, "../content/pictures/");
        break;
      default:
        echo "unknown filetype " . $ft . "in activities.php";
        break;
    }
  }
  function image($fn, $ft, $fp) {
    $fn = thumbnail($fp, $fn);
      $fileLocation = $fp . $fn;
    $source = '<li class="img-thumbnail"><img src="' . $fileLocation . '" style="height:auto;width:90%;" data-fp="' . $fileLocation . '"></li>';
    echo $source;
  }
function thumbnail ($fp, $fn) {
  //given a CONTENT filename, generate the corresponding THUMBNAIL filename
  //find the last '.' in the filename, insert '_thumb.jpg' after the dot
  //returns "" if no '.' found
  //example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS

  $dot = strrpos($fn, ".");
  if ( ! ($dot === false)) {
      $thumbnailfn =  substr_replace($fn, "_thumb.jpg", $dot, 10);
      if (file_exists($fp . $thumbnailfn)) {
          return $thumbnailfn;
      }
      else {
          return $fn;
      }
  }
  else {
      if (file_exists($fn . "_thumb.jpg")) {
          return $fn . "_thumb.jpg";
      } else {
          return $fn;
      }

  }
} //end function THUMBNAIL
?>
