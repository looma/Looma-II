<!doctype html>
<!--
LOOMA php code file
Filename: looma-play-pdf.php
Description:

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:   APR 2020
Revision: Looma 5.7
-->

<?php $page_title = 'Looma PDF Viewer';
include ('includes/header.php');
require_once ('includes/looma-utilities.php');

$filepath = $_REQUEST['fp'];
if ( strpos($filepath, 'textbooks')) logFiletypeHit('chapter');
else                                                 logFiletypeHit('pdf');
?>
<link rel="stylesheet" href="css/font-awesome.min.css">
</head>

<body>

<div id="main-container-vertical">

    <div id="fullscreen">

        <div id="pdf-toolbar" class="pdf-toolbar">
            <button class="toolbar-button blank"></button>

            <button id="showthumbs" class="toolbar-button">
                <img draggable="false" src="images/directory.png">
                <?php tooltip("Show pages") ?>
            </button>


            <!-- implement FIND later
                <button id="find" class="toolbar-button ">
                    <img draggable="false" src="images/search.png"   >
                    <?php //tooltip("Find") ?>
                </button>
                -->
            <button class="toolbar-button blank"></button>

            <button id="prev-page" class="toolbar-button ">
                <img draggable="false" src="images/looma-up.png"   >
                <?php tooltip("Previous") ?>
            </button>

            <button id="next-page" class="toolbar-button ">
                <img draggable="false" src="images/looma-down.png"   >
                <?php tooltip("Next") ?>
            </button>

            <button class="toolbar-button blank"></button>

            <span>Page&nbsp</span>
            <span id="pagenum">&nbsp&nbsp</span>
            <span> &nbspof&nbsp</span>
            <span id="maxpages">&nbsp&nbsp</span>

            <button class="toolbar-button blank"></button>

            <button id="zoom-out" class="toolbar-button ">
                <img draggable="false" src="images/minus.png"   >
                <?php tooltip("Zoom out") ?>
            </button>

            <button id="zoom-in" class="toolbar-button ">
                <img draggable="false" src="images/plus.png"   >
                <?php tooltip("Zoom in") ?>
            </button>

            <span id="zoom-label">Zoom:</span>
            <div id="zoom-menu" class="btn-group">
                <button type="button" id="zoom-btn" class="btn toolbar-button" data-zoom="Page width">
                    Page width
                    <i class="fa fa-caret-down" aria-hidden="true"></i>
                </button>
                <div id="zoom-dropdown" class="dropdown-menu hide">
                    <button class="dropdown-item zoom-item" data-level="2.3" data-zoom="Page width">Page width</button>
                    <button class="dropdown-item zoom-item" data-level="1.2" data-zoom="Page fit">Page fit  </button>
                    <button class="dropdown-item zoom-item" data-level="1.15" data-zoom="50%">50%       </button>
                    <button class="dropdown-item zoom-item" data-level="2.3" data-zoom="100%">100%       </button>
                    <button class="dropdown-item zoom-item" data-level="4.6" data-zoom="200%">200%       </button>
                    <button class="dropdown-item zoom-item" data-level="9.2" data-zoom="400%">400%       </button>
                </div>
            </div>
        </div>

        <?php
        //echo '<div id="fullscreen">';
        include('looma-pdf-viewerNEW.php');
        include ('includes/looma-control-buttons.php');

        downloadButton($filepath, $filename);

        ?>
    </div>

    <div id="thumbs"></div>
</div>

<?php
include ('includes/toolbar-vertical.php');
include ('includes/js-includes.php');
?>
</body>
