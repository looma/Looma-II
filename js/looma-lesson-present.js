/*
LOOMA javascript file
Filename: looma-lesson-present.js
Description: supports includes/looma-lesson-present.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Jan 2017
Revision: Looma 2.4
*/

'use strict';

window.onload = function ()
    {
        //$('#controlpanel').draggable(); //makes the control buttons moveable around the screen.

        $('.activity').removeClass('activity play img').addClass('lesson-element');

        var $timeline = $('#timeline');
       // $timeline.sortable({scroll: true, axis:"x"});

    /*                            /////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
                        var makesortable = function() {
                            //$('timelineDisplay').sortable( "destroy" ); //remove previous sortable state
                            $("#timelineDisplay").sortable({
                                opacity: 0.7,   // makes dragged element transparent
                                revert: true,   //Animates the drop
                                axis:   "x",
                                scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
                                handle: $(".activityDiv")  //restricts elements that can be clicked to drag to .timelinediv's
                            }).disableSelection();
                        };
      */

        var playing;
        var $currentItem;
        var $viewer = $('#viewer');

        // handlers for 'control panel' buttons
        $('#back').click( function()    {
            if ($currentItem.prev().is('button')) { play($currentItem.prev()); } else pause();});
        $('#forward').click( function() {
            if ($currentItem.next().is('button')) { play($currentItem.next()); } else pause(); });
        $('#pause').click( function()   { if (playing) pause(); else play($currentItem); });
        $('#dismiss').click( function() { parent.history.back(); });

        $timeline.on('click', 'button', function() { play($(this)); });

        $('.lesson-element img').hover(
            function() {  //handlerIn
                var $btn = $(this).closest('button');
                $('#subtitle').text($btn.attr('data-dn') + ' (' + LOOMA.typename($btn.attr('data-ft')) + ')');},
            function () { //handlerOut
              $('#subtitle').text('');}
        );

 // create HTML for various players for filetypes

        var $imageHTML = $(makeImageHTML());
        var $audioHTML = $(makeAudioHTML());
        var $videoHTML = $(makeVideoHTML());
        var $pdfHTML   = $(makePdfHTML());
        var $htmlHTML  = $(makeHtmlHTML());

        var video = $('#video', $videoHTML).get(0); //the video DOM element
        var audio = $('#audio', $audioHTML).get(0); //the audio DOM element

        play($('#timeline').find('button:first')); // automatically "play" the first item

        function scrollTimeline($btn) {
            $('#timeline').animate( { scrollLeft: $btn.outerWidth(true) * ( $btn.index() - 2 ) }, 100);
        };

        function pause() {
            // $viewer.empty();
            //if ($('#video')) $('#video').each(this.pause()); //pause video if there it is playing
            playing = false;
            //$timeline.fadeIn(500);
            $('#pause').css('background-image', 'url("images/play-button.png")');
        }; //end pause()

        function play($item) {
            $viewer.empty();
            $currentItem = $item;
            playing = true;
            $('#timeline button').removeClass('playing');
            $item.addClass('playing');
            scrollTimeline($item);
            $('#pause').css('background-image', 'url(" images/pause-button.png")');
            //$timeline.fadeOut(500);  //this hides the timeline when playing media - decided to not hide the timeline [usability]

            playActivity($item.data('ft'), $item.data('fn'), $item.data('fp'), $item.data('dn'), $item.data('id'), "", $item.data('pg'));
        }; //end play()

        function playActivity(ft, fn, fp, dn, id, ch, pg) {//play the activity of type FT, named FP, in path FP, display-name DN
                                                          // depending on FT, may use ID, CH (a ch_id) or pg (for PDFs)
                                                          //NOTE: playActivity() should move to looma-utilities.js (??)

                // plays the selected (onClick) timeline element (activity) in the $viewer div

            restoreFullscreenControl(); //reset fullscreen operation in case video, which overrides normal fullscreen operation, has run

            switch (ft) {
                case "image":
                case "jpg":
                case "png":
                case "gif":

                  //  $(imageHTML(fp, fn)).appendTo($viewer);
                    $imageHTML.attr('src', fp + fn);
                    $imageHTML.appendTo($viewer);
                    break;
                case "video":
                case "mp4":
                case "mp5":
                case "m4v":
                case "mov":

                    //$(videoHTML(fp, fn, dn)).appendTo($viewer);
                    $videoHTML.find('source').attr('src', fp + fn);
                    $videoHTML.find('video').attr('poster',  fp + fn.substr(0, fn.indexOf('.')) + '_thumb.jpg');
                    $videoHTML.appendTo($viewer);
                    attachMediaControls();  //hook up event listeners to the audio and video HTML
                    attachFullscreenPlayPauseControl();
                    modifyFullscreenControl();

                   break;
                case "audio":
                case "mp3":

                    //$(audioHTML(fp, fn, dn)).appendTo($viewer);
                    $audioHTML.find('source').attr('src', fp + fn);
                    $audioHTML.find('#songname').text(dn);
                    $audioHTML.appendTo($viewer);
                    attachMediaControls();  //hook up event listeners to the audio and video HTML
                    break;
                case 'pdf':
                case 'chapter':


                    $pdfHTML.find('iframe').attr('src', 'looma-viewer.html?file=' + fp + fn + '#page=' + pg + '&zoom=160');
                    $pdfHTML.appendTo($viewer);
                    break;

                case 'text':

                    textHTML(id);

                    break;

                 case 'html':
                 case 'EP':
                 case 'epaath':

                    //$(htmlHTML(fp,fn, dn)).appendTo($viewer);
                    $htmlHTML.find('embed').attr('src', fp + fn);
                    $htmlHTML.appendTo($viewer);
                    break;

                 case 'looma':
                    window.location = $currentItem.data('url');
                    break;

                case 'evi':
                case 'slideshow':
                case 'map':
                case 'EP':
                    break;

                default:
                   console.log("ERROR: in playActivity(), unknown type: " + ft);
                   break;
            };  //end SWITCH(ft)


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

        case "slideshow":      // SLIDESHOW activity type from Thomas
            window.location = 'looma-slideshow.php?id=' + button.getAttribute("data-id");
            break;

        case "map":
            var fn = encodeURIComponent(button.getAttribute('data-fn'));
            window.location = 'looma-map-' + fn + '.php';
            break;

        case "looma":
            var fp = encodeURIComponent(button.getAttribute('data-fp'));
            window.location = fp;
            break;

         */

        }; //end playActivity()

        function makeImageHTML() { return('<img id="fullscreen" src="">');};

       // function makePdfHTML() {return('<embed id="fullscreen" src="" height=100% width=100%>');};


       function makePdfHTML() // see looma-pdf.php for original code
        { return ('<div id="fullscreen"><iframe id="iframe"' +
                 'id="pdf-canvas" ><p hidden id="parameters" data-fn= data-fp= data-pg=></p>' +
                '</iframe></div>');
        };  //end makePdfHTML()


        function textHTML(id) {
             $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: 'activities', id: id},
                function(result1) {
                    $.post("looma-database-utilities.php",
                    {cmd: "openByID", collection: 'text', id: result1.mongoID.$id},
                    function(result2) {
                        $('<div id="fullscreen" style="background-color:white;color:black;">').append($(result2.data)).appendTo($viewer);
                       //  $(result2.data).appendTo($viewer);
                    },
                    'json'
                  );
                },
                'json'
              );
        };

        function makeHtmlHTML() { return('<div id="fullscreen"><embed src="" height=100% width=100%></div>');};

        //function makeLoomaHTML() { return('<div id="fullscreen"><embed src="" height=100% width=100%></div>');};

        function makeAudioHTML() { return(
            '<div id="fullscreen">' +
                '<div id="audio-viewer"">' +
                    '<br><br><br><br>' +
                    '<h2>Looma Audio Player (<span id="songname"></span>)</h2>' +
                    '<br><br><br><br>' +
                    '<audio id="audio"><source src="" type="audio/mpeg">' +
                    'Your browser does not support the audio element.' +
                    '</audio>' +
                '</div>' +
              '<div id="media-controls">' +
                  '<div id="time" class="title">0:00</div>' +
                  '<br><button type="button" class="media play-pause"></button>' +
                  '<input type="range"       class="video seek-bar" value="0" style="display:inline-block">' +
                  '<br><button type="button" class="media mute">Volume</button>' +
                  '<input type="range"       class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block">' +
              '</div>' +
            '</div>');
        }; //end audioHTML

        function makeVideoHTML() { return (
                 '<div id="video-player">' +
                    '<div id="video-area">' +
                        '<div id="fullscreen">' +
                            '<video id="video">' +
                                '<source id="video-source" src="" type="video/mp4">' +
                            '</video>' +
                    '</div></div></div>' +
                '<div id="title-area"><h3 id="title"></h3></div>' +
                '<div id="media-controls">' +

                    '<button id="fullscreen-playpause"></button>' +
                    '<div id="time" class="title">0:00</div>' +
                    '<button type="button" class="media play-pause"></button>' +
                    '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                    '<button type="button" class="media mute">Volume</button>' +
                    '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div>'

                  );
        };  //end videoHTML
    }; //end window.onload

