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


function lookupword(word) {

    $.ajax(
        "looma-dictionary-utilities.php",
        {
            type: 'GET',
            cache: false,
            crossDomain: true,
            dataType: "json",
            data: "cmd=lookup&word=" + encodeURIComponent($('#input').val().toLowerCase()),
            error: function(){return;},
            success: function(response) {$('#output').text(response.def);}
        });
};

window.onload = function ()
    {
        $('#submit').click(function(){lookupword();});

    };

