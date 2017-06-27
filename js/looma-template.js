/*
LOOMA javascript file
Filename: looma-media-controls.js
Description: supports looma-video.php, looma.audio.php, looma-lesson-present.php, et

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Feb 17
Revision: Looma 2.4
 */

'use strict';

window.onload = function ()
    {
        var button = document.getElementById("button");
        var input = document.getElementById("input");
        var output = document.getElementById("output");

        button.addEventListener('click', function(){lookupword;});
    };

function lookupword() {
    LOOMA.lookup(input.value, function(response) {output.text = response;});
};
