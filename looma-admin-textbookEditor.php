<!doctype html>
<!--
Name: Justin Cardozo
Email: justin.cardozo@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 06
Revision: Looma 2.0.0
File: textbookEditor.php
Description:  Creates a series of forms that allows the user to edit the textbook
-->

<?php include ('includes/mongo-connect.php');
?>

<html lang="en">
  <head>
    <title>Textbook Editor</title>
  </head>
  <body>

<?php
  if(!isset($_POST['edited']))
  {
  	$t_c = $_POST['class'];
    $t_s = $_POST['subject'];

    //Find the appropriate texbook to edit via the class and subject that were sent to this page
    $query = array('class' => $t_c, 'subject' => $t_s);
    $textbook = $textbooks_collection -> findOne($query);

    //A header to remind the user what textbook they are editing
    $textbookName = array_key_exists('displayname', $textbook) ? $textbook['displayname'] : null; 

    echo "<h1>Edit $textbookName</h1>";

    echo "<form action = 'looma-admin-textbookEditor.php' method = 'post' id = 'form'>";

    //A list of parameters that contains all the relevant information about the textbook, and allows some content to be edited

    //The user is not allowed to change the id, class, or subject of the textbook

    $t_id = array_key_exists('_id', $textbook) ? $textbook['_id'] : null;
    echo "<p>Id: $t_id</p>";
    echo "<input type = 'hidden' name= '_id' value = '$t_id' />";

    echo "<p>Class: $t_c</p>";

    echo "<p>Subject: $t_s</p>";

    echo "<p><label>Display Name: <input type = 'text' name='displayname' id ='displayname' size = '40' maxlength = '40' value = '$textbookName' /></label></p> ";

    $t_fn = array_key_exists('filename', $textbook) ? $textbook['filename'] : null;
    echo "<p><label>File Name: <input type = 'text' name='filename' id ='filename' size = '40' maxlength = '40' value = '$t_fn' /></label></p> ";

    $t_fp = array_key_exists('filepath', $textbook) ? $textbook['filepath'] : null;
    echo "<p><label>File Path: <input type = 'text' name='filepath' id ='filepath' size = '40' maxlength = '40' value = '$t_fp' /></label></p> ";

    $t_nfn = array_key_exists('nativefilename', $textbook) ? $textbook['nativefilename'] : null;
    echo "<p><label>Native File Name: <input type = 'text' name = 'nativefilename' id = 'nativefilename' size = '40' maxlength = '40' value = '$t_nfn' /></label></p> ";

    $t_ndn = array_key_exists('nativedisplayname', $textbook) ? $textbook['nativedisplayname'] : null;
    echo "<p><label>Native Display Name: <input type = 'text' name = 'nativedisplayname' id = 'nativedisplayname' size = '40' maxlength = '40' value = '$t_ndn' /></label></p> ";

    echo "<input type = 'hidden' name =  'edited' value =  'edited'/>";

    echo "<p align = 'left'><input type = 'submit' name = 'submit' id = 'submit' value = 'Submit'></p>";
    echo "</form>";
  }
  else
  {
    //Find the proper chapter to make the relevant changes to
    $textbookId = $_POST['_id'];
    $query = array("_id" => new MongoId("$textbookId"));
    $textbook = $textbooks_collection -> findOne($query);

    //Makes the relevant changes that were asked for, updating fields to blank only if the fields already contained data before
    //This way blank spaces only become saved in the database if they were used to override false data
    //If we always updated blank spaces, our database would create new fields with empty data, which would waste space

    $textbookName = $_POST['displayname'];
    if(strlen($textbookName) != 0)
    {
      $newdata = array('$set' => array("displayname" => "$textbookName"));
      $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
      $textbook = $textbooks_collection -> findOne($query);
      $textbookName = array_key_exists('displayname', $textbook) ? $textbook['displayname'] : null;
      echo "<p>The displayname has been set to $textbookName</p>";
    }
    else
    {
      if(array_key_exists('displayname', $textbook))
      {
       $newdata = array('$set' => array("displayname" => "$textbookName"));
       $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
       $textbook = $textbooks_collection -> findOne($query);
       $textbookName = array_key_exists('displayname', $textbook) ? $textbook['displayname'] : null;
       echo "<p>The displayname has been set to $textbookName</p>";
      }
    }

    $textbookFileName = $_POST['filename'];
    if(strlen($textbookFileName) != 0)
    {
      $newdata = array('$set' => array("filename" => "$textbookFileName"));
      $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
      $textbook = $textbooks_collection -> findOne($query);
      $textbookFileName = array_key_exists('filename', $textbook) ? $textbook['filename'] : null;
      echo "<p> The file name has been set to $textbookFileName</p>";
    }
    else
    {
      if(array_key_exists('filename', $textbook))
      {
        $newdata = array('$set' => array("filename" => "$textbookFileName"));
        $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
        $textbook = $textbooks_collection -> findOne($query);
        $textbookFileName = array_key_exists('filename', $textbook) ? $textbook['filename'] : null;
        echo "<p> The file name has been set to $textbookFileName</p>";
      }
    }

    $textbookFilePath = $_POST['filepath'];
    if(strlen($textbookFilePath) != 0)
    {
      $newdata = array('$set' => array("filepath" => "$textbookFilePath"));
      $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
      $textbook = $textbooks_collection -> findOne($query);
      $textbookFilePath = array_key_exists('filepath', $textbook) ? $textbook['filepath'] : null;
      echo "<p> The file path has been set to $textbookFilePath</p>";
    }
    else
    {
      if(array_key_exists('filepath', $textbook))
      {
        $newdata = array('$set' => array("filepath" => "$textbookFilePath"));
        $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
        $textbook = $textbooks_collection -> findOne($query);
        $textbookFilePath = array_key_exists('filepath', $textbook) ? $textbook['filepath'] : null;
        echo "<p> The file path has been set to $textbookFilePath</p>";
      }
    }

    $textbookNativeFileName = $_POST['nativefilename'];
    if(strlen($textbookNativeFileName) != 0)
    {
      $newdata = array('$set' => array("nativefilename" => "$textbookNativeFileName"));
      $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
      $textbook = $textbooks_collection -> findOne($query);
      $textbookNativeFileName = array_key_exists('nativefilename', $textbook) ? $textbook['nativefilename'] : null;
      echo "<p> The native file name has been set to $textbookNativeFileName</p>";
    }
    else
    {
      if(array_key_exists('nativefilename', $textbook))
      {
        $newdata = array('$set' => array("nativefilename" => "$textbookNativeFileName"));
        $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
        $textbook = $textbooks_collection -> findOne($query);
        $textbookNativeFileName = array_key_exists('nativefilename', $textbook) ? $textbook['nativefilename'] : null;
        echo "<p> The native file name has been set to $textbookNativeFileName</p>";
      }
    }

    $textbookNativeDisplayName = $_POST['nativedisplayname'];
    if(strlen($textbookNativeDisplayName) != 0)
    {
      $newdata = array('$set' => array("nativedisplayname" => "$textbookNativeDisplayName"));
      $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
      $textbook = $textbooks_collection -> findOne($query);
      $textbookNativeDisplayName = array_key_exists('nativedisplayname', $textbook) ? $textbook['nativedisplayname'] : null;
      echo "<p> The native file path has been set to $textbookNativeDisplayName</p>";
    }
    else
    {
      if(array_key_exists('nativedisplayname', $textbook))
      {
        $newdata = array('$set' => array("nativedisplayname" => "$textbookNativeDisplayName"));
        $textbooks_collection->update(array("_id" => new MongoId("$textbookId")), $newdata);
        $textbook = $textbooks_collection -> findOne($query);
        $textbookNativeDisplayName = array_key_exists('nativedisplayname', $textbook) ? $textbook['nativedisplayname'] : null;
        echo "<p> The native file path has been set to $textbookNativeDisplayName</p>";
      }
    }
  }
?>

<!--These files are designed to make sure that the changes made are valid-->
   	<?php include ('includes/js-includes.php'); ?>   	   		
<script src="js/looma-dictionary-handler.js"></script>

</body>
</html>