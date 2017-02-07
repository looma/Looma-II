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

 //NOTE: looma-lesson-present.php sends "var lesson_id = ID"

window.onload = function ()
    {
        $('#controlpanel').draggable();

        $('.activity').removeClass('activity play img').addClass('lesson-element');

//        $('#viewer').attr('src',  '../content/pictures/Bullfrog.jpg');
//        $('#viewer').attr('src',  '../content/PhET/arithmetic_en.html');

        var $timeline = $('#timeline');
        var $viewer = $('#viewer');
        var $currentItem = null;
        // add click handlers for mini-toobar and for timeline entries

      $('#fullscreen-control').click(function (e) {
                e.preventDefault();
                screenfull.toggle($('#fullscreen')[0]);
            });

        $('#back').click( function()    { if ($currentItem.prev()) { play($currentItem.prev()); }; });
        $('#forward').click( function() { if ($currentItem.next()) { play($currentItem.next()); }; });
        $('#pause').click( function()   { $viewer.empty(); });
        $('#dismiss').click( function() { });

        $timeline.on('click', 'button', function() { play($(this)); });

        $('.lesson-element img').on('hover', function () {
            LOOMA.alert('alert');
        });


 //
 //NOTE: playActivity() should move to looma-utilities.js
 //

        function play($item) {
            $viewer.empty();
            $currentItem = $item;
            $('timeline button').removeClass('playing');
            $item.addClass('playing');
            playActivity($item.data('ft'), $item.data('fn'), $item.data('fp'), $item.data('dn'), $item.data('id'), "", "");
        }; //end play()

        function playActivity(ft, fn, fp, dn, id, ch, pg) //play the activity of type FT, named FP, in path FP, display-name DN
                                                          // depending on FT, may use ID, CH (a ch_id) or pg (for PDFs)
        {
        // plays the selected (onClick) timeline element (activity) in the #viewer div

            switch (ft) {
                case "image":
                case "jpg":
                case "png":
                case "gif":

                    $(imageHTML(fp, fn)).appendTo($viewer);

                    break;
                case "video":
                case "mp4":
                case "m4v":
                case "mov":

                    $(videoHTML(fp,fn, dn)).appendTo($viewer);

                   break;
                case "audio":
                case "mp3":

                    $(audioHTML(fp,fn, dn)).appendTo($viewer);

                    break;
                case 'pdf':

                    $(pdfHTML(fp,fn, dn)).appendTo($viewer);

                    break;

                case 'text':

                    textHTML(id);

                    break;

                 case 'html':
                 case 'EP':
                 case 'epaath':

                    $(htmlHTML(fp,fn, dn)).appendTo($viewer);

                    break;
                case 'evi':
                case 'slideshow':
                case 'map':
                case 'looma':
                case 'EP':
                    break;

                default:
                   console.log("ERROR: in playActivity(), unknown type: " + ft);
                   break;
            };  //end SWITCH(ft)

          /*


        case "evi":
            //evi = edited video indicator
            //If you click on an edited video it sends the filename, location and the information
            //to looma-edited-video.php
            window.location = 'looma-edited-video.php?fn=' + button.getAttribute('data-fn') +
            '&fp=' + button.getAttribute('data-fp') +
            '&id=' + button.getAttribute('data-id') +
            '&dn=' + button.getAttribute('data-dn');
            break;

        case "pdf":

            //direct call to  ViewerJS replaced with looma-pdf.php with iframe
            //window.location = 'ViewerJS/#../' + button.getAttribute('data-fp') + button.getAttribute('data-fn');


            //old code using PDF.js
            window.location = 'looma-pdf.php?fn=' + button.getAttribute(
                    'data-fn') +
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

            break;
        case "lesson":
            break;

        default:
            console.log("ERROR: in LOOMA.playMedia(), unknown type: " +
                button.getAttribute("data-ft"));
    } //end SWITCH
         */


        }; //end playActivity()

        function imageHTML(fp, fn) { return('<img src="' + fp + fn + '"/>');};

        function pdfHTML(fp,fn, dn) {return('<embed src="' + fp + fn + '" height=100% width=100%>');};

        function textHTML(id) {

             $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: 'activities', id: id},
                function(result1) {
                    $.post("looma-database-utilities.php",
                    {cmd: "openByID", collection: 'text', id: result1.mongoID.$id},
                    function(result2) {
                        $(result2.data).appendTo($viewer);
                    },
                    'json'
                  );
                },
                'json'
              );
        };

        function htmlHTML(fp, fn) { return('<embed src="' + fp + fn + '" height=100% width=100%>');};

        function audioHTML(fp, fn, dn) { return(
            '<div>' +
                '<div id="audio-viewer" class="viewer">' +
                    '<br><br><br><br>' +
                    '<h2>Looma Audio Player (' + dn + ')</h2>' +
                    '<br><br><br><br>' +
                    '<audio id="audio"><source src="' + fp + fn + '" type="audio/mpeg">' +
                    'Your browser does not support the audio element.' +
                '</audio>' +
            '</div>' +
            '<div id="media-controls">' +
              '<br><button type="button" class="media" id="play-pause">Play</button>' +
              '<input type="range"       class="video" id="seek-bar" value="0" style="display:inline-block">' +
              '<br><button type="button" class="media" id="volume">Volume</button>' +
              '<input type="range"       class="video" id="volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block">' +
              '<br><button type="button" class="media" id="mute">Mute</button>' +
            '</div></div>' +
            '<script src="js/looma-audio.js"></script>');
        }; //end audioHTML

        function videoHTML(fp, fn, dn) { return (
                 '<div id="video-player">' +
                    '<div id="video-area">' +
                        '<video id="video">' +
                            'poster="' + fp + thumbnail(fn) +  '">' +
                            '<source id="video-source" src="' + fp + fn + 'type="video/mp4">' +
                        '</video>' +
                    '</div></div>' +
                '<div id="title-area"><h3 id="title"></h3></div>' +
                '<div id="media-controls">' +
                    '<button id="fullscreen-control"></button>' +
                    '<button id="fullscreen-playpause"></button>' +
                    '<div id="time" class="title">0:00</div>' +
                    '<button type="button" class="media" id="play-pause">Play/Pause</button>' +
                    '<input type="range" class="video" id="seek-bar" value="0" style="display:inline-block"><br>' +
                    '<button type="button" class="media" id="volume">Volume</button>' +
                    '<input type="range" class="video" id="volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div></div>' +
                '<script src="js/looma-video.js"></script>');
        };  //end videoHTML
    }; //end window.onload

