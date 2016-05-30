/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-activities.js
Description:
 */

'use strict';

function playActivity(event) {
    var button = event.currentTarget;
    //event.target may be the contained IMG or SPAN, not the BUTTON,
    //so use event.currentTarget which is always the element that the event is attached to,
    //even if a containing element gets the click

    //could instead catch the event in BUTTON during capture phase and do event.endPropagation() to keep it from propogating
    // something like $("button.play").on('click', playActivity, true);
    // and, event.stopPropogation(); in the playActivity() function

    //OLD CODE: in case click event has IMG or SPAN contained in the BUTTON, get the BUTTON element
    //if (button.nodeName != 'BUTTON') button = button.parentNode;
    LOOMA.playMedia(button);
};

$(document).ready (function() {
    $("button.play").click(playActivity);
});

