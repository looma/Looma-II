/*
author: Skip, Bo
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03, 2017 07
Revision: Looma 3.0

filename: looma-library-search.js
Description:
 */

'use strict';

var result = 1, row = 0, maxButtons = 3;

////////////////////////////////
/////  clearResults()    /////
////////////////////////////////
function clearResults(results) {
    $('#results-div').empty();
    $("#top").hide();
    $("#more").hide();
}; //end clearResults()

////////////////////////////////
/////  displayResults()    /////
////////////////////////////////
    function displayResults(results) {
    var $display = $('#results-div').empty().append('<h2 style="margin-bottom: 0;">Search Results:</h2>');

    var result_array = [];
        result_array['activities'] = [];
        result_array['chapters']  = [];

    results.forEach(function(e) {
            if (e['ft'] == 'chapter') result_array['chapters'].push(e);
            else                      result_array['activities'].push(e);
    });

    $("#top").show();
    if (result_array.length % pagesz === 0) $("#more").show();
    
    var chapResults = result_array['chapters'].length;
    var actResults = result_array['activities'].length;

    $display.append("<p> Activities(<span id='count'>" + actResults + "</span>)</p>");
    
    $display.append('<table id="results-table"></table>');

    if(actResults != 0)
        displayActivities(result_array['activities'], '#results-table');
    if(chapResults != 0)
        displayChapters(result_array['chapters'], '#results-table');

    $display.show();
    
   // $('#results-div').off('click','button.play').on('click', "button.play", playActivity);
    
}; //end displayResults()

////////////////////////////////
/////  displayMoreResults()    /////
////////////////////////////////
function displayMoreResults(results) {
    
    var result_array = [];
    result_array['activities'] = [];
    result_array['chapters']  = [];
    
    results.forEach(function(e) {
        if (e['ft'] == 'chapter') result_array['chapters'].push(e);
        else                      result_array['activities'].push(e);
    });
    
    $("#top").show();
    if (result_array['activities'].length % pagesz === 0) $("#more").show();
    
    //var chapResults = result_array['chapters'].length;
    //var actResults = result_array['activities'].length;
    
    //$display.append("<p> Activities(<span id='count'>" + actResults + ")</span></p>");
    $('#results-div').find('#count').text(parseInt($('#results-div').find('#count').text()) + result_array['activities'].length);
    
    if(result_array['activities'].length > 0)
        displayActivities(result_array['activities'], '#results-table');
    /*
    if(chapResults != 0)
        displayChapters(result_array['chapters'], '#results-table');
    */
    
    
    
}; //end displayMoreResults()

///////////////////////////////////
/////  displayActivities()    /////
///////////////////////////////////
function displayActivities(results, table) {
    $.each(results, function(index, value) {
            if(result % maxButtons == 1){
                row++;
                $(table).append("<tr id='result-row-" + row + "'></tr>");
            }
            //console.log(value);
            $('#result-row-' + row).append("<td id='query-result-" + result + "'></td>");

            var mongoID = (value['mongoID']) ? value['mongoID']['$id'] : "";
            LOOMA.makeActivityButton(value['_id']['$id'], mongoID, '#query-result-' + result);
            result ++;
           });
}; //end displayActivities()

/////////////////////////////////
/////  displayChapters()    /////
/////////////////////////////////
function displayChapters(results, table) {
    var result = 1, row = 0, maxButtons = 3;

    $.each(results, function(index, value) {
        if(result % maxButtons == 1){
            row++;
            $(table).append("<tr id='result-row-" + row + "'></tr>");
        }
        $('#result-row-' + row).append("<td id='query-result-" + result + "'></td>");
        LOOMA.makeChapterButton(value['_id'], '#query-result-' + result);
        result ++;
    });
}; //end displayChapters()


function playActivity(event) {
    var button = event.currentTarget;
    
    //event.target may be the contained IMG or SPAN, not the BUTTON,
    //so use event.currentTarget which is always the element that the event is attached to,
    //even if a containing element gets the click
    
    //could instead catch the event in BUTTON during capture phase and do event.endPropagation() to keep it from propogating
    // something like $("button.play").on('click', playActivity, true);
    // and, event.stopPropogation(); in the playActivity() function
    
    saveSearchState();  // saves scroll position and search form settings
    LOOMA.playMedia(button);
};

$(document).ready (function() {
    
    pagesz = 24;
    $("#search").find("#pagesz").val(pagesz);
    //$("#search").find("#pageno").val(pageno);
    
    // format the TYPES ckeckboxes by inserting a <br>
    $("#type-div > span:nth-child(7)").after("<br/>");
    
    //$("button.play").click().off().click(playActivity);
    $('#results-div').on('click', "button.play", playActivity);
    
    $("#toggle-database").click(function(){saveSearchState(); window.location = "looma-library.php";});//'fade', {}, 1000
    
    $("#top").hide();
    $("#more").hide();
    
    $("#top").click(function(){
        $("button.zeroScroll").click(function() { LOOMA.setStore ('libraryScroll', 0, 'session');});
        $("#main-container-horizontal").scrollTop(LOOMA.readStore('libraryScroll',    'session'));
    });
    
    $("#more").click(function(){
        pagesz = 24;
        sendSearchRequest ($("#search"), displayMoreResults);
    });
    
    $("button.zeroScroll").click(function() { LOOMA.setStore ('libraryScroll', 0, 'session');});
    $("#main-container-horizontal").scrollTop(LOOMA.readStore('libraryScroll',    'session'));
    
});

