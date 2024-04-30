<!doctype html>
<!--
Filename: looma-lessons.php
Date: FEB 2024
Description: page for when there are >1 lessons for a chapter
-->


<?php  $page_title = 'Looma Lessons';
include ("includes/header.php");
require_once('includes/looma-utilities.php');
logPageHit('lessons');

?>

<body>
<!--<link href='css/looma-activities.css' rel='stylesheet' type='text/css'>
-->

<div id="main-container-horizontal" class='scroll'>
    <h1 class="title"> <?php keyword("Looma Lessons"); ?> </h1>
    <div class="center">
        <br>
        <?php
        //make buttons for timelines directory -- virtual folder, populated from histories collection in mongoDB
        global $activities_collection;
        $buttons = 1;
        $maxButtons = 3;

        echo "<table><tr>";

        $chapter = $_REQUEST['ch_id'];
        $query['ft'] = 'lesson';
        $query['ch_id'] = $chapter;
        $lessons = mongoFind($activities_collection, $query, null, null, null);

        $lessons = alphabetize_by_dn($lessons->toArray());

        foreach ($lessons as $lesson) {

            echo "<td>";
            $dn = $lesson['dn'];
            $ndn = isset($lesson['ndn']) ?  $lesson['ndn'] : "";
            $ft = "lesson";
            $thumb = "images/lesson.png";
            $id = $lesson['mongoID'];  //mongoID of the descriptor for this lesson
            makeActivityButton($ft, "", "", $dn, $ndn, $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);
            echo "</td>";
            $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";}

        } //end FOREACH lesson
        echo "</tr></table>";
        ?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-lessons.js"></script>
</body>
</html>
