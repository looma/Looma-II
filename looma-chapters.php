<!doctype html>
<!--
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 10, MAR 2020
Revision: Looma 2.0.0
File: looma-chapters.php
Description:  displays for a textbook (class/subject)
    a list of chapters (en and np) and a lesson button and an activities button for each chapter if it has them
-->

<?php $page_title = 'Looma Chapters';
include ('includes/header.php');
require_once('includes/looma-utilities.php');
    logUserActivity();
    logPageHit('chapters');
    looma_trace_page('chapters', [
        'class'   => $_GET['class']   ?? null,
        'grade'   => $_GET['grade']   ?? null,
        'subject' => $_GET['subject'] ?? null,
        'prefix'  => $_GET['prefix']  ?? null,
    ]);
?>
    <link rel="stylesheet" href="css/looma-chapters.css">
</head>

<body>

<?php

$class = trim($_GET['class']);  //from MONGO - format is "class1", "class2", etc
$grade = trim($_GET['grade']);  // display name of $class - format is "Grade 1", etc
$subject = trim($_GET['subject']) ;
$prefix = trim($_GET['prefix']) ;

/* A chapter may exist as a PDF, as an HTML page, or as BOTH — and when both are
 * there the HTML WINS: it is the readable, searchable copy generated from the
 * PDF. PDFs open in the PDF viewer (the historical default); an HTML chapter
 * opens in the HTML viewer instead. Given the chapter folder and the base name(s) the file
 * could have (en: "5EN14"; np: "7S01-nepali" then "7S01"), return the ".html"
 * filename if one exists on disk, or null when the chapter is a PDF. The folder
 * layout mirrors what LOOMA.playMedia() builds for PDFs:
 *   ../content/chapters/{Class}/{Subject}/{en|np}/{base}.{html|pdf}
 */
function looma_chapter_html($dir, $bases) {
    foreach ($bases as $b) {
        if (is_file($dir . $b . '.html')) return $b . '.html';
    }
    return null;
}

//show PAGE TITLE = "Chapters for Grade n Subject"

if ($subject === "social studies") $caps = "Social Studies and Human Value Education";
else if ($subject === 'math')      $caps = "Mathematics";
else if ($subject === 'health')      $caps = "Health, Physical and Creative Art";
else                               $caps = ucfirst($subject);


//get a textbook record for this CLASS and SUBJECT
$query = array('class' => $class, 'subject' => $subject, 'prefix' => $prefix);
//$tb = $textbooks_collection -> findOne($query);
$tb = mongoFindOne($textbooks_collection, $query);

    $tb_dn = keyIsSet('dn', $tb) ? $tb['dn'] : null;		//dn is textbook displayname
    $tb_fn = keyIsSet('fn', $tb) ? $tb['fn'] : null;		//fn is textbook filename
    $tb_fp = keyIsSet('fp', $tb) ? $tb['fp'] : null;		//fp is textbook filepath
    $tb_fp = "../content/" . $tb_fp;
    $tb_nfn = keyIsSet('nfn', $tb) ? $tb['nfn'] : null;	//nfn is textbook native filename
    $tb_ndn = keyIsSet('ndn', $tb) ? $tb['ndn'] : null;		//dn is textbook displayname
    $prefix = keyIsSet('prefix', $tb) ? $tb['prefix'] : null; //prefix is the chapter-id starting characters, e.g. "2EN"

echo "<div id='header'><h1 class='title'>";
//echo keyword('Chapters for') . " ";
echo keyword($tb_dn);
echo "</h1>";

// Top-right button: open the grade+subject "Exams" page. That page lists
// every saved exam for this grade and subject, and is where the user can
// click "Generate Exam" to build a fresh one. We don't create exams from
// here any more — Generate Exam lives on the exams page only.
//
// Exams are BUILT by looma-ai from the chapter text, so this button follows
// looma-ai: no assistant service (or no zvec stack under it) means no button.
require_once (__DIR__ . '/includes/looma-features.php');
if (looma_ai_enabled()) {
$exam_lang = isset($_COOKIE['lang']) ? strtolower(trim($_COOKIE['lang'])) : 'en';
if (!in_array($exam_lang, ['en', 'np'], true)) { $exam_lang = 'en'; }
// Pass the grade as a plain digit so it matches the format the exams page
// expects (and the value stored in each exam's .meta.json).
$grade_digit = preg_replace('/\D+/', '', $tb['class']);
$exam_list_qs = http_build_query([
    'grade'    => $grade_digit,
    'subject'  => $tb['subject'],
    'prefix'   => $prefix,
    'language' => $exam_lang,
]);
echo "<a id='exams-btn-link' class='exams-btn-link' "
   . "href='looma-exams-list.php?" . htmlspecialchars($exam_list_qs, ENT_QUOTES) . "'>"
   . "<button id='exams-btn' class='generate-exam-btn' type='button'>"
   . ($exam_lang === 'np' ? 'परीक्षाहरू' : 'Exams')
   . "</button></a>";
}  // end if (looma_ai_enabled())

echo "</div>";

// show Heading for each column (en chapters, en lessons, en activities, np chapters, np lessons, np activities)
echo "<div id='main-container-horizontal' class='scroll'>";
if ($tb_fn != null) {
    echo "<button class='en-chapter heading img' id='englishTitle' disabled>" .
        "<div>Textbook Chapters</div>" .
        "<img src=" . thumbnail($tb_fn, $tb_fp,"chapter") . "></button>";
    echo "<button class='en-lesson heading img activities' disabled>"; echo "Lesson"; echo "</button>";
    echo "<button class='en-activities heading img activities' disabled>";  echo "Resources"; echo "</button>";
    }
    else
    echo "<div></div><div></div><div></div>";

    if ($tb_nfn != null) {
        echo "<button class='np-chapter heading img' id='nativeTitle' disabled> <div>पाठ्य पुस्तक अध्यायहरू</div>
                       <img src=" . thumbnail($tb_nfn,$tb_fp,"chapter") . "></button>";
        echo "<button class='np-lesson heading img activities' disabled>"; echo "पाठ"; echo "</button>";
        echo "<button class='np-activities heading img activities' disabled>"; echo "स्रोतहरू"; echo "</button>";   }
    else echo "<div></div><div></div><div></div>";

// get all the CHAPTERS for this grade/subject
$prefix_as_regex = "^" . $prefix . "\d"; //insert the PREFIX into a REGEX

$query = array('_id' => array('$regex' => $prefix_as_regex));

//$chapters = $chapters_collection -> find($query);
$chapters = mongoFind($chapters_collection, $query, '_id', null, null);
//$chapters->sort(array('_id' => 1)); //NOTE: this is MONGO sort() method for mongo cursors
// this sort is on '_id' which is the "ch_id" of the chapter
// we must always maintain chapter IDs so that their SORT() order is the natural sort order

// for each CHAPTER in the CHAPTERS	array,
// display buttons for textbook, 2nd language textbook (if any) and
// a RESOURCES button that has a data-activity attribute
// that holds the MongoDB ObjectId for this chapter (for looking up the activities list when needed)

$source = file_exists('../content/chapters') ? 'useChapters' : 'useTextbooks';

foreach ($chapters as $ch) {

    //print_r($ch);exit;

    $ch_dn =  keyIsSet('dn', $ch) ? ($ch['dn']) : $tb_dn;
    $ch_ndn =  keyIsSet('ndn', $ch) ? ($ch['ndn']) : $tb_dn;
    //$ch_dn is chapter displayname
    $ch_ndn = keyIsSet('ndn', $ch) ? $ch['ndn'] : $ch_dn;
    //$ch_ndn is native displayname
    $ch_pn =  keyIsSet('pn', $ch) ? $ch['pn'] : null;
    $ch_ft =  keyIsSet('ft', $ch) ? $ch['ft'] : 'chapter';
    $nch_ft =  keyIsSet('nft', $ch) ? $ch['nft'] : $ch_ft;
    //$ch_pn is chapter page number
    $ch_npn = keyIsSet('npn', $ch) ? $ch['npn'] : null;
    //$ch_pn is chapter page number
    $ch_len = keyIsSet('len', $ch) ? $ch['len'] : null;
    //$ch_pn is chapter page number
    $ch_nlen = keyIsSet('nlen', $ch) ? $ch['nlen'] : null;
    //$ch_npn is chapter native page number
    $ch_id  = keyIsSet('_id', $ch) ? $ch['_id'] : null;
    $nch_id  = keyIsSet('nch_id', $ch) ? $ch['nch_id'] : $ch_id;
    //$ch_id is chapter ID string

    $class = ucfirst($tb['class']);
    $subject = ucfirst($tb['subject']);
    if ($subject === 'Socialstudies') $subject = 'SocialStudies';

////////// ENGLISH chapter ///////////
// display chapter button for english textbook, if any
    if ($tb_fn && $ch_pn) {
      // HTML chapter? Open the HTML viewer. Keep the 'chapter' class so the same
      // click handler fires; only data-ft changes so playMedia() routes to HTML.
      $en_dir  = "../content/chapters/$class/$subject/en/";
      $en_html = looma_chapter_html($en_dir, array($ch_id));
      if ($en_html) {
        echo "<button class='$ch_ft en-chapter'
                                      data-lang='en'
                                      data-ft='htmlchapter'
                                      data-fp='" . htmlspecialchars($en_dir, ENT_QUOTES) . "'
                                      data-fn='" . htmlspecialchars($en_html, ENT_QUOTES) . "'
                                      data-ch='$ch_id'
                                      data-chdn='" . htmlspecialchars($ch_dn, ENT_QUOTES) . "'
                                      data-class='$class'
                                      data-subject='$subject'>
                                      $ch_dn
                                  </button>";
      } else { echo "<button class='$ch_ft en-chapter'
                                      data-lang='en'
                                      data-fn='$tb_fn'
                                      data-fp='$tb_fp'
                                      data-nfn='" . ($tb_nfn ?: '') . "'
                                      data-npage='" . ($ch_npn ?: '') . "'
                                      data-ch='$ch_id'
                                      data-chdn='" . htmlspecialchars($ch_dn, ENT_QUOTES) . "'
                                      data-ft='$ch_ft'
                                      data-class='$class'
                                      data-subject='$subject'
                                      data-source='$source'

                                      data-zoom='2.1'
                                      data-len='$ch_len'
                                      data-page='$ch_pn'>
                                      $ch_dn
                                  </button>";
      }

////////// ENGLISH lesson ///////////
// display a button for the lesson plans for this chapter
    $query = array('ch_id' => $ch_id, 'ft' => 'lesson');

        //check in the database to see if there are any LESSON PLANS for this CHAPTER. if so, create a button
        // NOTE: current code only finds the FIRST lesson for the chapter.
        // expand in the future to allow multiple lessons per chapter
    //$lesson = $activities_collection -> findOne($query);
        $count = mongoCount($activities_collection, $query);

            if ($count  > 1) {

                // echo "found " . count($lessons->toArray()) . ' lessons';

                echo   '<button class="lessons en-lesson" data-ft="lessons"';
                echo   'data-lang="en" data-ch="' . $ch_id . '">Lessons</button>';

            } else if ($count === 1) {
                $lesson = mongoFindOne($activities_collection, $query);

                echo   '<button class="lesson en-lesson" data-lang="en" data-ch="' . $ch_id;
                echo   '" data-ft="lesson" data-id="' . $lesson['mongoID'] . '">Lesson</button>';
  /*
                    echo "<td>";
                    $dn = $lesson['dn'];
                    $ndn = isset($lesson['ndn']) ?  $lesson['ndn'] : "";
                    $ft = "lesson";
                    $thumb = $lesson['thumb'];
                    $id = $lesson['mongoID'];  //mongoID of the descriptor for this lesson
                    makeActivityButton($ft, "", "", $dn, $ndn, $thumb, "", $id, "", "", "", "", "", "", null, null,null,null);
                    echo "</td>";
                    $buttons++; if ($buttons > $maxButtons) {$buttons = 1; echo "</tr><tr>";}
*/
            }



////////// ENGLISH exercise (AI) ///////////
    // If looma-ai has registered an `ft=exercise` activity for this
    // chapter (at quiz generation time), surface a button that opens
    // looma-play-exercise.php — the dedicated AI exercise viewer.
    // Exercises are accessed from the Resources page (keep Chapters view at 3 columns).

////////// ENGLISH activities ///////////
    // finally, display a button for the activities of this chapter with data-activity=CHAPTER_ID key value
    // first check whether there are any activities for this chapter and make the button invisible if not

 /* // NOTE: removing check for resources for chapters to improve page load time
    $query = array('ch_id' => $ch_id);

    //check in the database to see if there are any ACTIVITIES for this CHAPTER. if so, create a "Resources" button
    //$activities = $activities_collection -> findOne($query);
        $activities = mongoFindOne($activities_collection, $query);

        //check in the database to see if there are any dictionary words for this CHAPTER. if so, create an activity button
    //$words = $dictionary_collection -> findOne($query);
    $words = mongoFindOne($dictionary_collection, $query);
    if ($activities || $words) {
*/
        echo '<button class="activities en-activities"
                       data-lang="en"
                       data-ch="';
        echo $ch_id;
        echo '" data-chdn="' . $ch_dn ;
        echo '" data-chndn="' . $ch_ndn . '">';
        echo 'Resources';
        echo "</button>";
  /*    }
    else {echo "<button class='activity' style='visibility: hidden'></button>";}
*/
    } else {echo "<button class='chapter en-chapter' style='visibility: hidden'></button>";
            echo "</button>";
            echo "</button>";

}  //end of ENGLISH columns


////////// NEPALI chapter ///////////
    // display chapter button for 2nd [native] textbook, if any
    if ($tb_nfn && $ch_npn) {
      // HTML chapter (Nepali)? np PDFs are named "{id}-nepali.pdf", so an HTML
      // one is most likely "{id}-nepali.html"; also accept "{id}.html".
      $np_dir  = "../content/chapters/$class/$subject/np/";
      $np_html = looma_chapter_html($np_dir, array($nch_id . '-nepali', $nch_id));
      if ($np_html) {
        echo "<button class='$nch_ft np-chapter'
                                    data-lang='np'
                                    data-ft='htmlchapter'
                                    data-fp='" . htmlspecialchars($np_dir, ENT_QUOTES) . "'
                                    data-fn='" . htmlspecialchars($np_html, ENT_QUOTES) . "'
                                    data-ch='$nch_id'
                                    data-chdn='" . htmlspecialchars($ch_ndn, ENT_QUOTES) . "'
                                    data-class='$class'
                                    data-subject='$subject'>
                                    $ch_ndn
                                  </button>";
      } else { echo "<button class='$nch_ft np-chapter'
                                    data-lang='np'
                                    data-fn='$tb_nfn'
                                    data-fp='$tb_fp'
                                    data-nfn='" . ($tb_fn ?: '') . "'
                                    data-npage='" . ($ch_pn ?: '') . "'
                                    data-ch='$nch_id'
                                    data-chdn='" . htmlspecialchars($ch_ndn, ENT_QUOTES) . "'
                                    data-ft='$nch_ft'
                                    data-class='$class'
                                    data-subject='$subject'
                                    data-source='$source'

                                    data-zoom='2.3'
                                    data-len='$ch_nlen'
                                    data-page='$ch_npn'>
                                    $ch_ndn
                                  </button>";
      }


////////// NEPALI lesson ///////////
///     //check in the database to see if there are any LESSON PLANS for this CHAPTER. if so, create a button
    // NOTE: current code only finds the FIRST lesson for the chapter.
    // expand in the future to allow multiple lessons per chapter

        $query = array('ch_id' => $ch_id, 'ft' => 'lesson');

        // $query = array('ch_id' => $nch_id, 'ft' => 'lesson');

        //   $query = array('nch_id' => $nch_id, 'ft' => 'lesson');

     //   '$or':[{'ft':'video'},{'ft':'mp4'},{'ft':'mov'}]

        //$lesson = $activities_collection -> findOne($query);
        $lesson = mongoFindOne($activities_collection, $query);
    if ($lesson) {
        echo "<button class='lesson np-lesson'
                          data-lang='np'
                         data-ch='$nch_id'
                           data-chdn='" .
            $lesson['dn'] .
            "' data-ft='lesson'
                           data-id='" .
            $lesson['mongoID'] .
            "'>";
        echo "पाठ";
        echo "</button>";
    }  // end LESSON NP

    ////////// NEPALI exercise (AI) ///////////
    if (false) {
        echo "<button class='exercise np-exercise'
                       data-lang='np'
                       data-ch='" . $ch_id . "'
                       data-grade='" . $class . "'
                       data-subject='" . $subject . "'
                       data-language='np'>अभ्यास</button>";
    } else {
        // Exercises are accessed from the Resources page.
    }

    ////////// NEPALI activities ///////////
    ///    // finally, display a button for the activities of this chapter with data-activity=CHAPTER_ID key value
    // first check whether there are any activities for this chapter and make the button invisible if not


   /*     $query = array('nch_id' => $nch_id);

        //check in the database to see if there are any ACTIVITIES for this CHAPTER. if so, create an activity button
        //$activities = $activities_collection -> findOne($query);
        $activities = mongoFindOne($activities_collection, $query);
        //check in the database to see if there are any dictionaryt words for this CHAPTER. if so, create an activity button
        //$words = $dictionary_collection -> findOne($query);
        $words = mongoFindOne($dictionary_collection, $query);

        if ($activities || $words) {
*/
            echo "<button class='activities np-activities'
                     data-lang='np'
                     data-ch='$nch_id'
                     data-chdn='$ch_dn'
                    data-chndn='$ch_ndn'>";
            echo "स्रोतहरू";
            echo "</button>";
/*
        }
    */
    }  else {echo "<button class='chapter np-chapter' style='visibility: hidden'></button>";
            echo "</button>";
            echo "</button>";

}   //end of NEPALI columns
}
echo "</div>";
?>


<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-chapters.js"></script>          <!-- Looma Javascript -->
</body>
