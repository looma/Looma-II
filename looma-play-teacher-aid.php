<!doctype html>
<!--
LOOMA php code file
Filename: looma-play-teacher-aid.php
Description: display Teacher Aid (text) files

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: FEB 2025
Revision:

Comments:
-->

<?php $page_title = 'Looma - Teacher Aid';
include ('includes/header.php');
include ('includes/looma-utilities.php');

?>

<link rel="stylesheet" href="css/looma.css">
<link rel="stylesheet" href="css/looma-play-teacher-aid.css">

</head>

<body>
<div id="main-container-horizontal">
    <?php
    if ( ! isset($_REQUEST['type']) || ! isset($_REQUEST['ch_id']))
    {
      //  echo "<div><img src='images/logos/looma-english-amanda 3x1.png' alt='Looma Logo'/></div>";
        echo "<h2>file not found</h2>";
    }
    else {
        $type = ($_REQUEST['type']);
        $ch_id = ($_REQUEST['ch_id']);

      //  echo "<div id='fullscreen'>";
 /*       if ($type === 'keywords') {

                NOTE: should reformat 'keywords' file from JSON to lines with <fieldname> ":" <tab> <value>
                like "word:   boy
                      nepali:
                      definition:   young male human"
                then display this in the $contents

        } else {  // other types (summary, outline, plan)
*/
            $class = ch_idToClass($ch_id);
            $subject = ch_idToSubject($ch_id);
            $fp = "../content/chapters/$class/$subject/en/$ch_id.$type";
            $contents = file_get_contents($fp);

            if ($type === "keywords") {
                $temp = "";
                $keywords = json_decode($contents, true);
                foreach($keywords as $keyword) {
                    $temp .= "English:    " . $keyword['en'] . "\n";
                    $temp .= "Nepali:     " . $keyword['np'] . "\n";
                    $temp .= "Definition: " . $keyword['def'] . "\n\n";
                    //echo $temp;
                    };
                $contents = $temp;
            }
            else if ($type === "outline") {}
            else if ($type === "plan") {}
            else if ($type === "quiz") {};

            echo "<div class='text-display'>";
            echo "<pre>" . $contents . "</pre>";
            echo "</div>";
     //   };
      //  echo "</div>";
    }
    ?>

</div>

<?php
include ('includes/toolbar.php');
include ('includes/js-includes.php');
?>
<script src="js/looma-play-teacher-aid.js"></script>
</body>
<?php
