<!doctype html>
<!--
Name: Justin Cardozo
Email: justin.cardozo@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 06
Revision: Looma 2.0.0
File: activityEditor.php
Description:  Creates a series of forms that allows the user to edit the activity
-->

<?php include ('includes/mongo-connect.php');
?>

<html lang="en">
<head>
  <title>Activities Editor</title>
</head>
<body>

  <?php
  if(!isset($_POST['edited']))
  {
   $activityId = $_POST['activity'];

   //Find the appropriate activity to edit via the id that was sent to this page
   $query = array('_id' => new MongoId($activityId));
   $activity = $activities_collection -> findOne($query);

   //A header to remind the user what activity they are editing
   $activityName = array_key_exists('displayname', $activity) ? $activity['displayname'] : null;
   echo "<h1>Edit <q>$activityName</h1></q>";

   echo "<form action='looma-admin-activityEditor.php' method = 'post' id = 'form'>";

   //A list of parameters that contains all the relevant information about the activity, and allows some content to be edited

   //The user is not allowed to change the id of the activity
   echo "<p>Id: $activityId</p>";
  //The id is sent over so that the data may be edited later on
   echo "<input type='hidden' name= '_id' value= '$activityId' />";

   $a_cid = array_key_exists('chapter_id', $activity) ? $activity['chapter_id'] : null;
   echo "<p><label>Chapter Id: <input type='text' name='chapter_id' id='chapter_id' size='40' maxlength='40' value = '$a_cid' /></label></p> ";

   $a_a = array_key_exists('affiliation', $activity) ? $activity['affiliation'] : null;
   echo "<p><label>Affiliation: <input type='text' name='affiliation' id='affiliation' size='40' maxlength='40' value = '$a_a' /></label></p> ";

   $a_ft = array_key_exists('filetype', $activity) ? $activity['filetype'] : null;
   echo "<p><label>File Type: <input type='text' name='filetype' id='filetype' size='40' maxlength='40' value = '$a_ft' /></label></p> ";

   $a_fp = array_key_exists('filepath', $activity) ? $activity['filepath'] : null;
   echo "<p><label>File Path: <input type='text' name='filepath' id='filepath' size='40' maxlength='40' value = '$a_fp' /></label></p> ";

   $a_mb = array_key_exists('MB', $activity) ? $activity['MB'] : null;
   echo "<p><label>MB: <input type='text' name='MB' id='MB' size='40' maxlength='40' value = '$a_mb' /></label></p> ";

   $a_min = array_key_exists('min', $activity) ? $activity['min'] : null;
   echo "<p><label>Min: <input type='text' name='min' id='min' size='40' maxlength='40' value = '$a_min' /></label></p> ";

   $a_fn = array_key_exists('filename', $activity) ? $activity['filename'] : null;
   echo "<p><label>File Name: <input type='text' name='filename' id='filename' size='40' maxlength='40' value = '$a_fn' /></label></p> ";

   $a_dn = array_key_exists('displayname', $activity) ? $activity['displayname'] : null;
   echo "<p><label>Display Name: <input type='text' name='displayname' id='displayname' size='40' maxlength='40' value = '$a_dn' /></label></p> ";

   echo "<input type = 'hidden' name =  'edited' value =  'edited'/>";

   echo "<p align='left'><input type='submit' name='submit' id = 'submit' value='Submit'></p>";
   echo "</form>";
 }
 else
 {
  //Find the proper activity to make the relevant changes to
  $activityId = $_POST['_id'];
  $query = array("_id" => new MongoId("$activityId"));
  $activity = $activities_collection -> findOne($query);

  //Makes the relevant changes that were asked for, updating fields to blank only if the fields already contained data before
  //This way blank spaces only become saved in the database if they were used to override false data
  //If we always updated blank spaces, our database would create new fields with empty data, which would waste space

  $activityChapterId = $_POST['chapter_id'];
  if(strlen($activityChapterId) != 0)
  {
    $newdata = array('$set' => array("chapter_id" => "$activityChapterId"));
    $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
    $activity = $activities_collection -> findOne($query);
    $activityChapterId = array_key_exists('chapter_id', $activity) ? $activity['chapter_id'] : null;
    echo "<p>The chapter id has been set to $activityChapterId</p>";
  }
  else
  {
    if(array_key_exists('chapter_id', $activity))
    {
      $newdata = array('$set' => array("chapter_id" => "$activityChapterId"));
      $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
      $activity = $activities_collection -> findOne($query);
      $activityChapterId = array_key_exists('chapter_id', $activity) ? $activity['chapter_id'] : null;
      echo "<p>The chapter id has been set to $activityChapterId</p>";
    }
  }

  $activityFileType = $_POST['filetype'];
  if(strlen($activityFileType) != 0)
  {
    $newdata = array('$set' => array("filetype" => "$activityFileType"));
    $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
    $activity = $activities_collection -> findOne($query);
    $activityFileType = array_key_exists('filetype', $activity) ? $activity['filetype'] : null;
    echo "<p> The file type has been set to $activityFileType</p>";
  }
  else
  {
    if(array_key_exists('filetype', $activity))
    {
     $newdata = array('$set' => array("filetype" => "$activityFileType"));
     $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
     $activity = $activities_collection -> findOne($query);
     $activityFileType = array_key_exists('filetype', $activity) ? $activity['filetype'] : null;
     echo "<p> The file type has been set to $activityFileType</p>";
   }
  }

   $activityFilePath = $_POST['filepath'];
   if(strlen($activityFilePath) != 0)
   {
    $newdata = array('$set' => array("filepath" => "$activityFilePath"));
    $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
    $activity = $activities_collection -> findOne($query);
    $activityFilePath = array_key_exists('filepath', $activity) ? $activity['filepath'] : null;
    echo "<p> The file path has been set to $activityFilePath</p>";
  }
  else
  {
    if(array_key_exists('filepath', $activity))
    {
      $newdata = array('$set' => array("filepath" => "$activityFilePath"));
      $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
      $activity = $activities_collection -> findOne($query);
      $activityFilePath = array_key_exists('filepath', $activity) ? $activity['filepath'] : null;
      echo "<p> The file path has been set to $activityFilePath</p>";
    }
  }

  $activityMB = $_POST['MB'];
  if(strlen($activityMB) != 0)
  {
    $newdata = array('$set' => array("MB" => "$activityMB"));
    $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
    $activity = $activities_collection -> findOne($query);
    $activityMB = array_key_exists('MB', $activity) ? $activity['MB'] : null;
    echo "<p> The MB has been set to $activityMB</p>";
  }
  else
  {
    if(array_key_exists('MB', $activity))
    {
      $newdata = array('$set' => array("MB" => "$activityMB"));
      $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
      $activity = $activities_collection -> findOne($query);
      $activityMB = array_key_exists('MB', $activity) ? $activity['MB'] : null;
      echo "<p> The MB has been set to $activityMB</p>";
    }
  }

  $activityMin = $_POST['min'];
  if(strlen($activityMin) != 0)
  {
    $newdata = array('$set' => array("min" => "$activityMin"));
    $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
    $activity = $activities_collection -> findOne($query);
    $activityMin = array_key_exists('min', $activity) ? $activity['min'] : null;
    echo "<p> The min has been set to $activityMin</p>";
  }
  else
  {
    if(array_key_exists('min', $activity))
    {
     $newdata = array('$set' => array("min" => "$activityMin"));
     $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
     $activity = $activities_collection -> findOne($query);
     $activityMin = array_key_exists('min', $activity) ? $activity['min'] : null;
     echo "<p> The min has been set to $activityMin</p>";
   }
  }

  $activityFileName = $_POST['filename'];
  if(strlen($activityFileName) != 0)
  {
    $newdata = array('$set' => array("filename" => "$activityFileName"));
    $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
    $activity = $activities_collection -> findOne($query);
    $activityFileName = array_key_exists('filename', $activity) ? $activity['filename'] : null;
    echo "<p> The file name has been set to $activityFileName</p>";
  }
  else
  {
    if(array_key_exists('filename', $activity))
    {
     $newdata = array('$set' => array("filename" => "$activityFileName"));
     $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
     $activity = $activities_collection -> findOne($query);
     $activityFileName = array_key_exists('filename', $activity) ? $activity['filename'] : null;
     echo "<p> The file name has been set to $activityFileName</p>";
   }
  }

  $activityName = $_POST['displayname'];
  if(strlen($activityName) != 0)
  {
    $newdata = array('$set' => array("displayname" => "$activityName"));
    $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
    $activity = $activities_collection -> findOne($query);
    $activityName = array_key_exists('displayname', $activity) ? $activity['displayname'] : null;
    echo "<p>The displayname has been set to $activityName</p>";
  }
  else
  {
    if(array_key_exists('displayname', $activity))
    {
      $newdata = array('$set' => array("displayname" => "$activityName"));
      $activities_collection->update(array("_id" => new MongoId("$activityId")), $newdata);
      $activity = $activities_collection -> findOne($query);
      $activityName = array_key_exists('displayname', $activity) ? $activity['displayname'] : null;
      echo "<p>The displayname has been set to $activityName</p>";
    }
  }
}
?>

<!--These files are designed to make sure that the changes made are valid-->
   	<?php include ('includes/js-includes.php'); ?>   	   		
<script src="js/looma-dictionary-handler.js"></script>


</body>
</html>