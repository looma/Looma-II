
    <!--
        - include this file in PHP to add LOOMA CONTROL BUTTONS (speak, lookup, keyboard, fullscreen)
        - for the buttons to work in FULLSCREEN, they must be INSIDE the <div id="fullscreen"> DIV

        - looma.css has 'display:none' for all these buttons
        - add code in JS to 'display:inline-block' those buttons that will show
    -->

    <button class = "speak                     looma-control-button">
        <?php tooltip("Speak") ?>
    </button>
    <button class = "lookup                    looma-control-button">
        <?php tooltip("Lookup") ?>
    </button>

    <?php

    // NOTE: the floating looma download button is NOT implemented here
    // it is implemented using the downloadButton() function in looma-utilities.php
    // to use it add this line to the PHP file for a page:     require_once ('includes/looma-utilities.php');
    // and then add this call:                                 downloadButton($filepath,$filename);
    //
        //  echo "<button class = 'download                  looma-control-button'>";
        //  echo "<a href=" . "../content/pictures/Bug.png" . " download='downloadedfile'>";
        //  echo "<img src='images/download.png'>";
        //  tooltip("Download");
        //  echo "</a></button>";
    ?>

    <button id = "fullscreen-control"   class="looma-control-button">
        <?php tooltip("Full Screen") ?>
    </button>
    <button id = "fullscreen-playpause" class="looma-control-button play-pause">
        <?php tooltip("Play/Pause") ?>
    </button>
    <button id = "next-item"            class="looma-control-button">
        <?php tooltip("Next") ?>
    </button>
    <button id = "prev-item"            class="looma-control-button">
        <?php tooltip("Previous") ?>
    </button>
