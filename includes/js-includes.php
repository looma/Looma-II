<!-- in production, the below should all be MINIMIZED versions -->
<?php
// Cache-bust first-party scripts with their own mtime: Apache sends no
// Cache-Control here, so browsers can keep an old copy indefinitely after a
// deploy. Guarded because looma-404.php includes this file twice per request.
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
    <script src="js/looma-telemetry.js<?php echo looma_js_v('js/looma-telemetry.js'); ?>"></script>      <!-- learning/TTS events for the Grafana dashboards -->
    <!-- Phone-sized screens only: every rule inside sits in a media query. Last on the
         page on purpose, after each page's own stylesheet and the toolbar's. -->
    <link rel="stylesheet" href="css/looma-mobile.css<?php echo looma_js_v('css/looma-mobile.css'); ?>">
