/*
 * 
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0



filename: looma-activities.js
Description:
 */

'use strict';

function playMedia(button) {
    console.log("here");
    switch (button.getAttribute("data-ft")) {
        case "video":
        case "mp4":
        case "m4v":
        case "mov":
            window.location = 'looma-video.php?' +
                 'fn=' + button.getAttribute('data-fn') +
                '&fp=' + button.getAttribute('data-fp') +
                '&dn=' + button.getAttribute('data-dn');
            break;

        case "evi":
            //evi = edited video indicator
            //If you click on an edited video it sends the filename, location and the information
            //to looma-edited-video.php
            window.location = 'looma-edited-video.php?fn=' + button.getAttribute('data-fn') +
            '&fp=' + button.getAttribute('data-fp') +
            '&id=' + button.getAttribute('data-id') +
            '&dn=' + button.getAttribute('data-dn');
            break;

        case "image":
        case "jpg":
        case "png":
        case "gif":
            window.location = 'looma-image.php?fn=' + button.getAttribute(
                    'data-fn') +
                '&fp=' + button.getAttribute('data-fp');
            break;

        case "audio":
        case "mp3":
            window.location = 'looma-audio.php?fn=' + button.getAttribute(
                    'data-fn') +
                '&fp=' + button.getAttribute('data-fp') +
                '&dn=' + button.getAttribute('data-dn');
            break;

        case "pdf":      //PDF
        case "chapter":  //CHAPTER
            window.location = 'looma-pdf.php?fn=' + button.getAttribute('data-fn') +
                              '&fp=' + button.getAttribute('data-fp') +
                              '&zoom=' + button.getAttribute('data-zoom') +
                              '&pg=' + button.getAttribute('data-pg');
            break;

        case "slideshow":      // SLIDESHOW activity type from Thomas
            window.location = 'looma-slideshow.php?id=' + button.getAttribute("data-id");
            break;

        case "text":
            var id = encodeURIComponent(button.getAttribute('data-id'));
            window.location = 'looma-text.php?id=' + id;
            break;

        case "html":
            var fp = encodeURIComponent(button.getAttribute('data-fp'));
            var fn = encodeURIComponent(button.getAttribute('data-fn'));
            window.location = 'looma-html.php?fp=' + fp + '&fn=' + fn;
            break;

        case "map":
            var fn = encodeURIComponent(button.getAttribute('data-fn'));
            window.location = 'looma-map-' + fn + '.php';
            break;

        case "looma":
            var fp = encodeURIComponent(button.getAttribute('data-fp'));
            window.location = fp;
            break;

        case "epaath":
        case "EP":
            fp = encodeURIComponent(button.getAttribute('data-fp'));
            fn = encodeURIComponent(button.getAttribute('data-fn') +
                '/start.html');
            window.location = 'looma-html.php?fp=' + fp + '&fn=' + fn;

            /*window.location = button.getAttribute('data-fp') +
                              button.getAttribute('data-fn') +
                              "/start.html";
            */
            /*'looma-epaath.php?fn=' + button.getAttribute('data-fn') +
                               '&fp=' + button.getAttribute('data-fp');
                               */
            break;

        case "lesson":
            window.location = 'looma-lesson-present.php?id=' + button.getAttribute('data-id');
            break;

        default:
            console.log("ERROR: in LOOMA.playMedia(), unknown type: " +
                button.getAttribute("data-ft"));
    } //end SWITCH
};

function thumbnail (filename, filepath, filetype) {
            //builds a filepath/filename for the thumbnail of this "filename" based on type
            var thumbnail_prefix;
            var path;
            var imgsrc;
            var homedirectory = '../';

            imgsrc = "";

            if (filetype == "mp3") {  //audio
                if (filepath) path = filepath; else path = homedirectory + 'content/audio/';
                imgsrc = path + "thumbnail.png";
            }
            else if (filetype == "mp4" || filetype == "mp5" || filetype == "m4v" || filetype == "mov" || filetype == "video") { //video
                thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
                if (filepath) path = filepath; else path = homedirectory + 'content/videos/';
                imgsrc = path + thumbnail_prefix + "_thumb.jpg";
            }
            else if (filetype == "jpg"  || filetype == "gif" || filetype == "png" || filetype == "image" ) { //picture
                thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
                if (filepath) path = filepath; else path = homedirectory + 'content/pictures/';
                imgsrc = path + thumbnail_prefix + "_thumb.jpg";
            }
            else if (filetype == "pdf") { //pdf
                thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
                if (filepath) path = filepath; else path = homedirectory + 'content/pdfs/';
                imgsrc = path + thumbnail_prefix + "_thumb.jpg";
            }
            else if (filetype == "html") { //html
                thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
                if (filepath) path = filepath; else path = homedirectory + 'content/html/';
                imgsrc = path + thumbnail_prefix + "_thumb.jpg";
            }
            else if (filetype == "EP") {
                imgsrc = homedirectory + "content/epaath/activities/" + filename + "/thumbnail.jpg";
            }
            else if (filetype == "text") {
                imgsrc = "images/textfile.png";
            }
            else if (filetype == "slideshow") {
                imgsrc = "images/play-slideshow-icon.png";
            }
            else if (filetype == "looma") {
                imgsrc = item.thumb;
            };

            return imgsrc;
};

function getDefaultFilePath(filetype, filename) {
    var homedirectory = '../';
    var path;

    switch (filetype) {
        case "mp3": //audio
            path = homedirectory + "content/audio/";
            break;

        case "mp4": //video
        case "video":
        case "m4v":
        case "mov":
        case "mp5":
            path = homedirectory + "content/videos/";
            break;

        case "jpg": //picture
        case "gif":
        case "png":
        case "image":
            path = homedirectory + "content/pictures/";
            break;

        case "pdf": //pdf
            path = homedirectory + "content/pdfs/";
            break;

        case "html": //html
            path = homedirectory + "content/html/";
            break;
        case "textbook":
            path = homedirectory + "content/textbooks/";
            break;

        default:
            path = "";
    }
    return path;
};

function makeActivityButton (id, appendToDiv) {
    // given an ID for an activity in the activities collection in mongo,
    // attach a button [clickable button that launches that activity] to "appendToDiv"

    //post to looma-database-utilities.php with cmd='openByID' and id=id
    // and result function makes a DIV and calls "succeed(div)"
    $.post("looma-database-utilities.php",
       {cmd: 'openByID', collection: 'activities', id: id},
       function(result) {
               var fp = (result.fp) ? result.fp : getDefaultFilePath(result.ft, result.fn);
               var $newButton = $(
                       '<button class="activity play img" ' +
                       'data-fn="' + result.fn + '" ' +
                       'data-fp="' + fp + '" ' + 
                       'data-ft="' + result.ft + '" ' +
                       'data-dn="' + result.dn + '" >'
                  );

               var thumb;
               if(result.ft == "looma") {thumb = result.thumb;} 
               else {thumb = thumbnail(result.fn, result.fp, result.ft);};

               $newButton.append($('<img src="' + thumb + '">'));
               $newButton.append($('<span>').text(result.dn));
               $newButton.click(function() {playMedia(this);});
               $newButton.appendTo(appendToDiv);

               //need to attach clickhandler (LOOMA.playMedia)
           },
       'json'
     );
}; //end makeActivityButton()

function makeChapterButton (id, appendToDiv) {
    $.post("looma-database-utilities.php",
        {cmd: 'openByID', collection: 'chapters', id: id},
        function(result) {
            console.log(result);
            var subj = getSubj(id), grade = id.charAt(0)

            var fn = subj + "-" + grade;
            var fp = getDefaultFilePath('textbook') + "Class" + grade + "/" + subj + "/";
            var pn = (result['pn']) ? result['pn'] : result['npn'];

            var $newButton = $(
                '<button class="chapter play img" ' +
                'data-fn="' + fn +'.pdf" ' +
                'data-fp="' + fp + '" ' + 
                'data-ft="chapter" ' +
                'data-zoom="100" ' +
                'data-pg="' + pn + '" >'
            );

            var thumbEnd = (result['pn']) ? "_thumb.jpg" : "-Nepali_thumb.jpg";
            var thumb = fp + fn + thumbEnd;
            $newButton.append($('<img src="' + thumb + '">'));
            $newButton.append($('<span>').text(result.dn));
            $newButton.click(function() {playMedia(this);});
            $newButton.appendTo(appendToDiv);
        },
        'json'
    );
};//end makeChapterButton()

function getSubj(id) {
    var subject;

    var s = id.charAt(1);
    switch (s) {
        case 'N':
            subject = "Nepali";
            break;
        case 'E':
            subject = "English";
            break;
        case 'M':
            subject = "Math";
            break;
        case 'S':
            if(id.charAt(2) != 'S')
                subject = "Science";
            else
                subject = "SocialStudies";
            break;
    }
    return subject;
};

function displayResults(results) {
    var $display = $('#results-div').empty().append('<h2 style="margin-bottom: 0;">Search Results:</h2>');

    var result_array = [];
        result_array['activities'] = [];
        result_array['chapters']  = [];

    results.forEach(function(e) {
            if (e['ft'] == 'chapter') result_array['chapters'].push(e);
            else                               result_array['activities'].push(e);
    });

    var chapResults = result_array['chapters'].length; 
    var actResults = result_array['activities'].length;

    $display.append("<p>Chapters(" + chapResults + ")  Activities(" + actResults + ")</p>");
    
    $display.append('<table id="results-table"></table>');

    if(actResults != 0)
        displayActivities(result_array['activities'], '#results-table');
    if(chapResults != 0)
        displayChapters(result_array['chapters'], '#results-table');

    $display.show();
}; //end displayFileSearchResults()
    
function displayActivities(results, table) {
    var result = 1, row = 0, maxButtons = 3;

    $.each(results, function(index, value) {
            if(result % maxButtons == 1){
                row++;
                $(table).append("<tr id='result-row-" + row + "'></tr>");
            }
            $('#result-row-' + row).append("<td id='query-result-" + result + "'></td>");
            makeActivityButton(value['_id']['$id'], '#query-result-' + result);
            result ++; 
           });
};

function displayChapters(results, table) {
    var result = 1, row = 0, maxButtons = 3;

    $.each(results, function(index, value) {
        if(result % maxButtons == 1){
            row++;
            $(table).append("<tr id='result-row-" + row + "'></tr>");
        }
        $('#result-row-' + row).append("<td id='query-result-" + result + "'></td>");
        makeChapterButton(value['_id'], '#query-result-' + result);
        result ++; 
    });            
};

function playActivity(event) {
    var button = event.currentTarget;

    //event.target may be the contained IMG or SPAN, not the BUTTON,
    //so use event.currentTarget which is always the element that the event is attached to,
    //even if a containing element gets the click

    // could instead catch the event in BUTTON during capture phase and 
    // do event.endPropagation() to keep it from propogating
    //
    // something like $("button.play").on('click', playActivity, true);
    // and, event.stopPropogation(); in the playActivity() function

    //OLD CODE: in case click event has IMG or SPAN contained in the BUTTON, get the BUTTON element
    //if (button.nodeName != 'BUTTON') button = button.parentNode;
    LOOMA.setStore('scroll', $("#main-container-horizontal").scrollTop(), 'session');
    console.log($("#main-container-horizontal").scrollTop());
    playMedia(button);
};

function changeCollection() {
    $('.media-filter').toggle();
    $('.chapter-filter').toggle();
};

function clearSearch() {

    if ($('#collection').val() == 'activities') {
        $('#search-term').val("");
        $(".flt-chkbx").each(function() { $(this).prop("checked", false); });
    } else {
        $("#grade-drop-menu").val("").change();
        $("#subject-drop-menu").val("").change();
    };
    $('#chapter-div').hide();
    $("#results-div").empty().hide();
};

function isFilterSet() {
    var set = false;

    if ($('#collection').val() == 'activities') {
        if ($('#search-term').val()){set = true;}
        $(".flt-chkbx").each( function() {if (this.checked) {set = true;}} );
    } else { //collection=='chapters'
    
        if ($("#grade-drop-menu").val() != "") {set = true;}
        else if ($("#subject-drop-menu").val() != "") {set = true;}
    };

    return set;
};

function refreshPage() {
    //start page on media search
    $('#collection').val('activities');
    $('#ft-media').prop('checked', true);
    $('#ft-chapter').prop('checked', false);
    
    //the chapter selector keeps popping up
    $('.chapter-filter').hide();

    //this is to keep the form from having unwanted inputs
    $('.chapter-input').prop('disabled', true);
    $('.media-input').prop('disabled',   false);

    //clear all search fields
    $('#search-term').val("");
    $(".flt-chkbx").each(function() { $(this).prop("checked", false); });
    $("#grade-drop-menu").val("").change();
    $("#subject-drop-menu").val("").change();
};

var scrollTimeout = null;
var scrollDebounce = 5000; //msec delay to debounce scroll stop

$(document).ready(function() {

    refreshPage();

    //changes the element that is clicked b4 it can change the collection
    //$('.filter-radio').click(function() {if(!this.checked)changeCollection();});   

    $('#ft-media').click(function() {
        if ($('#collection').val() == 'chapters'){ //changing from CHAPTERS to ACTIVITIES
            $('#collection').val('activities');  
            changeCollection(); 
            $('.chapter-input').prop('disabled', true);
            $('.media-input').prop('disabled',   false);
            $('#chapter-div').hide();
        }   
    });

    $('#ft-chapter').click(function() { //changing from ACTIVITIES to CHAPTERS
        if ($('#collection').val() == 'activities') {
            $('#collection').val('chapters'); 

            changeCollection(); 
            $('.chapter-input').prop('disabled', false);
            $('.media-input').prop('disabled',   true);

            $('#chapter-div').hide();
            if ( ($('#grade-drop-menu').val() != '') && ($('#subject-drop-menu').val() != '') )
                $('#chapter-div').show();
        }
    });

    $("#grade-drop-menu, #subject-drop-menu").change( function(){
        $('#chapter-div').hide();

        $('#chapter-drop-menu').empty();
        if ( ($('#grade-drop-menu').val() != '') && ($('#subject-drop-menu').val() != ''))
            $.post("looma-database-utilities.php",
                {cmd: "chapterList",
                 class: $('#grade-drop-menu').val(),
                 subject:   $('#subject-drop-menu').val()},

                 function(response) {
                     //$('#chapter_label').show();
                     $('#chapter-div').show();
                     $('<option/>', {value: "", label: "Select..."}).appendTo('#chapter-drop-menu');

                     $('#chapter-drop-menu').append(response);
                 },
                 'html'
              );
    });

    $('#search').submit(function( event ) {
        event.preventDefault();

        $('#results-div').empty().show();

        if (!isFilterSet()) {
            $('#results-div').html('please select at least 1 filter option before searching');
        } else {

            var loadingmessage = $("<p/>", {html : "Loading results"}).appendTo("#results-div");
            /*$('<span id="ellipsis1" class="ellipsis"></span>').appendTo(loadingmessage);

            var ellipsisTimer = setInterval(
                function () {$('#ellipsis1').text($('#ellipsis1').text().length < 10 ? $('#ellipsis1').text() + '.' : '');
                },100);*/

            $.post( "looma-database-utilities.php",
                    $("#search").serialize(),
                    function (result) {
                        loadingmessage.remove();
                        //clearInterval(ellipsisTimer);
                        displayResults(result);return;},
                    'json');
            
        }
    });

    $('#cancel-search').click(clearSearch);

    $("#toggle-database").click(function(){$('#dir-table').toggle();});//'fade', {}, 1000

    $("button.play").click(playActivity);

    $("button.zeroScroll").click(function() {LOOMA.setStore('scroll', 0, 'local');});
    $("#main-container-horizontal").scrollTop(LOOMA.readStore('scroll', 'session'));

});

