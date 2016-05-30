<!doctype html>
<!--
Name: Justin Cardozo
Email: justin.cardozo@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 06
Revision: Looma 2.0.0
File: contentNavigator.php
Description:  Interacts with Mongo to let the user select a collection to edit
-->

<?php
include ('includes/mongo-connect.php');
?>

<html lang="en">
<head>
  <title>Content Navigator</title>
</head>
<body>
 <h1>Edit Content</h1>
 <br />
 <?php

 if(!isset($_POST['collection']))
 {
  //This code handles the user experience before they have selected what kind of document they wish to edit
  echo"<form action='looma-admin-contentNavigator.php' method = 'post'>";
  echo"<p>Please select a collection to modify</p>";
  echo"<select name = 'collection'>";
  echo"  <option value = 'activities'>Activities</option>";
  echo"  <option value = 'chapters'>Chapters</option>";
  echo"  <option value = 'textbooks'>Textbooks</option>";
  echo"</select>";
  echo"<p align='left'><input type='submit' name='submit' value='Submit'></p>";
  echo"</form>";
}
else
{
  $collection = $_POST['collection'];
  if(!isset($_POST['class']) && !isset($_POST['subject']))
  {
    //Since all documents are associated with a textbook, this code lets the user select the relevant textbook
    $textbooks = $textbooks_collection -> find();
    $textbooks->sort(array('displayname' => 1));
    if($collection == "textbooks")
    {
      echo "<p>Please select the class and subject of the textbook you would like to edit</p>";
    }
    if($collection == "activities")
    {
      echo "<p>Please select the class and subject of the textbook which the activity is from</p>";
    }
    if($collection == "chapters")
    {
      echo "<p>Please select the class and subject of the textbook which the chapter is from</p>";
    }

    /**
    *If they are editing a textbook we want the user to be taken to the textbook editor page, otherwise
    *we want them to be able to select the relevant chapter for the document they wish to edit
    */
    if($collection == "textbooks")
    {
      echo "<form action = 'looma-admin-textbookEditor.php' method = 'post'>";
    }
    else
    {
      echo "<form action = 'looma-admin-contentNavigator.php' method = 'post'>";
    }
    echo "<select name = 'class'>";
    echo "<option value = 'class1'>Class 1</option>";
    echo "<option value = 'class2'>Class 2</option>";
    echo "<option value = 'class3'>Class 3</option>";
    echo "<option value = 'class4'>Class 4</option>";
    echo "<option value = 'class5'>Class 5</option>";
    echo "<option value = 'class6'>Class 6</option>";
    echo "<option value = 'class7'>Class 7</option>";
    echo "<option value = 'class8'>Class 8</option>";
    echo"</select>";

    echo "<select name = 'subject'>";
    echo "<option value = 'nepali'>Nepali</option>";
    echo "<option value = 'english'>English</option>";
    echo "<option value = 'math'>Math</option>";
    echo "<option value = 'science'>Science</option>";
    echo "<option value = 'social studies'>Social Studies</option>";
    echo "</select>";

    //We need to resend the collection secretly so that we don't get stuck in the first if statement because the collection isn't set
    echo"<input type = 'hidden' name =  'collection' value =  '$collection' />";
    echo "<p align = 'left'><input type = 'submit' name = 'submit' value = 'Submit'></p>";
    echo"</form>";
  }
  else
  {
    /**
    *If this page recieves the class and subject, then the user must be editing either a chapter or an activity, because
    *if they had been editing a textbook, the textbook editor would hae been called instead.
    *
    *Code in this section is handled accordingly
    */
    if(!isset($_POST['chapter']))
    {
      //Since all chapters and activities are associated with a chapter, we let the user select the relevant chapter
      $tb_c = $_POST['class'];
      $tb_s = $_POST['subject'];      
      $collectionName = $_POST['collection'];
      $query = array('class' => $tb_c, 'subject' => $tb_s);
      $chapters = $chapters_collection -> find($query);
      $chapters = $chapters -> sort(array("_id" => 1));
      $count = 0;
      foreach ($chapters as $ch)
      {
        $count = $count + 1;
      }

      //This handles the event that they select a class and subject combination that doesn't exist
      //In this case meaning that there are no chapters that have that class and subject
      if($count != 0)
      {
        if ($collectionName == 'chapters')
        {
         echo "<p>Please select the chapter you would like to edit</p>";
        }
        else if ($collectionName == 'activities')
        {
          echo "<p>Please select the chapter the activity is from</p>";
        }

        /**
        *If they are editing a chapter we want the user to be taken to the chapter editor page, otherwise
        *we want them to be able to select the relevant activity that they wish to edit
        */
        if ($collectionName == 'chapters')
        {
          echo "<form action='looma-admin-chapterEditor.php' method = 'post'>";
        }
        else if ($collectionName == 'activities')
        {
          echo "<form action='looma-admin-contentNavigator.php' method = 'post'>";
        }
        echo "<select name = 'chapter'>";
        $dn = "No Display Name";
        foreach ($chapters as $ch)
        {
          $ch_dn = array_key_exists('dn', $ch) ? $ch['dn'] : $dn;
          $ch_id = array_key_exists('_id', $ch) ? $ch['_id'] : $dn;
          if ($collectionName == 'chapters')
          {
            echo "<option value = '$ch_id'>$ch_id : $ch_dn</option>";
          }
          else if ($collectionName == 'activities')
          {
            echo "<option value = '$ch_id'>$ch_id : $ch_dn</option>";
          }
        }
        echo "</select>";
        /**We need to resend the collection, class, and subject secretly so that we don't get stuck with the program thinking
        *that the user hasn't selected a collection or relevant textbook
        */
        echo "<input type = 'hidden' name =  'collection' value =  '$collectionName' />";
        echo "<input type = 'hidden' name =  'class' value =  '$tb_c' />";
        echo "<input type = 'hidden' name =  'subject' value =  '$tb_s' />";
        echo "<p align='left'><input type='submit' name='submit' value='Submit'></p>";
        echo "</form>";
      }
      else
      {
         echo "<p>$tb_c doesn't have a textbook for $tb_s</p>";
      }
    }
    else
    {
      /**
      *If this page gets called with a chapter, then we know that the user is editing an activity, because if they were
      *editing a chapter then the chapter editor would have been called instead
      */
      $chapterId = $_POST['chapter'];
      $query = array('ch_id' => $chapterId);
      $activities = $activities_collection -> find($query);
      $activities = $activities -> sort(array("dn" => 1));
      $count = 0;
      foreach ($activities as $a)
      {
        $count = $count + 1;
      }

      //Handles the event that a chapter has no activities
      if($count != 0)
      {
        echo "<p>Please select the activity you would like to edit</p>";
        echo "<form action='looma-admin-activityEditor.php' method = 'post'>";
        echo "<select name = 'activity'>";
        $dn = "No Display Name";
        foreach ($activities as $a)
        {
          $a_id = array_key_exists('_id', $a) ? $a['_id'] : $dn;
          $a_dn = array_key_exists('dn', $a) ? $a['dn'] : $dn;
          echo "<option value = '$a_id'>$a_dn</option>";
        }
        echo "</select>";
        echo "<p align='left'><input type='submit' name='submit' value='Submit'></p>";
        echo "</form>";
      }
      else
      {
        echo "<p>This chapter has no activities</p>";
      }
    }
  }
}

?>
</body>
</html>