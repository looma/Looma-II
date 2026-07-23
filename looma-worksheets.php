<!doctype html>
<!--
Name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2026 07 21
Revision: Looma 7
File: looma-worksheets.php

Description: worksheet opening page (modeled on looma-games.php). displays
             grade-level buttons; once a grade is chosen, displays subject
             buttons for the subjects that actually have worksheets. choosing
             a subject opens looma-worksheet-list.php?class=..&subject=..
-->

<?php $page_title = 'Worksheets Page';
require_once ('includes/header.php');
require_once ('includes/looma-utilities.php');
?>

<link rel="stylesheet" href="css/looma-home.css">
<link rel="stylesheet" href="css/looma-games.css">

</head>

<body>
<div id="main-container-horizontal">

    <h1 class="title"> <?php keyword("Worksheets"); ?> </h1>

    <?php
        function ws_classNumber($class) {
            if      ($class === 'class11') return 11;
            else if ($class === 'class12') return 12;
            else    return (int) substr($class, 5);
        };

        // selected grade (as 'classN') comes in on the URL
        $ws_class = isset($_REQUEST["class"]) ? $_REQUEST["class"] : '';

        $subjects = array(
            "english"        => "English",
            "nepali"         => "Nepali",
            "math"           => "Math",
            "science"        => "Science",
            "social studies" => "Social Studies",
            "serofero"       => "Serofero",
            "health"         => "Health",
            "vocational"     => "Vocational");

        // subjects whose button label is always shown in one language (not toggled by UI language)
        $nepali_only  = array('nepali', 'serofero');
        $english_only = array('english');
    ?>


    <!--  display CLASS (grade) buttons  -->
    <div id="classes" class="button-div">
        <?php
        for ($i = 1; $i <= 3; $i++) {
            $cls = 'class' . $i;
            $selected = ($ws_class === $cls) ? ' active' : '';
            echo "<button type='button' class='class$selected' id=$cls " .
                 "onclick=\"window.location.href='looma-worksheets.php?class=" . $cls . "';\">";
            echo "<div>"; keyword((string) $i); echo "</div>";
            echo "</button>";
        }
        ?>
    </div>


    <!--  display SUBJECT buttons (only after a grade is chosen)  -->
    <div id="subjects" class="button-div">
        <?php
        // only show subjects that actually have worksheets for this grade
        // (mirrors looma-games.php / looma-game-list.php: only show content that exists)
        if ($ws_class !== '') {

            $grade = ws_classNumber($ws_class);

            $subject_query = array(
                'ft'    => 'worksheet',
                'cl_lo' => array('$lte' => (int)$grade),
                'cl_hi' => array('$gte' => (int)$grade),
            );

            $subjects_with_worksheets = array();
            foreach (array($activities_collection, $local_activities_collection) as $coll) {
                foreach (mongoFind($coll, $subject_query, null, null, null) as $ws) {
                    if (! isset($ws['subject'])) continue;
                    $subj = $ws['subject'];
                    // subject may be a scalar, or an array / BSONArray of subjects
                    if (is_array($subj) || $subj instanceof Traversable) {
                        foreach ($subj as $s) $subjects_with_worksheets[(string)$s] = true;
                    } else {
                        $subjects_with_worksheets[(string)$subj] = true;
                    }
                }
            }

            foreach ($subjects as $subj_value => $subj_name) {
                if (! isset($subjects_with_worksheets[$subj_value])) continue;  // skip subjects with no worksheets
                $href = 'looma-worksheet-list.php?class=' . $ws_class .
                        '&subject=' . urlencode($subj_value);
                // formatted like the game-list subject buttons: class 'subject game' + an icon
                echo "<button type='button' class='subject game' " .
                     "onclick=\"window.location.href='" . $href . "';\">";
                echo "<div>";
                if (in_array($subj_value, $nepali_only, true))
                    echo (isset($TKW[$subj_name]) ? $TKW[$subj_name] : $subj_name);  // always Nepali
                else if (in_array($subj_value, $english_only, true))
                    echo $subj_name;  // always English
                else
                    keyword($subj_name);
                echo "</div>";
                echo "<img draggable='false' src='images/worksheet.png'>";
                echo "</button>";
            }
        }
        ?>
    </div>

</div>
<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

</body>
</html>
