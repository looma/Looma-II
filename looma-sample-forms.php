<!doctype html>
<!--
Name: Justin Cardozo
Email: justin.cardozo@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 06
Revision: Looma 2.0.0
File: chapterEditor.php
Description:  Creates a series of forms that allows the user to edit the chapter
-->

<?php include ('includes/mongo-connect.php');
?>

<html lang="en">
<head>
  <title>Chapters Editor</title>
</head>
<body>

  <?php
  function keyIsSet($key, $array) { return isset($array[$key]);} //compatibility shiv for php 5.x "keyIsSet()"

  if(!isset($_POST['edited']))
  {
    $chapterId = $_POST['chapter'];

    //Find the appropriate chapter to edit via the id that was sent to this page
    $query = array('_id' => $chapterId);
    $chapter = mongoFindOne($chapters_collection, $query);

    //A header to remind the user what chapter they are editing
    $chapterName = keyIsSet('displayname', $chapter) ? $chapter['displayname'] : null;

    echo "<h1>Edit <q>$chapterName</h1></q>";

    echo "<form action='looma-sample-forms.php' method = 'post' id = 'form'>";

    //A list of parameters that contains all the relevant information about the chapter, and allows some content to be edited

    //The user is not allowed to change the id, class, or subject of the chapter
    echo "<p>Id: $chapterId</p>";
    //The id is sent over so that the data may be edited later on
    echo "<input type = 'hidden' name= '_id' value = '$chapterId' />";

    $c_c =  keyIsSet('class', $chapter) ? $chapter['class'] : null;
    echo "<p>Class: $c_c</p>";

    $c_s =  keyIsSet('subject', $chapter) ? $chapter['subject'] : null;
    echo "<p>Subject: $c_s</p>";

    $c_dn = keyIsSet('displayname', $chapter) ? $chapter['displayname'] : null;
    echo "<p><label>Display Name: <input type = 'text' name = 'displayname' id = 'displayname' size = '40' maxlength = '40' value = '$c_dn' /></label></p> ";

    $c_ndn = keyIsSet('nativedisplayname', $chapter) ? $chapter['nativedisplayname'] : null;
    echo "<p><label>Native Display Name: <input type = 'text' name = 'nativedisplayname' id = 'nativedisplayname' size = '40' maxlength = '40' value = '$c_ndn' /></label></p> ";

    $c_pn = keyIsSet('pagenum', $chapter) ? $chapter['pagenum'] : null;
    echo "<p><label>Page Number: <input type = 'text' name = 'pagenum' id = 'pagenum' size = '40' maxlength = '40' value = '$c_pn' /></label></p> ";

    $c_npn = keyIsSet('nativepagenum', $chapter) ? $chapter['nativepagenum'] : null;
    echo "<p><label>Native Page Number: <input type = 'text' name = 'nativepagenum' id = 'nativepagenum' size = '40' maxlength = '40' value = '$c_npn' /></label></p> ";

    echo "<input type = 'hidden' name =  'edited' value =  'edited'/>";

    echo "<p align = 'left'><input type = 'submit' name = 'submit' id = 'submit' value = 'Submit'></p>";
    echo "</form>";
  }
  else
  {
    //Find the proper chapter to make the relevant changes to
    $chapterId = $_POST['_id'];
    $query = array("_id" => "$chapterId");
    $chapter = mongoFindOne($chapters_collection, $query);

    //Makes the relevant changes that were asked for, updating fields to blank only if the fields already contained data before
    //This way blank spaces only become saved in the database if they were used to override false data
    //If we always updated blank spaces, our database would create new fields with empty data, which would waste space


    $chapterName = $_POST['displayname'];
    if(strlen($chapterName) != 0)
    {
      $newdata = array('$set' => array("displayname" => "$chapterName"));
      mongoUpdate($chapters_collection, array("_id" => "$chapterId"), $newdata);
      $chapter = mongoFindOne($chapters_collection, $query);
      $chapterName = keyIsSet('displayname', $chapter) ? $chapter['displayname'] : null;
      echo "<p>The displayname has been set to $chapterName</p>";
    }
    else
    {
      if(keyIsSet('displayname', $chapter))
      {
        $newdata = array('$set' => array("displayname" => "$chapterName"));
        mongoUpdate($chapters_collection-, array("_id" => "$chapterId"), $newdata);
        $chapter = mongoFindOne($chapters_collection, $query);
        $chapterName = keyIsSet('displayname', $chapter) ? $chapter['displayname'] : null;
        echo "<p>The displayname has been set to $chapterName</p>";
      }
    }

    $chapterNativeDisplayName = $_POST['nativedisplayname'];
    if(strlen($chapterNativeDisplayName) != 0)
    {
      $newdata = array('$set' => array("nativedisplayname" => "$chapterNativeDisplayName"));
      mongoUpdate($chapters_collection, array("_id" => "$chapterId"), $newdata);
      $chapter = mongoFindOne($chapters_collection, $query);
      $chapterNativeDisplayName = keyIsSet('nativedisplayname', $chapter) ? $chapter['nativedisplayname'] : null;
      echo "<p> The native display name has been set to $chapterNativeDisplayName</p>";
    }
    else
    {
      if(keyIsSet('nativedisplayname', $chapter))
      {
        $newdata = array('$set' => array("nativedisplayname" => "$chapterNativeDisplayName"));
        mongoUpdate($chapters_collection, array("_id" => "$chapterId"), $newdata);
        $chapter = mongoFindOne($chapters_collection, $query);
        $chapterNativeDisplayName = keyIsSet('nativedisplayname', $chapter) ? $chapter['nativedisplayname'] : null;
        echo "<p> The native display name has been set to $chapterNativeDisplayName</p>";
      }
    }

    $pageNum = $_POST['pagenum'];
    if(strlen($pageNum) != 0)
    {
      $newdata = array('$set' => array("pagenum" => "$pageNum"));
      mongoUpdate($chapters_collection, array("_id" => "$chapterId"), $newdata);
      $chapter = mongoFindOne($chapters_collection, $query);
      $pageNum = keyIsSet('pagenum', $chapter) ? $chapter['pagenum'] : null;
      echo "<p> The page number has been set to $pageNum</p>";
    }
    else
    {
      if(keyIsSet('pagenum', $chapter))
      {
        $newdata = array('$set' => array("pagenum" => "$pageNum"));
        mongoUpdate($chapters_collection, array("_id" => "$chapterId"), $newdata);
        $chapter = mongoFindOne($chapters_collection, $query);
        $pageNum = keyIsSet('pagenum', $chapter) ? $chapter['pagenum'] : null;
        echo "<p> The page number has been set to $pageNum</p>";
      }
    }

    $chapterNativePageNum = $_POST['nativepagenum'];
    if(strlen($chapterNativePageNum) != 0)
    {
      $newdata = array('$set' => array("nativepagenum" => "$chapterNativePageNum"));
      mongoUpdate($chapters_collection, array("_id" => "$chapterId"), $newdata);
      $chapter = mongoFindOne($chapters_collection, $query);
      $chapterNativePageNum = keyIsSet('nativepagenum', $chapter) ? $chapter['nativepagenum'] : null;
      echo "<p> The native page number has been set to $chapterNativePageNum</p>";
    }
    else
    {
      if(keyIsSet('nativepagenum', $chapter))
      {
       $newdata = array('$set' => array("nativepagenum" => "$chapterNativePageNum"));
       mongoUpdate($chapters_collection, array("_id" => "$chapterId"), $newdata);
       $chapter = mongoFindOne($chapters_collection, $query);
       $chapterNativePageNum = keyIsSet('nativepagenum', $chapter) ? $chapter['nativepagenum'] : null;
       echo "<p> The native page number has been set to $chapterNativePageNum</p>";
     }
   }

 }
 ?>

 <!--These files are designed to make sure that the changes made are valid-->
   	<?php include ('includes/js-includes.php'); ?>
 <script src="js/looma-dictionary-handler.js"></script>

</body>
</html>
