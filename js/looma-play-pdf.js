/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2020 03
Revision: Looma 2.0.0

filename: looma-play-pdf.js
Description: display layer built on pdf.js for showing chapters in PDFs
 */

"use strict";

pdfjsLib.GlobalWorkerOptions.workerSrc = "js/pdfjs/pdf.worker.min.js";

//DEBUG  const filename = '../content/textbooks/Class1/Math/Math-1-1051.pdf';
const initialZoom = 2.3;
let currentScale = initialZoom;

let filename, filepath, startPage, endPage, length, currentPage, pdfdoc, maxPages;

function displayPage (doc, pagenum)  {
    doc.getPage(pagenum).then (page => {
        const pdf_canvas = document.getElementById('pdf-canvas'+pagenum);
        const pdf_context = pdf_canvas.getContext('2d');
        $('#pdf-text'+pagenum).empty();
        let viewport = page.getViewport({scale:currentScale});
        pdf_canvas.width = viewport.width;
        pdf_canvas.height = viewport.height;
        page.render ({canvasContext:pdf_context, viewport:viewport})
            .promise.then(function() {
            // Returns a promise, on resolving it will return text contents of the page
              return page.getTextContent();})
            .then(function(textContent) {
            
            //var pdf_canvas = $("#pdf-canvas");  // PDF canvas
            var canvas_height = pdf_canvas.height;  // Canvas height
            var canvas_width = pdf_canvas.width;  // Canvas width
            var canvas_top = pdf_canvas.offsetTop;  // Canvas top
            var canvas_left = pdf_canvas.offsetLeft;  // Canvas left
            
            // Assign CSS to the text-layer element
            $("#pdf-text"+pagenum).css({ left:   canvas_left + 'px',
                top:    canvas_top + 'px',
                height: canvas_height + 'px',
                width:  canvas_width + 'px' });
            
            // Pass the data to the method for rendering of text over the pdf canvas.
            pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: $("#pdf-text"+pagenum).get(0),
                viewport: viewport,
                textDivs: []
            });
            
            // the text layer should render on top of the canvas,
            // but it is being drawn below the canvas
            // this next statement compensates for the mis-placement of text layer
            // and puts the text right on top of the corresponding text in the canvas
            $("#pdf-text"+pagenum).css('top', pdf_canvas.top);
            
            //$('#pagenum').val(pagenum);
        });
    });
}  //end displayPage
function displayMultiplePages(doc, start, finish) {
    // display the pages of this DOC from page = START to page = FINISH
    for (var page = start; page <= finish; page++) {
        
        $('<canvas/>', {id:'pdf-canvas'+page, class: 'pdf-canvas'}).appendTo('#pdf');
        $('<div/>', {id:'pdf-text'+page, class: 'pdf-text textLayer'}).appendTo('#pdf');
    
        displayPage(pdfdoc, page);
    }
    jumpToPage(start);
}  // end displayMultiplePages

function jumpToPage(pagenum) {
    if (startPage <= pagenum && pagenum <= endPage) {
        $("#pdf").off('scroll');
    
        $('#pdf').animate({
            //scrollTop: $("#pdf-canvas" + pagenum).offset().top
            scrollTop: $("#pdf-canvas" + pagenum)[0].offsetTop
        }, 1500).promise()
            .then (function() {
            currentPage = pagenum;
            $('#pagenum').val(currentPage - startPage + 1);
        
            $("#pdf").scroll(function () {
                for (var i = startPage; i <= endPage; i++) {
                    if (isScrolledIntoView(($('#pdf-canvas' + i)))) {
                        $('#pagenum').val(i - startPage + 1);
                        break;
                    }
                }
            });
        });
    }
} // end jumpToPage

// detect SCROLL and reset page# indicator to currently displayed page

function isScrolledIntoView($elem) {
    let inview = ($elem[0].offsetTop >= $('#pdf').scrollTop()
         && $elem[0].offsetTop <= $('#pdf').scrollTop() + $('#pdf').height());
    return inview;
}  // end isScrolledIntoView

function setZoom(zoom) {
    currentScale = zoom;
    $('#pdf').empty();
    displayMultiplePages(pdfdoc, startPage, endPage);
} // end setZoom

function percentZoom(change) {
     return ( currentScale * change ) + '%';
}

function displayThumb (doc, pagenum)  {
        doc.getPage(pagenum).then (page => {
        const thumb_canvas = document.getElementById('thumb-canvas'+pagenum);
        const thumb_context = thumb_canvas.getContext('2d');
        let viewport = page.getViewport({scale:0.25});
        thumb_canvas.width = viewport.width;
        thumb_canvas.height = viewport.height;
        page.render ({canvasContext:thumb_context, viewport:viewport});
        });
}  //end displayThumb
async function displayMultipleThumbs (doc, start, finish) {
         for (var page = start; page <= finish; page++) {
            
             $('<canvas/>', {id:'thumb-canvas'+page, class: 'thumb-canvas'}).appendTo('#thumbs');
             $('#thumb-canvas'+page).attr('data-page',page);
             displayThumb(pdfdoc, page);
         }
} // end displayMultipleThumbs
async function showThumbs() {
    await displayMultipleThumbs(pdfdoc, startPage, endPage);
    $('#showthumbs').click(function () {$('#thumbs').toggle();});
    $('.thumb-canvas').click(function() {
        $('#thumbs').hide();
        jumpToPage($(this).attr('data-page'));
    });
    $('#showthumbs').show();
}
window.onload = function() {
    filename = $('#pdf').data('fn');
    filepath = $('#pdf').data('fp');
    startPage = $('#pdf').data('page') ? $('#pdf').data('page') : 1;
    if ($('#pdf').data('len') && $('#pdf').data('len') >0)
        endPage = startPage + $('#pdf').data('len') - 1; else endPage = 999;
    currentScale = $('#pdf').data('zoom') ? $('#pdf').data('zoom') : initialZoom;
    
    $('#next-page').click(function () {
        if (currentPage < endPage) jumpToPage(++currentPage)
    });
    $('#prev-page').click(function () {
        if (currentPage > startPage) jumpToPage(--currentPage)
    });
    $('#pagenum').change(function () {
        const newpage = parseInt($('#pagenum').val()) + startPage - 1;
        if (startPage <= newpage && newpage <= endPage) jumpToPage(newpage);
        else $('#pagenum').val(currentPage - startPage + 1);
    });
    
    $('#zoom-out').click(function () {
        $('#zoom-btn').text(Math.round((currentScale * 0.8 / initialZoom) * 100).toString() + '%');
        setZoom(currentScale * 0.8);
    });
    
    $('#zoom-in').click(function () {
        $('#zoom-btn').text(Math.round((currentScale * 1.25 / initialZoom) * 100).toString() + '%');
        setZoom(currentScale * 1.25);
    });
    
    $('#zoom-btn').click ( function(){$('#zoom-dropdown').show();});
    
    $('.zoom-item').click( function() {
            var zoom = $(this).data('zoom');
            var level = $(this).data('level');
            setZoom(level);
            $('#zoom-btn').text(zoom);
            $('#zoom-dropdown').hide();
        });
    
    $('#fullscreen-control').click(function () {
        if (document.fullscreenElement) currentScale = currentScale * 1 / 1.1;
        else currentScale = currentScale * 1.1;
        LOOMA.toggleFullscreen;
        displayMultiplePages(pdfdoc, startPage, endPage);
        return false;
    });
    
    $("#pdf").scroll(function () {
        for (var i = startPage; i <= endPage; i++) {
            if (isScrolledIntoView(($('#pdf-canvas' + i))))
                $('#pagenum').val(i - startPage + 1);
        }
    });


    // this resize handling is not needed:
    //$('#pdf').resize(function() {displayMultiplePages(pdfdoc, startPage, endPage);});
    
    $('#find').change(); //FIND operation not implemented this version
    
    // load the PDF file
    pdfjsLib.getDocument(filepath + filename).promise.then(
        doc => {
            pdfdoc = doc;
            currentPage = startPage;
            maxPages = doc._pdfInfo.numPages || 1;
            if (endPage > maxPages) endPage = maxPages;
            $('#maxpages').text(endPage - startPage + 1);
            console.log('loaded file ' + filepath + filename + ' with ' + maxPages + ' pages');
            displayMultiplePages(doc, startPage, endPage);
        }
    ).then( () =>  {showThumbs();});
    
};
