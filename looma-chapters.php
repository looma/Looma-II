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

?>
    <link rel="stylesheet" href="css/looma-chapters.css">
</head>

<body>

<?php

$class = trim($_GET['class']);  //from MONGO - format is "class1", "class2", etc
$grade = trim($_GET['grade']);  // display name of $class - format is "Grade 1", etc
$subject = trim($_GET['subject']) ;
$prefix = trim($_GET['prefix']) ;

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
echo "</h1></div>";


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
// an RESOURCES button that has a data-activity attribute
// that holds the MongoDB ObjectId for this chapter (for looking up the activities list when needed)


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

////////// ENGLISH chapter ///////////
// display chapter button for english textbook, if any
    if ($tb_fn && $ch_pn) { echo "<button class='$ch_ft en-chapter' 
                                      data-lang='en' 
                                      data-fn='$tb_fn' 
                                      data-fp='$tb_fp' 
                                      data-ch='$ch_id'  
                                      data-ft='$ch_ft' 
                                      data-zoom='2.1'  
                                      data-len='$ch_len' 
                                      data-page='$ch_pn'>
                                           $ch_dn";
                            echo    "</button>";

////////// ENGLISH lesson ///////////
// display a button for the lesson plans for this chapter
    $query = array('ch_id' => $ch_id, 'ft' => 'lesson');

        //check in the database to see if there are any LESSON PLANS for this CHAPTER. if so, create a button
        // NOTE: current code only finds the FIRST lesson for the chapter.
        // expand in the future to allow multiple lessons per chapter
    //$lesson = $activities_collection -> findOne($query);
        $lesson = mongoFindOne($activities_collection, $query);

    if ($lesson) {
        echo "<button class='lesson en-lesson'
                      data-lang='en'
                      data-ch='$ch_id'
                      data-len='$ch_len'
                      data-chdn='" .
                        $lesson['dn'] .
                   "' data-ft='lesson'
                      data-id='" .
                        $lesson['mongoID'] .
                    "'>" . "Lesson";
        echo "</button>";
    }

    else {echo "<button class='activity' style='visibility: hidden'></button>";}

////////// ENGLISH activities ///////////
    // finally, display a button for the activities of this chapter with data-activity=CHAPTER_ID key value
    // first check whether there are any activities for this chapter and make the button invisible if not
/*
 * NOTE: removing check for resources for chapters to improve page load time
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
 /*       }
    else {echo "<button class='activity' style='visibility: hidden'></button>";}

    } else {echo "<button class='chapter en-chapter' style='visibility: hidden'></button>";
            echo "</button>";
            echo "</button>";
 */
}  //end of ENGLISH columns


////////// NEPALI chapter ///////////
    // display chapter button for 2nd [native] textbook, if any
    if ($tb_nfn && $ch_npn) { echo "<button class='$nch_ft np-chapter'
                                    data-lang='np'
                                    data-fn='$tb_nfn'
                                    data-fp='$tb_fp'
                                    data-ft='$nch_ft' 
                                    data-page='$ch_npn'
                                    
                                    data-zoom='2.3'  
                                    
                                    data-len='$ch_nlen'
                                    data-ch='$nch_id'>
                                    $ch_ndn
                                    </button>";


////////// NEPALI lesson ///////////
///     //check in the database to see if there are any LESSON PLANS for this CHAPTER. if so, create a button
    // NOTE: current code only finds the FIRST lesson for the chapter.
    // expand in the future to allow multiple lessons per chapter
        $query = array('nch_id' => $nch_id, 'ft' => 'lesson');
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

    ////////// NEPALI activities ///////////
    ///    // finally, display a button for the activities of this chapter with data-activity=CHAPTER_ID key value
    // first check whether there are any activities for this chapter and make the button invisible if not

/*
        $query = array('nch_id' => $nch_id);

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
    }  else {echo "<button class='chapter np-chapter' style='visibility: hidden'></button>";
            echo "</button>";
            echo "</button>";
 */
}   //end of NEPALI columns
}
echo "</div>";
?>


<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-chapters.js"></script>          <!-- Looma Javascript -->
</body>
