/*
 * Name: Skip

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
    LOOMA.setStore('libraryScroll', $("#main-container-horizontal").scrollTop(), 'session');
    LOOMA.playMedia(button);
};

//var scrollTimeout = null;
//var scrollDebounce = 5000; //msec delay to debounce scroll stop

$(document).ready (function() {
    $("button.play").click(playActivity);
    $("#toggle-database").click(function(){window.location = "looma-library-search.php";});//'fade', {}, 1000
    
    
    $('a.book').click(function(){
        LOOMA.setStore('chapterScroll', 0, 'session');
        LOOMA.setStore('chapter', 0, 'session');
    });
    
    $("button.zeroScroll").click(function() { LOOMA.setStore ('libraryScroll', 0, 'session');});
    $("#main-container-horizontal").scrollTop(LOOMA.readStore('libraryScroll',    'session'));
 
    toolbar_button_activate("library");

});

