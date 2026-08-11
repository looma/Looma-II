<!doctype html>
<!--
Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0
File: looma-html.php
Description:  base page for showing HTML content. call with URL=looma.html.php?fp=filepath&fn=filename
-->

<?php $page_title = 'Looma HTML';
require_once ('includes/header.php');
require_once ('includes/looma-utilities.php');
?>

<link rel="stylesheet" href="css/looma-html.css">
</head>

<body>
<?php

if (isset($_GET['fp'])) $filepath = $_REQUEST['fp']; else $filepath = "../content/";
if (isset($_GET['fn'])) $filename = $_REQUEST['fn']; else $filename = null;

/* The SAME chapter in the other language, or null.
 *
 * A chapter is one file per language, in mirrored folders:
 *     ../content/chapters/{Class}/{Subject}/en/{id}.html
 *     ../content/chapters/{Class}/{Subject}/np/{id}-nepali.html
 * so the counterpart of whatever is open can be worked out from its own path
 * and confirmed against the disk. The PDF viewer gets this handed to it as
 * `nfn`/`nfp` by whoever opened it; resolving it HERE instead means the
 * language switch works no matter which way the chapter was opened — the
 * chapters page, library search, a lesson plan or the assistant.
 *
 * Anything that is not a chapter (Wikipedia, ePaath, PhET) returns null and the
 * Translate button keeps its old meaning: translate the interface only.
 */
function looma_html_alt_language($filepath, $filename) {
    $dir = str_replace('\\', '/', (string) $filepath);
    if (!preg_match('#/content/chapters/[^/]+/[^/]+/(en|np)/$#', $dir, $m)) return null;
    if (!preg_match('/\.html?$/i', (string) $filename)) return null;

    $lang = $m[1];
    $base = preg_replace('/\.html?$/i', '', $filename);

    if ($lang === 'en') {
        $altDir  = preg_replace('#/en/$#', '/np/', $dir);
        $altLang = 'np';
        $bases   = array($base . '-nepali', $base);
    } else {
        $altDir  = preg_replace('#/np/$#', '/en/', $dir);
        $altLang = 'en';
        $bases   = array(preg_replace('/-nepali$/i', '', $base), $base);
    }

    foreach ($bases as $b) {
        foreach (array('.html', '.htm') as $ext) {
            if (is_file($altDir . $b . $ext)) {
                return array('fp' => $altDir, 'fn' => $b . $ext, 'lang' => $altLang, 'from' => $lang);
            }
        }
    }
    return null;
}

$altChapter = looma_html_alt_language($filepath, $filename);

     if (!realpath($filepath)) { echo "<br><h1>File not found</h1>"; exit;}
else if  ( ! is_dir(realpath($filepath)))
                    { echo "<br><h1>Access not permitted</h1>"; exit;}

if  ( ! preg_match("/content/",realpath($filepath)) &&
      ! preg_match("/ePaath/",realpath($filepath)))
                    { echo "<br><h1>Access not permitted</h1>"; exit;}

//NOTE: the ff should include recording ePaath hits
if      ( strpos($filepath, 'W4S2013')) logFiletypeHit('wikipedia');
else if ( strpos($filepath, 'PhET'))    logFiletypeHit('PhET');
// next line commented. counting HTML hits is distorted by Wikipedia navigation
//else                                                    logFiletypeHit('html');


echo "<div id='main-container-horizontal'>";
    echo "<div id='fullscreen'";
        if (isset($_GET['ep']) && $_GET['ep'] === 'keyboard') echo " class='keyboard'";
    echo ">";
        //<!-- NOTE the iframe below has name='looma-frame', and wikipedia articles in looma have <a xxx.htm target="looma-frame" -->
        // data-alt* is read by js/looma-html.js, which turns the toolbar's
        // Translate button into "open this chapter in the other language".
        $altAttrs = "";
        if ($altChapter) {
            $altAttrs = " data-lang='"    . htmlspecialchars($altChapter['from'], ENT_QUOTES) . "'" .
                        " data-altlang='" . htmlspecialchars($altChapter['lang'], ENT_QUOTES) . "'" .
                        " data-altfp='"   . htmlspecialchars($altChapter['fp'],   ENT_QUOTES) . "'" .
                        " data-altfn='"   . htmlspecialchars($altChapter['fn'],   ENT_QUOTES) . "'";
        }
        echo "<iframe id='iframe' name='looma-frame' src='$filepath$filename'$altAttrs allowfullscreen> </iframe>";
        include('includes/looma-control-buttons.php')
?>
    </div>
</div>

<?php include ('includes/toolbar.php'); ?>
<?php include ('includes/js-includes.php'); ?>
<script src="js/looma-html.js"></script>
<script src="js/looma-keyboard.js"></script>
