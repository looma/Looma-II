<!--
    filename: looma-pdf-viewer.php
    used by: looma-play-pdf.php and looma-play-lesson.php
-->
<link rel="stylesheet" href="css/font-awesome.min.css">
<link rel="stylesheet" href="css/looma-play-pdf.css">
<script src="js/jquery.min.js">      </script>      <!-- jQuery - needed inside the iframe for looma-lesson-play.php-->

<?php
//include('includes/js-includes.php');

$filename = (isset($_REQUEST['fn']) ? urldecode($_REQUEST['fn']) : "");
$filepath = (isset($_REQUEST['fp']) ? urldecode($_REQUEST['fp']) : "");
$pagenum = (isset($_REQUEST['page']) ? urldecode($_REQUEST['page']) : 1);
$len = (isset($_REQUEST['len']) ? urldecode($_REQUEST['len']) : 10);
$zoom = (isset($_REQUEST['zoom']) ? urldecode($_REQUEST['zoom']) : "page-width");

echo '<div id="pdf" class="scroll"'  .
        '  data-fn="' .    $filename .
        '" data-fp="' .   $filepath .
        '" data-page="' . $pagenum .
        '" data-len="' . $len .
        '" data-zoom="'.  $zoom .'">';
    echo '</div>';


?>

<script src="js/pdfjs/pdf.min.js"></script>
<script src="js/looma-pdf-utilities.js"></script>
<script src="js/looma-play-pdf.js"></script>

