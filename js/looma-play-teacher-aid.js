/*
LOOMA javascript file
Filename: looma-play-teacher-aid.js
Description: supports looma-teacher-aids.php

Programmer name: Skip
Date:
Revision: 1.0
Looma version 8.0
 */

'use strict';

window.onload = function () {
    // SPEAK button will read the whole slide,
    //     unless text is selected, in which case, it will speak the selected text
    $('button.speak').off('click').click(function () {
        var selection = document.getSelection().toString();
        if (!selection) selection = $('pre').text();
        console.log('Text file: speaking "' + selection + '"');
        LOOMA.speak(selection);
    });
};

