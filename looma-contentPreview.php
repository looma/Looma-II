<!--
Name: Ian Costello
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentPreview.php
Description: Loads a preview of a page given an id
-->
<?php
  //Get chapter lookup
  $db_id = $_GET['dbid'];

  //Connent to Mongo DB
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
  $lookupPath= get_include_lookup_path($ft, $fn);

  function get_include_lookup_path($ft, $fn) {
    switch ($ft) {
      case "video":
        video($fn, $ft, "content/videos/");
        break;
      case "mp4":
        video($fn, $ft, "content/videos/");
        break;
      case "mov":
        video($fn, $ft, "content/videos/");
        break;
      case "image":
        image($fn, $ft, "content/images/");
        break;
      case "jpg":
        image($fn, $ft, "content/images/");
        break;
      case "png":
        image($fn, $ft, "content/images/");
        break;
      case "gif":
        image($fn, $ft, "content/images/");
        break;
      case "audio":
        image($fn, $ft, "content/audio/");
        break;
      case "mp3":
        image($fn, $ft, "content/audio/");
        break;
      case "pdf":
        pdf ($fn, $ft, "content/pdfs/");
        break;
      case "EP":
        epaath($fn, $ft, "content/epaath/activities/");
        break;
      default:
        echo "unknown filetype " . $ft . "in activities.php";
        break;
    }
  }
  function video($fn, $ft, $fp) {
    $fileLocation = $fp . $fn;
    $source = '<source src="' . $fileLocation . '" type="video/' . $ft . '">';
    echo '<video width="100%" height="90%" controls>';
      echo $source;
    echo '</video>';
  }
  function image($fn, $ft, $fp) {
    $fileLocation = $fp . $fn;
    $source = '<img src="' . $fileLocation . '.' . $ft. '" style="height:100%;width:90%;">';
    echo $source;
  }
  function audio($fn, $ft, $fp) {
    $fileLocation = $fp . $fn;
    $source = '<source src="' . $fileLocation . '" type="audio/' . $ft . '">';
    echo '<audio controls>';
      echo $source;
    echo '</audio>';
  }
  function pdf($fn, $ft, $fp) {
    $fileLocation = $fp . $fn;
    $source = '<iframe src="' . $fileLocation . '" width="100%" height="90%">';
    echo $source;
  }
  function epaath($fn, $ft, $fp) {
    $fileLocation = $fp . $fn . "/index.html";
    $source = '<iframe id="epaathFrame" src="' . $fileLocation . '" width="100%" height="90%"></iframe>';
    echo $source;
    echo '<input type="button" onclick="window.open(\'' .  $fileLocation . '\')" value="Open In New Tab">';
  }
?>
