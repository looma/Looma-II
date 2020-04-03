<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2019 11
Revision: Looma 5.2
File: looma-book.php
Description:  displays a list of chapters (en and np) and lesson and activities buttons for each chapter
    Created for hesperian health guides (derived from looma-chapters.php)

Pass in URL parameters "fp" the path to the folder containing EN and NP folders for the book, and
                       "prefix" the prefix to use to look up the chapters of the book(s) in mongoDB 'activities' collection
                       "dn"  and "ndn" for the book
-->

<?php $page_title = 'Looma Book';
    require ('includes/header.php');
    require ('includes/mongo-connect.php');
    require ('includes/looma-utilities.php');?>
?>
</head>

<body>

<?php

$fp =     trim($_GET['fp']);
$prefix = trim($_GET['prefix']);
$dn =     trim($_GET['dn']);
$ndn =    trim($_GET['ndn']);

echo "<div id='main-container-horizontal' class='scroll'>";
echo "<div  class='scroll'>";
echo "<h1 class='title'>";
echo keyword('Chapters for') . " ";
    displayName("", $dn, $ndn);
echo "</h1>";

echo "<br><br><table class='ch-table'>";
echo "<tr>";
    //echo "<th><button class='heading img activities' disabled>"; keyword('English'); echo "</button></th>";
    //echo "<th><button class='heading img activities' disabled>"; keyword('Nepali'); echo "</button></th>";


if ($dn != null)
    echo "<th><button class='heading img' id='englishTitle' disabled>" .
        "<img src='" . addslashes($fp) . "thumbnail.png'>" .
        $dn . "</button></th>";
else
    echo "<th></th>";

if ($ndn != null) echo "<th><button class='heading img' id='nativeTitle' disabled>" .
    "<img src='" . addslashes($fp) . "thumbnail.png'>" .
    $ndn . "</button></th>";

else                echo "<th></th>";


    echo "<th><button class='heading img activities' disabled>"; keyword('Lesson'); echo "</button></th>";
    echo "<th><button class='heading img activities' disabled>"; keyword('Activities'); echo "</button></th>";
echo "</tr>";

$prefix_as_regex = "^" . $prefix; //insert the PREFIX into a REGEX

$query = array('book_id' => array('$regex' => $prefix_as_regex));

$chapters = $activities_collection -> find($query);
$chapters->sort(array('book_id' => 1)); //NOTE: this is MONGO sort() method for mongo cursors
// this sort is on 'book_id' which is the "ch_id" of the chapter
// format for book_id is "<book prefix>-0n"  for n = 1..number of chapters
// we maintain book IDs so that their SORT() order is the natural sort order

foreach ($chapters as $ch) {

    echo "<tr>";
    $ch_id  = array_key_exists('book_id', $ch) ? $ch['book_id'] : null;
    $ch_ft =  array_key_exists('ft', $ch) ? $ch['ft'] :   'pdf';

    $ch_dn =  array_key_exists('dn', $ch) ? $ch['dn'] :   null;
    $ch_ndn = array_key_exists('ndn', $ch) ? $ch['ndn'] : null;

    $ch_fn =  array_key_exists('fn', $ch) ? $ch['fn'] :   null;
    $ch_nfn = array_key_exists('nfn', $ch) ? $ch['nfn'] : null;

    $ch_fp =  array_key_exists('fp', $ch) ? $ch['fp'] :   null;
    $ch_nfp = array_key_exists('nfp', $ch) ? $ch['nfp'] : null;

///////   ENGLISH   ///////
// display chapter button for english chapters of the book, if any
    if ($ch_fn) { echo "<td><button class='chapter'
                   data-fn='$ch_fn'
                   data-fp='$ch_fp'
                   data-ch='$ch_id'
                   data-ft='chapter'
                   data-zoom='2.3'>
                       $ch_dn
                   </button></td>";

    }
    else {echo "<td><button class='chapter' style='visibility: hidden'></button></td>";}

///////   NEPALI   ///////
// display chapter button for nepali chapters of the book, if any
    if ($ch_nfn) { echo "<td><button class='chapter'
                   data-fn='$ch_nfn'
                   data-fp='$ch_nfp'
                   data-ch='$ch_id'
                   data-ft='chapter'
                   data-zoom='2.3'>
                       $ch_ndn
                   </button></td>";
    }
    else {echo "<td><button class='chapter' style='visibility: hidden'></button></td>";}

///////   LESSON   ///////
// display a button for the lesson plans for this chapter
    $query = array('ch_id' => $ch_id, 'ft' => 'lesson');
    $projection = array('_id' => 0,
        'mongoID' => 1,
        'dn' => 1
    );

    //check in the database to see if there are any LESSON PLANS for this CHAPTER. if so, create a button
    // NOTE: current code only finds the FIRST lesson for the chapter.
    // expand in the future to allow multiple lessons per chapter
    $lesson = $activities_collection -> findOne($query, $projection);

    if ($lesson) {
        echo "<td><button class='lesson' data-ch='$ch_id'" .
              " data-chdn='" . $lesson['dn'] . "'" .
              "' data-ft='lesson'" .
              "data-id='" . $lesson['mongoID'] . "'>";
              keyword('Lesson');
        echo "</button></td>";
    }
    else {echo "<td><button class='activities' style='visibility: hidden'></button></td>";}

///////   ACTIVITIES   ///////
// display a button for the activities for this chapter
    $query = array('ch_id' => $ch_id);
    $projection = array('_id' => 0,
        'mongoID' => 1,
        'dn' => 1
    );

    //check in the database to see if there are any ACTIVITIES  or this CHAPTER. if so, create a button
    $activity = $activities_collection -> findOne($query, $projection);

    if ($activity) {
        echo "<td><button class='activities'" .
            "data-ch='$ch_id'" .
            " data-chdn='" . $activity['dn'] . "'" ."'>";
        keyword('Activities');
        echo "</button></td>";
    }
    else {echo "<td><button class='activities' style='visibility: hidden'></button></td>";}

    /*
    echo "<td><button class='activities'
             data-ch='$ch_id'
             data-chdn='$ch_dn'>";
             keyword('Activities');
    echo "</button></td></tr>";
    */
}
echo "</table></div></div>";
?>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-book.js"></script>          <!-- Looma Javascript -->
</body>
