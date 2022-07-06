/*
LOOMA javascript file
Filename: looma-play-lesson.js
Description: supports includes/looma-play-lesson.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Jan 2017
Revision: Looma 2.4
*/

'use strict';
var $timeline;

var $imageHTML;
var $audioHTML;
var $videoHTML;
var $pdfHTML;
var $htmlHTML;

var video; //the video DOM element
var audio; //the audio DOM element

var first_ft;
var playing;
var $currentItem;
var $displayers;
var $viewer;
var $fullscreen;

function scrollTimeline($btn) {
    $('#timeline-container').animate({
        scrollLeft: $btn.outerWidth(true) * ($btn.index() - 9)
    }, 700);
}
function pause() {
    // $viewer.empty();
    //if ($('#video')) $('#video').each(this.pause()); //pause video if there it is playing
    playing = false;
    //$timeline.fadeIn(500);
    $('#pause').css('background-image', 'url("images/play-button.png")');
} //end pause()

function play($item) {
    
    //$(video).empty();
    $currentItem = $item;
    LOOMA.setStore('lesson-plan-index', $item.index(),'session');
    
    playing = true;
    $('#timeline button').removeClass('playing');
    $item.addClass('playing');
    scrollTimeline($item);
    
    ////// save the current time position in localstore
    
    //$timeline.fadeOut(500);  //this hides the timeline when playing media - decided to not hide the timeline [usability]
    
    playActivity($item.data('ft'),        $item.data('fn'),         $item.data('fp'),
                 $item.data('dn'),        $item.data('id'), "", $item.data('page'),
                 $item.data('epversion'), $item.data('ole'),        $item.data('grade'),
                $item.data('nfn'),       $item.data('npg'),        $item.data('lang'),
                $item.data('len'),       $item.data('nlen')
    );
} //end play()

function playActivity(ft, fn, fp, dn, id, ch, pg, version, oleID, grade, nfn, npn, lang, len, nlen) { //play the activity of type FT, named FN, in path FP, display-name DN
    // depending on FT, may use ID, CH (a ch_id) or pg (for PDFs)
    
    // plays the selected (onClick) timeline element (activity) in the $viewer div
    //NOTE: playActivity() should move to looma-utilities.js (??)
    
    restoreFullscreenControl(); //reset fullscreen operation in case video, which overrides normal fullscreen operation, has run
    $('#media-controls').hide();  // hide media controls
    $viewer.empty();
    
    switch (ft) {
        case "image":
        case "jpg":
        case "png":
        case "gif":
            
            //  $(imageHTML(fp, fn)).appendTo($viewer);
            $('.speak, .lookup').hide();
            $imageHTML.attr('src', fp + fn);
            $imageHTML.appendTo($viewer);  //NOTE: $viewer should be a parameter to playActivity() [so it can have any name]
            break;
        
        case "video":
        case "mp4":
        case "mp5":
        case "m4v":
        case "mov":
            
            $videoHTML.find('source').attr('src', fp + fn);
            $videoHTML.find('video').attr('poster', fp + fn.substr(0,
                fn.lastIndexOf('.')) + '_thumb.jpg');
            $videoHTML.appendTo($viewer);
            $('.speak, .lookup').hide();
            $('#video')[0].load();  //unloads any previous video being played and loads this video since we just changed <source>
            $('.play-pause').css('background-image', 'url("images/video.png")');
            $('#media-controls').show();  // show media controls
            attachMediaControls($('#video')[0]); //hook up event listeners to the audio and video HTML
            modifyFullscreenControl();
            break;
        
        case "audio":
        case "mp3":
        case "m4a":
            
            //$(audioHTML(fp, fn, dn)).appendTo($viewer);
            $audioHTML.find('source').attr('src', fp + fn);
            $audioHTML.find('#songname').text(dn);
            $audioHTML.appendTo($viewer);
            $('.speak, .lookup').hide();
            $('.play-pause').css('background-image', 'url("images/video.png")');
            $('#media-controls').show();  // show media controls
            attachMediaControls($('#audio')[0]); //hook up event listeners to the audio and video HTML
            modifyFullscreenAudio();
            break;
    
        case 'EP':
        case 'epaath':
        
            $('.speak, .lookup').show();
            if (version==2019) {
                var prefix = 'ePaath/';
                if (grade=='grade7' || grade == 'grade8') prefix += 'EPaath7-8/';
                $htmlHTML.find('embed').attr('src', prefix + 'start.html?id=' + oleID + '&lang=' + lang + '&grade=' + grade.substring(5));
            } else   if (version==2022) {
                var prefix = 'ePaath/ePaath2022/';
                $htmlHTML.find('embed').attr('src', prefix + 'start.html?id=' + oleID + '&lang=' + lang + '&grade=' + grade.substring(5));
            }
            else
                $htmlHTML.find('embed').attr('src', 'content/epaath/activities/'+ fn + '/start.html');
        
            $htmlHTML.appendTo($viewer);
            break;
    
        case 'pdf':
        case 'chapter':
            
            $('.speak, .lookup').show();
    
            var pagenumber;
            var filename;
            var filepath;
            var length;
            if (language === 'native' && npn) {  //(used in lesson-present: if language=='native' then show NP chapter if available
                pagenumber = npn;
                filename = nfn;
                filepath = fp;
                length = nlen || 100;
            } else {
                pagenumber = pg;
                filename = fn;
                filepath = fp;
                length = len || 100;
            }


// *********  PAGE controls ***************
        
            enablePageControls();

// *********  ZOOM controls ***************
        
            enableZoomControls();
        
            $('#zoom-btn').click ( function(){$('#zoom-dropdown').toggle();});
        
            $('.zoom-item').click( /*async*/ function() {
                var zoom = $(this).data('zoom');
                var level = $(this).data('level');
                /*await*/ setZoom(level);
                $('#zoom-btn').text(zoom);
                $('#zoom-dropdown').hide();
            });

// *********  FULLSCREEN controls ***************
        
            $('#fullscreen-control').click(function () {
                if (document.fullscreenElement) {
                    //currentScale = currentScale * 1 / 1.08;
                    $('#pdf').css("transform","scale(1.00");
                    //$('#pdf').css( overflowX, "auto");
                }
                else {
                    //currentScale = currentScale * 1.08;
                    $('#pdf').css("transform","scale(1.25");
                    //$('#pdf').css( overflowX, "none");
                }
                LOOMA.toggleFullscreen;
            
                //NOTE: maybe dont have to re-draw?? seems to work fine without
                // drawMultiplePages(pdfdoc, startPage, endPage);
            
                return false;
            });

// *********  SCROLL controls ***************
        
            enableScrollDetect();
        
            // the SETINTERVAL call de-bounces scroll events, so the handler "getScrolledPage" is only called every "wait" msec
            setInterval(function() {
                if ( didScroll ) {getScrolledPage();didScroll = false; }
            }, 1000);
        
            $('#find').change(); //FIND operation not implemented this version
        
        
            pdfjsLib.getDocument(filepath + filename).promise.then(
                async function(doc) {
                    pdfdoc = doc;
                    startPage = pagenumber;
                    maxPages = doc._pdfInfo.numPages || 1;
                    //if (endPage > maxPages) endPage = maxPages;
                    endPage = startPage + length;
                    $('#maxpages').text(endPage - startPage + 1);
                    console.log('loaded file ' + filepath + filename + ' with ' + maxPages + ' pages');
            
                    makePageDivs(doc, startPage, endPage);
            
                    // displayFirstPage(doc,startPage);
            
                    await drawMultiplePages(doc, startPage, endPage).promise;
                    showPageNum(startPage);
                    //turnOnControls();
                }).then( () =>  {drawThumbs();});
    
            //$('#pdf').clone().attachTo($viewer);
            $viewer.empty().append( $('#pdf').clone() );
            /*
                $pdfHTML.find('iframe').attr('src',
                'pdf?fn=' + filename + '&fp=' + fp + '&page=' + pagenumber + '&len=' + length + '&zoom=' + 2.3
                );
                $pdfHTML.appendTo($viewer);
                
             */
            break;
        
        case 'text':
            
            $('.speak, .lookup').show();
            textHTML(id);
            break;
        
        case 'html':
        case 'HTML':
            $htmlHTML.find('embed').attr('src', fp + fn);
            
            $htmlHTML.appendTo($viewer);
            break;
        

        case 'looma':
            window.location = $currentItem.data('url');
            break;
        
        case 'evi':
            window.location = 'looma-play-edited-video.php?id=' + $currentItem.data('id') + '&dn=' + $currentItem.data('dn');
            break;
        
        case 'history':
            openPage($currentItem, 'histories', 'history');
            break;
        
        case 'slideshow':
            openPage($currentItem, 'slideshows', 'slideshow');
            //window.location = 'looma-play-slideshow.php?id=' + $currentItem.data('id');
            break;
        
        case 'map':
            openPage($currentItem, 'maps', 'map');
            //window.location = 'looma-map.php?id=' + $currentItem.data('id');
            break;
        
        case 'game':
            openPage($currentItem, 'games', 'game');
            break;
        
        //NOTE, cannot "play" ft == 'lesson' with a lesson
        
        default:
            $viewer.html('<div class="error-message">File not found</div>');
            console.log("ERROR: in playActivity(), unknown type: " + ft);
            break;
    } //end SWITCH(ft)
    /*other file types:

    case "evi":
        //evi = edited video indicator
        //If you click on an edited video it sends the filename, location and the information
        //to looma-edited-video.php
        window.location = 'looma-edited-video.php?fn=' + button.getAttribute('data-fn') +
        '&fp=' + button.getAttribute('data-fp') +
        '&id=' + button.getAttribute('data-id') +
        '&dn=' + button.getAttribute('data-dn');
        break;
     */

} //end playActivity()
/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
function makesortable() {
    //$('timelineDisplay').sortable( "destroy" ); //remove previous sortable state
    $("#timeline").sortable({
        opacity: 0.7,   // makes dragged element transparent
        revert: true,   //Animates the drop
        axis:   "x",
        scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
        handle: $(".activityDiv")  //restricts elements that can be clicked to drag to .timelinediv's
    });
    //.disableSelection();
}
function makeImageHTML() {
    return ('<img src="">');
}

function makePdfHTML() // see looma-play-pdf.php for original code
{
    
    //NEED to ADD pdf toolbar here
    
    return ('<div id="fullscreen"><iframe id="iframe"' +
        'id="pdf-canvas" ><p hidden id="parameters" data-fn= data-fp= data-pg=></p>' +
        '</iframe></div>');
};

function openPage(item, collection, url) {
    $.post("looma-database-utilities.php", {
            cmd: "openByID",
            collection: collection,
            id: item.data('id')
        },
        function(result) {
            var id;
            if ('$oid' in result['_id']) id = result['_id'].$oid;
           else
            id = result['_id'].$id;
            window.location =  url + '?id=' + id;
        },
        'json'
    );
}
function textHTML(id) {
    
    $.post("looma-database-utilities.php", {
            cmd: "openByID",
            collection: 'text',
            id: id
        },
        function(result2) {
            var $div = $('<div id="editor">');
            
            var native = (result2.nepali) ? result2.nepali : result2.data;
            var html = '<div class="text-display">' +
                '<div class="english">' + result2.data + '</div><div class="native" style="display:none;">' + native + '</div>';
        
            $(html).appendTo($div);
            $div.appendTo($viewer);
            
            if (language === 'native') {$('.english').hide();$('.native').show();}
            else               {$('.english').show();$('.native').hide();}
            //LOOMA.translate(language);
        },
        'json'
    );
}

function makeHtmlHTML() {
    return (
        '<div id="fullscreen"><embed src="" height=100% width=100%></div>'
    );
}
//function makeLoomaHTML() { return('<div id="fullscreen"><embed src="" height=100% width=100%></div>');};

function makeAudioHTML() {
    return (
        '<div id="audio-viewer"">' +
        '<br><br><br><br>' +
        '<h2>Looma Audio Player (<span id="songname"></span>)</h2>' +
        '<br><br><br><br>' +
        '<audio id="audio"><source src="" type="audio/mpeg">' +
        'Your browser does not support the audio element.' +
        '</audio>' +
        '</div>' +
        '</div>');
} //end audioHTML
function makeVideoHTML() {
    return (
        //'<div id="video-player">' +
        //  '<div id="video-area">' +
        '<video id="video">' +
        '<source id="video-source" src="" type="video/mp4">' +
        '</video>' //+
        // '</div>' +
        //'</div>' +
        //'</div>'
    
    );
} //end videoHTML

window.onload = function() {
    //$('#controlpanel').draggable(); //makes the control buttons moveable around the screen.
    
    //var language is declared in looma-utilities.js
    language = ($('#main-container-horizontal').data('lang')==='np'?'native':'english');
    
    $('.activity').removeClass('activity play img').addClass(
        'lesson-element');
    
    $timeline = $('#timeline');
    // $timeline.sortable({scroll: true, axis:"x"});
    
    
    makesortable(); //makes the timeline sortable
    
    $currentItem = null;
    $viewer = $('#viewer');
    $fullscreen = $('#fullscreen');
 
// NOTE:2022 07 05 [Skip] what is "displayers"? commented out for now
 //   $displayers = $('#displayers');$displayers.hide();
    
    // handlers for 'control panel' buttons
    $('#back, #prev-item, #back-fullscreen').click(function () {
        if ($currentItem.prev().is('button')) {
            play($currentItem.prev());
        } else pause();
    });
    $('#forward, #next-item, #forward-fullscreen').click(function () {
        if ($currentItem.next().is('button')) {
            play($currentItem.next());
        } else pause();
    });
    
    // enable right and left arrow keys to do forward and back on timeline
    $('body').keydown(function(e) {
        if (e.which === 37) {
            e.preventDefault();
            if ($currentItem.prev().data('ft')) play($currentItem.prev());
        }
        else if (e.which === 39 ) {
            e.preventDefault();
            if ($currentItem.next().data('ft')) play($currentItem.next());
        }
    });
    
    $('#pause').click(function () {
        if (playing) pause();
        else play($currentItem);
    });
    $('#return').click(function () {
        parent.history.back();
    });
    
    $timeline.on('click', 'button', function () {
        play($(this));
    });
    
    $('.tip').removeClass('yes-show');  // dont show normal hover popup
    
    $('.lesson-element img').hover(
        function () { //handlerIn
            var $btn = $(this).closest('button');
            $('#subtitle').text($btn.attr('data-dn') + ' (' + LOOMA.typename(
                $btn.attr('data-ft')) + ')');
        },
        function () { //handlerOut
            $('#subtitle').text('');
        }
    );
    
    // create HTML for various players for filetypes
    
    $imageHTML = $(makeImageHTML());
    $audioHTML = $(makeAudioHTML());
    $videoHTML = $(makeVideoHTML());
    $pdfHTML = $(makePdfHTML());
    $htmlHTML = $(makeHtmlHTML());
    
    video = $('#video', $videoHTML).get(0); //the video DOM element
    audio = $('#audio', $audioHTML).get(0); //the audio DOM element
//
    $('#media-controls').hide();  // hide media controls
    
    var index = LOOMA.readStore('lesson-plan-index', 'session');
    if (index) {
        $currentItem = $('#timeline').find('button:nth-child(' + (parseInt(index) + 1) + ')');
        $currentItem.focus();// put focus on timeline[index]
        $viewer.empty();
        //$('#media-controls').hide();  // hide media controls
    
    } else {
        first_ft = $('#timeline').find('button:first').data('ft');
        if (first_ft != 'history' && first_ft != 'map' &&
            first_ft != 'game' && first_ft != 'slideshow' &&
            first_ft != 'looma' && first_ft != 'evi') {
                play($('#timeline').find('button:first')); // automatically "play" the first item
        } else // else just focus on the first button
        {
            $currentItem = $('#timeline').find('button:first').focus();
        }
    }
    
    if ($.inArray($currentItem.data('ft'), ['game','map','history','slideshow']) === -1) play($currentItem);
    else scrollTimeline($currentItem);
    
}; //end window.onload
