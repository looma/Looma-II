<!-- in production, the below should all be MINIMIZED versions -->
<?php
// Cache-bust every first-party script with its own mtime (same "?v=" plus
// filemtime pattern already used by looma-play-exercise.php) — without it,
// Apache here sends Last-Modified/ETag but no Cache-Control, so browsers are free to keep
// serving an old cached copy of any of these indefinitely after a deploy,
// even a hard-refresh-shy one, since this file is `include()`d on nearly
// every page. Guarded: looma-404.php (at least) include()s this file twice
// on the same request, which would otherwise fatal with "Cannot redeclare".
if (!function_exists('looma_js_v')) {
    function looma_js_v($path) { return '?v=' . (@filemtime($path) ?: time()); }
}
?>
    <script src="js/jquery3.6.0.min.js">      </script>

    <script src="js/looma-utilities.js<?php echo looma_js_v('js/looma-utilities.js'); ?>"></script>     <!-- Looma utility functions -->
<!--<script src="js/looma-utilities.min.js"> </script>   -->    <!-- Looma utility functions -->

    <script src="js/looma.js<?php echo looma_js_v('js/looma.js'); ?>"></script>      <!-- Looma common page functions -->
    <script src="js/looma-screenfull.js<?php echo looma_js_v('js/looma-screenfull.js'); ?>"></script>      <!-- implements FULLSCREEN mode  -->
    <script src="js/looma-keyboard.js<?php echo looma_js_v('js/looma-keyboard.js'); ?>"></script>      <!-- adds a KEYBOARD button if the page has any inputs -->
    <script src="js/looma-telemetry.js<?php echo looma_js_v('js/looma-telemetry.js'); ?>"></script>       <!-- learning telemetry: chapter_time / score, + postMessage bridge for AI-served quiz/exam iframes -->
    <script src="js/looma-assistant-button.js<?php echo looma_js_v('js/looma-assistant-button.js'); ?>"></script> <!-- LOOMA Assistant floating button + RAG chat modal -->