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

var submit, input, output;

function lookupword() {
    LOOMA.lookup(input.value, function(response) {output.innerHTML = response.def;});
    };

window.onload = function ()
    {
        submit = document.getElementById("submit");
        input  = document.getElementById("input");
        output = document.getElementById("output");

        submit.addEventListener('click', function(){lookupword();});
    };

