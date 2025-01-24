/*
LOOMA javascript file
Filename:    looma-play-lesson.js
Description: supports looma-play-lesson.php

Programmer name: Skip
Owner: Looma Education
Date: Jan 2017, AUG 2023
Revision 2023: Looma 3.0 revised AUG '23 for new Lesson Editor, new lesson format for textfiles and
          to get all types of timeline elements to play in iFrames rather than their own page
*/

'use strict';

var $imageHTML, $audioHTML ,$videoHTML, $htmlHTML;

var video, audio;
var chapter_language;

var ft;
var playing;

var $timeline;
var $currentItem;
var $viewer;
var $fullscreen;

//var comeback = false;  // set to TRUE when opening another page, but want to return to this lesson play page

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

/*function play($item) {
    
    //$(video).empty();
    $currentItem = $item;
    LOOMA.setStore('lesson-plan-index', $item.index(),'session');
    
    playing = true;
    $('#timeline button').removeClass('playing');
    $item.addClass('playing');
    scrollTimeline($item);
 
    if ($item.data('ft') === 'inline') {
                        $('#media-controls').hide();  // hide media controls
    
                        var $div = $('<div id="editor">');
                    
                        var native = ($item.data('nepali')) ? $item.data('nepali') : $item.data('html');
                        var html = '<div class="text-display">' +
                            '<div class="english">' + $item.data('html') + '</div><div class="native" style="display:none;">' + native + '</div>';
                    
                        $(html).appendTo($div);
                        $viewer.empty();
                        $div.appendTo($viewer);
                    
                        if (language === 'native') {$('.english').hide();$('.native').show();}
                        else               {$('.english').show();$('.native').hide();}
    } else
    playActivity($item.data('ft'),        $item.data('fn'),         $item.data('fp'),
                 $item.data('dn'),        $item.data('id'), "", $item.data('page'),
                 $item.data('epversion'), $item.data('ole'),        $item.data('grade'),
                 $item.data('nfn'),       $item.data('npg'),        $item.data('lang'),
                 $item.data('len'),       $item.data('nlen')
    );
} //end play()
*/
function play ($item) {
    var ft, fn, fp, dn, id, ch, pg, version, oleID, grade, nfn, npn, lang, len, nlen;
    ft = $item.data('ft');  lang = $item.data('lang');
    fn = $item.data('fn');  nfn = $item.data('nfn');
    fp = $item.data('fp');  dn = $item.data('dn');
    id = $item.data('id');  ch = $item.data('ch');
    pg = $item.data('page');  npn = $item.data('npn');
    version = $item.data('epversion'); oleID = $item.data('ole');
    grade = $item.data('grade');
    len = $item.data('len'); nlen = $item.data('nlen');

    // depending on FT, may use ID, CH (a ch_id) or pg (for PDFs)
    
    // plays the selected (onClick) timeline element (activity) in the $viewer div
    //NOTE: playActivity() should move to looma-utilities.js (??)
    $currentItem = $item;
    LOOMA.setStore('lesson-plan-index', $item.index(),'session');
    
    playing = true;
    $('#timeline button').removeClass('playing');
    $item.addClass('playing');
    scrollTimeline($item);
    restoreFullscreenControl(); //reset fullscreen operation in case video, which overrides normal fullscreen operation, has run
    //$('#fullscreen-playpause').hide();
    $('.looma-control-button').hide();
    $('#media-controls').hide();  // hide media controls
    $viewer.empty();
    
    switch (ft) {
        
        case "inline":
                $('#media-controls').hide();  // hide media controls
            $('#fullscreen-control, .speak, .lookup').show();
         
                var $div = $('<div id="editor">');
        
                var native = ($item.data('nepali')) ? $item.data('nepali') : $item.data('html');
                var html = '<div class="text-display">' +
                    '<div class="english">' + $item.data('html') + '</div><div class="native" style="display:none;">' + native + '</div>';
        
                $(html).appendTo($div);
                $viewer.empty();
                $div.appendTo($viewer);
        
                if (language === 'native') {$('.english').hide();$('.native').show();}
                else               {$('.english').show();$('.native').hide();}
                break;
        
        case "image":
        case "jpg":
        case "png":
        case "gif":
      
            $('#fullscreen-control').show();
            $imageHTML.attr('src', fp + fn);
            $imageHTML.appendTo($viewer);  //NOTE: $viewer should be a parameter to playActivity() [so it can have any name]
            break;
        
        case "video":
        case "mp4":
        case "mp5":
        case "m4v":
        case "mov":
            $('#fullscreen-control').show();
            $('#fullscreen-playpause').show();
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
            $('#fullscreen-playpause').show();
            break;
        
        case "audio":
        case "mp3":
        case "m4a":
    
            $('#fullscreen-control').show();
            $('#fullscreen-playpause').show();//$(audioHTML(fp, fn, dn)).appendTo($viewer);
            $audioHTML.find('source').attr('src', fp + fn);
            $audioHTML.find('#songname').text(dn);
            $audioHTML.appendTo($viewer);
            $('.speak, .lookup').hide();
            $('.play-pause').css('background-image', 'url("images/video.png")');
            $('#media-controls').show();  // show media controls
            attachMediaControls($('#audio')[0]); //hook up event listeners to the audio and video HTML
            modifyFullscreenAudio();
            $('#fullscreen-playpause').show();
            break;
    
        case 'EP':
        case 'ep':
        case 'epaath':
        
            $('#fullscreen-control, .speak, .lookup').show();
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
    
            $('#fullscreen-control, .speak, .lookup').show();
    
            var pagenumber = 1;
            var filename = fn;
            var filepath = fp;
            var length;
            if ( ft === 'chapter') {
                if (chapter_language === 'native' && npn) {  //(used in lesson-present: if language=='native' then show NP chapter if available
                    pagenumber = npn;
                    filename = nfn;
                    filepath = fp;
                    length = nlen || 100;
                } else {
                    pagenumber = pg;
                    length = len || 100;
                }
            } else length = 0;

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
                $('#next-item, #prev-item').show();
    
    
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
                    maxPages = (length > 0) ? length : doc._pdfInfo.numPages;
                    //if (endPage > maxPages) endPage = maxPages;
                    endPage = startPage + maxPages - 1;
                    $('#maxpages').text(endPage - startPage + 1);
                    console.log('loaded file ' + filepath + filename + ' with ' + maxPages + ' pages');
            
                    makePageDivs(doc, startPage, endPage);
            
                    // displayFirstPage(doc,startPage);
            
                    await drawMultiplePages(doc, startPage, endPage).promise;
                    showPageNum(startPage);
                    //turnOnControls();
                }).then( () =>  {drawThumbs();});
        
            $viewer.empty().append( $('#pdf').clone() );  //  .attr('id', 'pdfnew')
            break;
    
        case 'text':
    
            $('#fullscreen-control, .speak, .lookup').show();
            textHTML(id);
            break;
            
        case 'html':
        case 'HTML':
            $('#fullscreen-control, .speak, .lookup').show();
            $htmlHTML.find('embed').attr('src', fp + fn);
            
            $htmlHTML.appendTo($viewer);
            break;
            
        case 'looma':
          //  comeback = true;
          //  LOOMA.setStore('lesson-plan-index', $currentItem.index()+1,'session');
         $('<iframe src="' + $currentItem.data('url') + '?toolbar=no" ></iframe>')
                .appendTo('#viewer');
            
          //  $('#viewer').load($currentItem.data('url') + '?toolbar=no');
           // window.location = $currentItem.data('url');
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

    $('#next-item, #prev-item').show();

} //end playActivity()

function openPage(item, collection, url) {
    $.post("looma-database-utilities.php", {
            cmd: "openByID",
            collection: collection,
            id: item.data('id')
        },
        function(result) {
            var id;
            if ('$oid' in result['_id']) id = result['_id'].$oid;
           else                          id = result['_id'].$id;
           // comeback = true;
           // LOOMA.setStore('lesson-plan-index', $(item).index()+1,'session');
  
    $('#fullcreen-control').show();
    
          //  $('#viewer').append($("<iframe id='iframe' src='" + url + "?id=" + id + "&toolbar=no"));
            if ( url === 'slideshow')
                $('<iframe src="' + 'slideshow' + '?id=' + id + '" style="height:100%;"></iframe>')
                    .appendTo('#viewer');
            else        $('<iframe src="' + url + '?id=' + id + '&toolbar=no" ></iframe>')
                .appendTo('#viewer');
         //   $('#viewer').load(url + '?id=' + id + '&toolbar=no');
           // window.location =  url + '?id=' + id + '&toolbar=no';
        },
        'json'
    );
} // end openPage()

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

function makePdfHTML() {   // see looma-play-pdf.php for original code

    return ('<div id="fullscreen"><iframe id="iframe"' +
        'id="pdf-canvas" ><p hidden id="parameters" data-fn= data-fp= data-pg=></p>' +
        '</iframe></div>');
};

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
   // $currentItem = null;
    $viewer = $('#viewer');
    $fullscreen = $('#fullscreen');
    $timeline = $('#timeline');
    
    $('#media-controls').hide();
    // create HTML for various players for filetypes
    
    $imageHTML = $(makeImageHTML());
    $audioHTML = $(makeAudioHTML());
    $videoHTML = $(makeVideoHTML());
    $htmlHTML  = $(makeHtmlHTML());
    
    video = $('#video', $videoHTML).get(0); //the video DOM element
    audio = $('#audio', $audioHTML).get(0); //the audio DOM element
    
    chapter_language = ($('#lesson-container').data('lang')==='np'?'native':'english');
    
    $('.activity').removeClass('activity play img').addClass('lesson-element');
    
    makesortable(); //makes the timeline sortable

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
    
    $timeline.off('click', 'button');
    $timeline.on ('click', 'button', function () { play($(this));});
    
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
    
    window.onbeforeunload = function () {
       // if ( ! comeback )
            LOOMA.setStore('lesson-plan-index', 0,'session');
    };
    
    var index = LOOMA.readStore('lesson-plan-index', 'session');
   
    if (index)  $currentItem = $('#timeline').find('button:nth-child(' + (parseInt(index) + 1) + ')');
    else        $currentItem = $('#timeline').find('button:first');
    
    $viewer.empty();
    $currentItem.focus();
    scrollTimeline($currentItem);
    ft = $currentItem.data('ft');
    play($currentItem);
    
}; //end window.onload
