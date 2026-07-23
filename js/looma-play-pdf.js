/*

filename: looma-play-pdf.js

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2020 03
Revision: Looma 2.0.0
Author: Skip
Description: display layer built on pdf.js for showing chapters in PDFs
 */

"use strict";

var wsResizeTimer;

function isWorksheet() { return $('#pdf').data('ft') === 'worksheet'; }

// Recompute the fit scale for the current #pdf size and redraw the (single-page)
// worksheet on a FRESH canvas. Rebuilding the canvas avoids an intermittent
// vertical-flip that can occur when pdf.js re-renders onto an already-used canvas
// (its render-cancel is unreliable). The fullscreen<->normal transition fires
// resize/fullscreenchange events, which is when the flip was showing up.
function refitWorksheet() {
    if (!pdfdoc || !isWorksheet()) return;
    pdfdoc.getPage(startPage).then(function(page) {
        var base = page.getViewport({scale: 1});
        var box = document.getElementById('pdf');
        var fit = Math.min(box.clientWidth / base.width, box.clientHeight / base.height);
        currentScale = (fit > 0 ? fit : initialZoom) * 0.97;
        $('#pdf').empty();                                   // drop the old (possibly mid-render) canvas
        makePageDivs($('#pdf')[0], pdfdoc, startPage, endPage);
        drawMultiplePages(pdfdoc, startPage, endPage);
    });
}

// debounce transition events so the many resize/fullscreenchange events fired
// during a fullscreen toggle collapse into a single clean redraw
function scheduleWorksheetRefit() {
    clearTimeout(wsResizeTimer);
    wsResizeTimer = setTimeout(refitWorksheet, 200);
}

$(window).resize(async function() {
    if (isWorksheet()) scheduleWorksheetRefit();
    else await drawMultiplePages(pdfdoc, startPage, endPage).promise;
});

document.addEventListener('fullscreenchange', function() {
    if (isWorksheet()) scheduleWorksheetRefit();
});

window.onload = function() {

  $('button.lookup').off('click').click(function(){
       // var toString = selection;

      var toString = window.getSelection().toString();

      console.log ('selected text to lookup: "', toString, '"');
        // LOOMA.lookupWord(toString);
      if ($('#pdf').data('lang') === 'np') {
        //  toString = convertPreeti(toString);
             LOOMA.popupDefinition(toString.split(' ')[0], 15, 'np');

      } else LOOMA.popupDefinition(toString.split(' ')[0], 15, 'en');
      return false;
    });

 /*
    document.addEventListener('selectionchange',
        (e)=>{
        if ($('#pdf').data('lang') === 'np')
             selection = convertPreeti(window.getSelection().toString());
        else selection =               window.getSelection().toString();
        return false;
    });
*/

    $('#zoom-dropdown').removeClass('hide');

// *********  PAGE controls ***************

    enablePageControls();

// *********  ZOOM controls ***************

    enableZoomControls();

      $('#zoom-dropdown').hide();

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
           // $('#pdf').css("transform","scale(1.25");
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

    //playPDF();

    // worksheets: fit the page to the display area - as big as possible with no scroll bar
    // (playPDF() computes the exact scale once the page's natural size is known)
    var pdfZoom = $('#pdf').data('zoom');
    if ($('#pdf').data('ft') === 'worksheet') pdfZoom = 'fit';

    playPDF($('#pdf')[0], $('#pdf').data('fn'),
                          $('#pdf').data('fp'),
                          $('#pdf').data('page'),
                          $('#pdf').data('len'),
                          $('#pdf').data('lang'),
                          pdfZoom );

    toolbar_button_activate("library");

};
