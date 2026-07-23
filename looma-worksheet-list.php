<!doctype html>
<!--
Filename: looma-worksheet-list.php
Date: 2026 07 21

Author: Skip
Owner:  VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 7

Description: worksheet listing page (modeled on looma-game-list.php). given a
             grade (class) and subject, lists the matching worksheets
             (ft='worksheet') as playable buttons, opened like PDFs by
             LOOMA.playMedia(). the grade/subject are chosen on looma-worksheets.php.
-->

<?php $page_title = 'Looma Worksheet List';
require_once ('includes/header.php');
require_once ('includes/looma-utilities.php');
?>

<link rel="stylesheet" href="css/looma-game-list.css">

</head>

<body>
<div id="main-container-horizontal">
    <div id="fullscreen">

        <?php

            function ws_classNumber($class) {
                if      ($class === 'class11') return 11;
                else if ($class === 'class12') return 12;
                else    return (int) substr($class, 5);
            };

            $ws_class   = $_REQUEST["class"];   $class_name = substr_replace($ws_class, ' ', 5, 0);
            $ws_subject = $_REQUEST["subject"];

            $subject_names = array(
                "english"        => "English",
                "nepali"         => "Nepali",
                "math"           => "Math",
                "science"        => "Science",
                "social studies" => "Social Studies",
                "serofero"       => "Serofero",
                "health"         => "Health",
                "vocational"     => "Vocational");
            $subject_name = isset($subject_names[$ws_subject]) ? $subject_names[$ws_subject] : ucfirst($ws_subject);

            // subjects whose label is always shown in one language (not toggled by UI language)
            $nepali_only  = array('nepali', 'serofero');
            $english_only = array('english');

            echo '<div class="title"><h1>';
                keyword('Worksheets'); echo ' ';
                keyword('for'); echo ' ';
                keyword(ucfirst($class_name)); echo ' ';
                if (in_array($ws_subject, $nepali_only, true))
                    echo (isset($TKW[$subject_name]) ? $TKW[$subject_name] : $subject_name);  // always Nepali
                else if (in_array($ws_subject, $english_only, true))
                    echo $subject_name;  // always English
                else
                    keyword($subject_name);
            echo '</h1></div>';

            // worksheets are activities with ft='worksheet'.
            // match grade range (cl_lo/cl_hi) and subject, mirroring looma-game-list.php.
            $grade = ws_classNumber($ws_class);
            $query = array(
                'ft'      => 'worksheet',
                'subject' => $ws_subject,
                'cl_lo'   => array('$lte' => (int)$grade),
                'cl_hi'   => array('$gte' => (int)$grade),
            );

            echo '<div id="buttons">';

            $worksheets      = mongoFind($activities_collection,       $query, null, null, null);
            $localWorksheets = mongoFind($local_activities_collection, $query, null, null, null);

            $found = false;
            foreach (array(array($worksheets, 'looma'), array($localWorksheets, 'loomalocal')) as $pair) {
                $cursor = $pair[0];
                $db = $pair[1];
                foreach ($cursor as $ws) {
                    $found = true;

                    $dn  = isset($ws['dn'])  ? $ws['dn']  : (isset($ws['fn']) ? $ws['fn'] : '');
                    $ndn = isset($ws['ndn']) ? $ws['ndn'] : null;
                    $fn  = isset($ws['fn'])  ? $ws['fn']  : '';
                    $fp  = isset($ws['fp'])  ? $ws['fp']  : '../content/worksheets/';

                    echo '<button class="activity play img worksheet" onclick="LOOMA.playMedia(this);"' .
                        ' data-ft="worksheet"' .
                        ' data-db="' . $db . '"' .
                        ' data-mongoid="' . (string) $ws['_id'] . '"' .
                        ' data-fn="' . htmlspecialchars($fn, ENT_QUOTES) . '"' .
                        ' data-fp="' . htmlspecialchars($fp, ENT_QUOTES) . '"' .
                        ' data-dn="' . htmlspecialchars($dn, ENT_QUOTES) . '"';
                    if (isset($ws['ndn'])) echo ' data-ndn="' . htmlspecialchars($ndn, ENT_QUOTES) . '"';
                    if (isset($ws['zoom'])) echo ' data-zoom="' . htmlspecialchars($ws['zoom'], ENT_QUOTES) . '"';
                    if (isset($ws['pn']))   echo ' data-page="' . (int)$ws['pn'] . '"';
                    if (isset($ws['len']))  echo ' data-len="' . (int)$ws['len'] . '"';
                    echo '>';

                    // file-specific thumbnail (<fp><filename>_thumb.jpg). build the path
                    // directly (do NOT use thumbnail()'s server-side file_exists(), since
                    // content may be served remotely). let the browser load it and fall
                    // back via onerror: _thumb.jpg -> _thumb.JPG -> hide the image.
                    $dot  = $fn ? strrpos($fn, ".") : false;
                    $base = ($dot !== false) ? substr($fn, 0, $dot) : $fn;
                    if ($base !== '') {
                        $thumbJpg = htmlspecialchars($fp . $base . "_thumb.jpg", ENT_QUOTES);
                        $thumbJPG = htmlspecialchars($fp . $base . "_thumb.JPG", ENT_QUOTES);
                        echo '<img alt="" loading="lazy" draggable="false" src="' . $thumbJpg . '"' .
                             ' data-alt="' . $thumbJPG . '"' .
                             ' onerror="if(this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt=\'\';}else{this.style.display=\'none\';}">';
                    }

                    echo '<p>';
                    displayName(null, $dn, $ndn, language(), 'black');
                    echo '</p>';

                    $tip = $dn ? $dn : $ndn;
                    if ($tip) echo "<span class='tip yes-show big-show'>" . htmlspecialchars($tip, ENT_QUOTES) . "</span>";

                    // generic worksheet icon in the .icon (corner overlay) position
                    echo '<img class="icon" src="images/worksheet.png">';
                    echo '</button>';
                }
            }

            if (! $found) {
                echo '<p class="no-worksheets">';
                keyword('No worksheets found');
                echo '</p>';
            }

            echo '</div>';
        ?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>

</body>
</html>