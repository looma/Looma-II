<?php
require_once('includes/looma-isloggedin.php');

// NOTE: this code sending "header" must be before ANY data is sent to client-side
$loggedin = loggedIn();
$level = isset($_COOKIE['login-level']) ? $_COOKIE['login-level'] : null;
if (!$loggedin) { header('Location: looma-login.php'); exit; }
// admin-control only: lock down to admin / exec (matches Resource & Dictionary editors)
if ($level !== 'admin' && $level !== 'exec') { header('Location: looma-home.php'); exit; }
error_log("Starting History Timeline Edit session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
Filename: looma-edit-history.php
Description: editor for user-created history timelines. The editing surface mirrors the
             read-only history viewer (looma-history.php): a horizontal timeline with events
             alternating above/below a line. Events are edited in place - tap the title or
             date to type; use the pencil to edit description / Nepali text / linked activities.

             Reads/writes ONLY the 'user_histories' collection; the curated, read-only
             'histories' collection (the 11 approved timelines) is never touched.
             The File-menu flow, save/load, and activity search reuse the Slideshow-editor patterns.

Owner: VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 7.x
 -->

<?php   $page_title = 'Looma History Timeline Editor';
        include ('includes/header.php');
?>

    <link rel="Stylesheet" type="text/css" href="css/looma-search.css">
    <link rel="Stylesheet" type="text/css" href="css/looma-filecommands.css">
    <link rel="Stylesheet" type="text/css" href="css/looma-edit-history.css">

</head>

<body>

    <div id="main-container">

        <div id="header">
            <div id="title">Editing: <span class="filename">&lt;none&gt;</span></div>
            <img src="images/logos/LoomaLogoTransparent.png" height="100%"/>
            <span id="editor-name">Looma History Timeline Editor</span>
        </div>

        <div id="toolbar-row">
            <button id="add-event">&#43; Add Event</button>
            <button id="timelineLeft"  class="timelineScroll" title="Scroll left">&#8249;</button>
            <button id="timelineRight" class="timelineScroll" title="Scroll right">&#8250;</button>
            <span class="edit-hint">Tap a title or date to edit it &bull; use the &#9998; on an event for description, Nepali text &amp; linked activities</span>
        </div>

        <!-- the editable timeline (mirrors looma-history.php's #playground / .timeline) -->
        <div id="playground">
            <section class="timeline">
                <ol id="timeline-ol"></ol>
            </section>
            <div id="empty-hint">
                This timeline is empty.<br>
                Click <b>&#43; Add Event</b> to begin, or use <b>File &rarr; Open</b> to edit one of your own timelines.
            </div>
        </div>

    </div>

    <!-- per-event details editor (Nepali title/date, description EN/NP, linked activities) -->
    <div id="event-details" class="overlay" hidden>
        <div class="details-card">
            <button id="details-close" title="Done">&times;</button>
            <h2>Edit Event Details</h2>

            <label>Title (English)</label>
            <input id="d-title" type="text" placeholder="Event title (English)">
            <label>&#2358;&#2368;&#2352;&#2381;&#2359;&#2325; (Nepali title &ndash; optional)</label>
            <input id="d-ntitle" type="text" placeholder="Nepali title">

            <label>Date (English)</label>
            <input id="d-date" type="text" placeholder="e.g. 1543">
            <label>&#2350;&#2367;&#2340;&#2367; (Nepali date &ndash; optional)</label>
            <input id="d-ndate" type="text" placeholder="Nepali date">

            <label>Description (English)</label>
            <textarea id="d-desc" placeholder="Shown in the popup when the event is tapped"></textarea>
            <label>&#2357;&#2367;&#2357;&#2352;&#2339; (Nepali description &ndash; optional)</label>
            <textarea id="d-ndesc" placeholder="Nepali description"></textarea>

            <label>Linked activities (up to 2)</label>
            <div id="d-activities"></div>
            <button id="d-link-activity" type="button">&#43; Link an activity&hellip;</button>

            <!-- activity search (reveals when linking); reuses looma-search.php + looma-search.js -->
            <div id="activity-search" hidden>
                <?php require_once ('includes/looma-search.php'); ?>
                <div id="activity-results"></div>
            </div>

            <div class="details-actions">
                <button id="details-done">Done</button>
            </div>
        </div>
    </div>

    <?php include('includes/looma-control-buttons.php'); ?>
    <button class='control-button' id='dismiss'></button>

    <?php include ('includes/js-includes.php'); ?>

    <script src="js/jquery-ui.min.js"></script>
    <script src="js/jquery.hotkeys.js"></script>
    <script src="js/tether.min.js"></script>
    <script src="js/bootstrap.min.js"></script>

    <?php include ('includes/looma-filecommands.php'); ?>

    <script src="js/looma-media-controls.js"></script>
    <script src="js/looma-search.js"></script>
    <script src="js/looma-edit-history.js"></script>
</body>
</html>
