/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2021 05
Revision: Looma 2.0.0
Author: Skip
filename: looma-pdf-utilities.js
Description: functions for displaying PDFs
Used by: looma-play-pdf.js and looma-play-lesson.js
 */

"use strict";

pdfjsLib.GlobalWorkerOptions.workerSrc = "js/pdfjs/pdf.worker.min.js";

//DEBUG  const filename = '../content/textbooks/Class1/Math/Math-1-1051.pdf';
const initialZoom = 2.3;
var currentScale = initialZoom;

var filename, filepath, startPage; //filename, filepath, startPage, initial zoom level and len are passed in by the PHP
var endPage, maxPages, currentPage, pdfdoc;  //pdfdoc holds the 'doc' object returned by pdf.js
var lastScrollTop = 0;
var zooming = false;
var didScroll = false;
var renderPromises = [];
var renders = 0; var cancels = 0;

function makePageDivs(doc, start, finish) {
    // allocate a canvas and a text-layer for each of the pages of this DOC from page = START to page = FINISH
    for (var page = start; page <= finish; page++) {
        $('<canvas/>', {id:'pdf-canvas'+page, class: 'pdf-canvas'}).appendTo('#pdf');
        $('<div/>', {id:'pdf-text'+page, class: 'pdf-text textLayer'}).appendTo('#pdf');
    }
}  // end makePageDivs

async function drawPage (doc, pagenum)  {
    doc.getPage(pagenum).then (page => {
        
        /*new*/ var renderTask = null;
        
        function renderPage() {
            if (renderTask !== null) {renderTask.internalRenderTask.cancel();cancels++;return;}
            // also tried this way to cancel. neither seems to work
            // if (renderTask !== null) {renderTask.cancel();cancels++;return;}
            
            const pdf_canvas = document.getElementById('pdf-canvas'+pagenum);
            const pdf_context = pdf_canvas.getContext('2d');
            
            $('#pdf-text'+pagenum).empty();
            let viewport = page.getViewport({scale:currentScale});
            pdf_canvas.width = viewport.width;
            pdf_canvas.height = viewport.height;
            
            renderTask = page.render ({canvasContext:pdf_context, viewport:viewport});
            
            renderTask.promise.then(function() {
                renderTask = null;
                renders++;
                // Returns a promise, on resolving it will return text contents of the page
                return page.getTextContent();})
                .then(function(textContent) {
                    
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
                    }).promise.then(function() {delete renderPromises[pagenum];});
                    
                    // the text layer should render on top of the canvas,
                    // but it is being drawn below the canvas
                    // this next statement compensates for the mis-placement of text layer
                    // and puts the text right on top of the corresponding text in the canvas
                    $("#pdf-text"+pagenum).css('top', pdf_canvas.top);
                    
                })
                .catch(function(err) {
                    renderTask = null;
                    console.log('render catch ' + err);
                    cancels++;
                    if (err.name === 'RenderingCancelledException'){
                        renderPage();
                        
                    }
                });  //  end catch()
        } // end renderPage()
        renderPage();
        // );
    }); // end getPage();then()
} //end drawPage

async function drawMultiplePages(doc, start, finish) {
    // display the pages of this DOC from page = START to page = FINISH
    for (var page = start; page <=  finish; page++) { drawPage(doc, page);}
    
    //NOTE: zoomcontrols are getting enabled too soom
    // probalby need to collect all the page render promises and here do promises.all( () => enableZoomControls(););
    
    
}  // end drawMultiplePages


function enablePageControls() {
    // using jQuery ".one()" to de-bounce and prevent multiple page-up/page-downs
    
    $('#next-page').off('click').one('click', function (e) {
        e.preventDefault();
        if (currentPage < endPage) showPage(currentPage + 1);
    });
    $('#prev-page').off('click').one('click', function (e) {
        e.preventDefault();
        if (currentPage > startPage) showPage(currentPage - 1);
    });
}
function showPage(pagenum) {
    if (startPage <= pagenum && pagenum <= endPage) {
        console.log('showing page ' + pagenum);
        disableScrollDetect();
        currentPage = pagenum;
        
        $('#pdf').stop(true,true)
            // .off('scroll')
            .animate({scrollTop: $("#pdf-canvas" + pagenum)[0].offsetTop},
                1500,
                function() { // the 'complete' function, run when animate ends
                    showPageNum(pagenum);
                    didScroll = false;
                    enablePageControls();
                    enableScrollDetect();}
            );    //.on('scroll',function() {didScroll = true;});
    }
    
} // end showPage

function showPageNum (p) {
    console.log('called showpagenum with ' + p);
    $('#pagenum').text(p - startPage + 1);
}

function enableScrollDetect() {
    $('#pdf').scroll(function() {
        //console.log('scroll event: ' + currentPage);
        didScroll = true;});
}

function disableScrollDetect() {
    $('#pdf').scroll(function() {});
}


function getScrolledPage() {
    for (var i = startPage; i <= endPage; i++) {
        if (isScrolledIntoView(($('#pdf-canvas' + i)))) {
            showPageNum(i);
            currentPage = i;
            break;
        }
    }
}
// detect SCROLL and reset page# indicator to currently displayed page
function isScrolledIntoView($elem){ // or window.addEventListener("scroll"....
    var inview;
    var viewTop = $('#pdf').scrollTop();
    var viewTopThird = viewTop + $('#pdf').height() / 3;
    var viewBottomThird = viewTop + $('#pdf').height() * 2 / 3;
    var viewBottom = viewTop + $('#pdf').height();
    var pageTop = $elem[0].offsetTop;
    var pageBottom = $elem[0].offsetTop + $elem.height();
    if (viewTop >= lastScrollTop){  // direction of scroll is 'down'
        inview = ( viewTop <= pageTop && pageTop <= viewTopThird );
    } else {                       // direction of scroll is 'up'
        inview = ( viewBottomThird <= pageBottom && pageBottom <= viewBottom );
    }
    lastScrollTop = viewTop <= 0 ? 0 : viewTop; // For Mobile or negative scrolling
    return inview;
}

//function turnOffControls() {$('.toolbar-button').prop('disabled', true);}  // end turnOffControls
//function turnOnControls()  {$('.toolbar-button').prop('disabled', false);}  // end turnOnControls

function enableZoomControls() {
    $('#zoom-out').one('click', async function () {
        $('#zoom-btn').text(Math.round((currentScale * 0.8 / initialZoom) * 100).toString() + '%');
        await setZoom(currentScale * 0.8);
    });
    
    $('#zoom-in').one('click', async function () {
        $('#zoom-btn').text(Math.round((currentScale * 1.25 / initialZoom) * 100).toString() + '%');
        await setZoom(currentScale * 1.25);
    });
}
function disableZoomControls() {
    $('#zoom-out, #zoom-in').off('click')
}
async function setZoom(zoom) {
    if (zoom !== currentScale && !zooming) {
        currentScale = zoom;
        //$('#pdf').empty();
        //turnOffControls();
        
        disableZoomControls();
        
        zooming = true;
        await drawMultiplePages(pdfdoc, startPage, endPage);
        zooming = false;
        enableZoomControls();
        //turnOnControls();
    }
} // end setZoom

function displayThumb (doc, pagenum)  {
    if ($('#thumbs').length){
        doc.getPage(pagenum).then(page => {
            const thumb_canvas = document.getElementById('thumb-canvas' + pagenum);
            const thumb_context = thumb_canvas.getContext('2d');
            let viewport = page.getViewport({scale: 0.25});
            thumb_canvas.width = viewport.width;
            thumb_canvas.height = viewport.height;
            page.render({canvasContext: thumb_context, viewport: viewport});
        });
    }
}  //end displayThumb

async function displayMultipleThumbs (doc, start, finish) {
    for (var page = start; page <= finish; page++) {
        
        $('<canvas/>', {id:'thumb-canvas'+page, class: 'thumb-canvas'}).appendTo('#thumbs');
        $('#thumb-canvas'+page).attr('data-page',page);
        displayThumb(pdfdoc, page);
    }
} // end displayMultipleThumbs

async function drawThumbs() {
    if ($('#thumbs').length){
        
        await displayMultipleThumbs(pdfdoc, startPage, endPage);
        
        $('#showthumbs').click(function () {$('#thumbs').toggle();});
        $('.thumb-canvas').click(function() {
            $('#thumbs').hide();
            showPage($(this).attr('data-page'));
        });
        $('#showthumbs').show();
    }
}  // end drawThumbs()
