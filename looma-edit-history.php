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
Description: editor for user-created history timelines.

    Flow: on entry you set the timeline's title (+ Nepali) and a cover image (Timeline modal).
    Then you land on a blank timeline (the real looma-history.php format). Tap a "+" insert
    slot to add an event, or tap an existing event to edit it (Event modal: title, date,
    description, + optional Nepali). The description is what shows when an event is tapped in
    the viewer.

    Reads/writes ONLY the 'user_histories' collection; the curated, read-only 'histories'
    collection (the 11 approved timelines) is never touched. File-menu / save / load reuse
    the Slideshow-editor patterns.

Owner: VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 7.x
 -->

<?php   $page_title = 'Looma History Timeline Editor';
        include ('includes/header.php');
?>

    <link rel="Stylesheet" type="text/css" href="css/looma-filecommands.css">
    <link rel="Stylesheet" type="text/css" href="css/looma-edit-history.css?v=<?php echo @filemtime(__DIR__.'/css/looma-edit-history.css'); ?>">

</head>

<body>

    <div id="main-container">

        <div id="header">
            <div id="title">Editing: <span class="filename">&lt;none&gt;</span></div>
            <img src="images/logos/LoomaLogoTransparent.png" height="100%"/>
            <span id="editor-name">Looma History Timeline Editor</span>
        </div>

        <div id="toolbar-row">
            <button id="timeline-details-btn">&#9998; Timeline Details</button>
            <button id="timelineLeft"  class="timelineScroll" title="Scroll left">&#8249;</button>
            <button id="timelineRight" class="timelineScroll" title="Scroll right">&#8250;</button>
            <span class="edit-hint">Tap a <b>&#43;</b> to add an event &bull; tap an event to edit it</span>
        </div>

        <!-- the editable timeline (mirrors looma-history.php's #playground / .timeline) -->
        <div id="playground">
            <section class="timeline">
                <ol id="timeline-ol"></ol>
            </section>
        </div>

    </div>

    <!-- ===== Modal A: Timeline details (title + cover image; Nepali behind a toggle) ===== -->
    <div id="timeline-modal" class="modal">
        <div class="modal-card">
            <button class="modal-close" data-modal="timeline-modal" title="Close">&times;</button>
            <h2>Timeline Details</h2>

            <label>Timeline title</label>
            <input id="tl-title" type="text" placeholder="e.g. History of Nepal">

            <label>Cover image (optional)</label>
            <div id="tl-cover-row">
                <img id="tl-cover-preview" alt="cover preview" hidden>
                <div id="tl-cover-actions">
                    <button id="tl-choose-image" type="button">Choose image&hellip;</button>
                    <button id="tl-remove-image" type="button" hidden>Remove</button>
                    <input id="tl-cover-file" type="file" accept="image/*" hidden>
                    <input id="tl-cover-url" type="text" placeholder="&hellip;or paste an image URL / path">
                </div>
            </div>

            <button type="button" class="nepali-toggle" data-target="tl-nepali">&#43; Add Nepali translation</button>
            <div id="tl-nepali" class="nepali-fields">
                <label>&#2358;&#2368;&#2352;&#2381;&#2359;&#2325; &mdash; Nepali title</label>
                <input id="tl-ntitle" type="text" placeholder="Nepali title">
            </div>

            <div class="modal-actions">
                <button id="tl-done" class="primary">Done</button>
            </div>
        </div>
    </div>

    <!-- ===== Modal B: Event (title, date, description; Nepali behind a toggle) ===== -->
    <div id="event-modal" class="modal">
        <div class="modal-card">
            <button class="modal-close" data-modal="event-modal" title="Close">&times;</button>
            <h2 id="event-modal-title">Add Event</h2>

            <label>Event title</label>
            <input id="ev-title" type="text" placeholder="e.g. Unification of Nepal">

            <label>Date</label>
            <input id="ev-date" type="text" placeholder="e.g. 1768">

            <label>Description (shown when the event is tapped)</label>
            <textarea id="ev-desc" placeholder="Description"></textarea>

            <button type="button" class="nepali-toggle" data-target="ev-nepali">&#43; Add Nepali translation</button>
            <div id="ev-nepali" class="nepali-fields">
                <label>&#2358;&#2368;&#2352;&#2381;&#2359;&#2325; &mdash; Nepali title</label>
                <input id="ev-ntitle" type="text" placeholder="Nepali title">
                <label>&#2350;&#2367;&#2340;&#2367; &mdash; Nepali date</label>
                <input id="ev-ndate" type="text" placeholder="Nepali date">
                <label>&#2357;&#2367;&#2357;&#2352;&#2339; &mdash; Nepali description</label>
                <textarea id="ev-ndesc" placeholder="Nepali description"></textarea>
            </div>

            <div class="modal-actions">
                <button id="ev-delete" hidden>Delete event</button>
                <button id="ev-done" class="primary">Done</button>
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

    <script src="js/looma-edit-history.js?v=<?php echo @filemtime(__DIR__.'/js/looma-edit-history.js'); ?>"></script>
</body>
</html>
