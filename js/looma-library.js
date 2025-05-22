/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-activities.js
Description:
 */

'use strict';

var $files;
var numFiles;
var pagesz;

var resultsShown = 0;
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


//////////////////////////////////////////////////////
////////////////  displayMoreResults()    ////////////
/////////// code from looma-library-search.js ////////
function displayMoreResults(results) {
    displayActivities($files, resultsShown+1, pagesz);
} //end displayMoreResults()

///////////////////////////////////////////////////////
////////////////  displayActivities()    //////////////
/////////////// code from looma-library-search.js /////

function displayActivities($files, next, count) {
    // append items in array 'results' into display div 'table' starting at 'next' and adding 'count' new items
    
    var last = Math.min(next + count - 1, numFiles);
    for (var i = next - 1; i <= last - 1; i++) {
        if ($files.list[i])
        LOOMA.makeActivityButton($files.list[i], $files.list[i]._id.$oid, $files.list[i].db, $files.list[i].mongoID, $('#file-list-table'));
    }
    resultsShown = last;  //careful: can exceed numfiles
    if (resultsShown < numFiles) $("#more").show(); else $("#more").hide();
    
} //end displayActivities()

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

    $("#top").hide();
    $("#more").hide();
    
    $("#top").click(function(){
        $("button.zeroScroll").click(function() { LOOMA.setStore ('libraryScroll', 0, 'session');});
        $("#main-container-horizontal").scrollTop(LOOMA.readStore('libraryScroll',    'session'));
        $("#search-term").focus();
    });
 
    $("#more").click(function(){  // changed 05 2025 to do client-side pagination of results display
        displayMoreResults();
    });
    
    if ($('#file-list-table')) {
        $files = $.parseJSON($('#file-list').html());
        numFiles = $files.count;
        pagesz = 24;    //NOTE (5/2025) pagesz is ignored by looma-databae-utilities.php cmd=search
                        // the client code [this file] can decide how and when to paginate
        resultsShown = 0;
    
        $("#top").show();
    
        displayActivities($files, 1, pagesz);
    } else $('#file-table').css('display','table');
  
});

