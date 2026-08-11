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

/*
FUNCTIONS:
    makePageDivs()
    drawPage()
    drawMultiplePages()
    enablePageControls()
    showPage()
    showPageNum()
    enableScrollDetect()
    disableScrollDetect()
    getScrolledPage()
    isScrolledIntoView()
    enableZoomControls()
    disableZoomControls()
    setZoom()
    displayThumb()
    displayMultipleThumbs()
    drawThumbs()
    playPDF()
 */
//const initialZoom = 'page-width';  //NOTE: this kills pdf display in looma-play-lesson. WHY????
const initialZoom = 2.3;
var currentScale = initialZoom;

var filename, filepath, startPage; //filename, filepath, startPage, initial zoom level and len are passed in by the PHP
var endPage, maxPages, currentPage, pdfdoc;  //pdfdoc holds the 'doc' object returned by pdf.js
var lastScrollTop = 0;
var zooming = false;
var didScroll = false;
var renderPromises = [];
var renders = 0; var cancels = 0;

function makePageDivs(div, doc, start, finish) {
    // allocate a canvas and a text-layer for each of the pages of this DOC from page = START to page = FINISH
    for (var page = start; page <= finish; page++) {
        $('<canvas/>', {id:'pdf-canvas'+page, class: 'pdf-canvas'}).appendTo(div);
        $('<div/>', {id:'pdf-text'+page, class: 'pdf-text textLayer'}).appendTo(div);
    }
}  // end makePageDivs

/**
 * Compute the bounding boxes (in viewport/canvas pixel space) of every image
 * painted on a page, by replaying the page's operator list and tracking the
 * current transformation matrix. An image is always painted into the unit
 * square [0,1]x[0,1] transformed by the CTM, so the CTM at each image-paint op
 * gives us where that image landed on the page.
 *
 * This is how we tell "text over a figure/diagram" from real body text: pdf.js
 * lays an invisible selectable text span over EVERY glyph, including the text
 * baked into a figure — and that figure text is the worst selection garbage.
 */
function getPdfImageRects(opList, viewport) {
    var OPS = pdfjsLib.OPS;
    if (!OPS || !opList || !opList.fnArray) return [];

    var isImageOp = {};
    ['paintImageXObject', 'paintImageMaskXObject', 'paintInlineImageXObject',
     'paintImageXObjectRepeat', 'paintImageMaskXObjectGroup',
     'paintImageMaskXObjectRepeat', 'paintJpegXObject'].forEach(function (name) {
        if (OPS[name] != null) isImageOp[OPS[name]] = true;
    });

    function apply(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }

    var ctm = [1, 0, 0, 1, 0, 0];
    var stack = [];
    var vt = viewport.transform;   // PDF user space -> viewport pixels
    var rects = [];

    for (var i = 0; i < opList.fnArray.length; i++) {
        var fn = opList.fnArray[i];
        if (fn === OPS.save) {
            stack.push(ctm);                     // ctm is never mutated in place, so a ref is safe
        } else if (fn === OPS.restore) {
            ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
        } else if (fn === OPS.transform) {
            var a = opList.argsArray[i];         // new ctm = ctm * a (a applied first)
            ctm = [
                ctm[0] * a[0] + ctm[2] * a[1],
                ctm[1] * a[0] + ctm[3] * a[1],
                ctm[0] * a[2] + ctm[2] * a[3],
                ctm[1] * a[2] + ctm[3] * a[3],
                ctm[0] * a[4] + ctm[2] * a[5] + ctm[4],
                ctm[1] * a[4] + ctm[3] * a[5] + ctm[5]
            ];
        } else if (isImageOp[fn]) {
            var corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
            var xs = [], ys = [];
            for (var c = 0; c < 4; c++) {
                var u = apply(ctm, corners[c][0], corners[c][1]);   // user space
                var v = apply(vt, u[0], u[1]);                      // viewport px
                xs.push(v[0]); ys.push(v[1]);
            }
            rects.push({
                left:   Math.min.apply(null, xs),
                top:    Math.min.apply(null, ys),
                right:  Math.max.apply(null, xs),
                bottom: Math.max.apply(null, ys)
            });
        }
    }
    return rects;
}

/**
 * Make every text span whose centre sits inside a figure/diagram image
 * unselectable, so a figure's baked-in text labels can't be dragged into a
 * selection. Full-page images (scans/backgrounds covering most of the page) are
 * IGNORED: their overlaid text is the real body text the user needs, imperfect
 * as it may be, and locking it would make the whole page unselectable.
 */
function disablePdfImageText(container, rects, viewport) {
    if (!container || !rects || !rects.length) return;
    var pageArea = viewport.width * viewport.height;
    var figures = rects.filter(function (r) {
        var area = Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
        return area > 0 && area < pageArea * 0.7;
    });
    if (!figures.length) return;

    var spans = container.children;
    for (var i = 0; i < spans.length; i++) {
        var el = spans[i];
        var x = el.offsetLeft + el.offsetWidth / 2;
        var y = el.offsetTop + el.offsetHeight / 2;
        for (var f = 0; f < figures.length; f++) {
            var R = figures[f];
            if (x >= R.left && x <= R.right && y >= R.top && y <= R.bottom) {
                el.style.userSelect = 'none';
                el.style.webkitUserSelect = 'none';
                el.style.pointerEvents = 'none';
                el.setAttribute('data-looma-image-text', '1');
                break;
            }
        }
    }
}

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

                    // Where are the images on this page? Fetch the operator list
                    // in parallel so we can suppress text spans laid over figures.
                    var imageRectsPromise = page.getOperatorList()
                        .then(function (opList) { return getPdfImageRects(opList, viewport); })
                        .catch(function () { return []; });

                    // Pass the data to the method for rendering of text over the pdf canvas.
                    var textLayerDiv = $("#pdf-text"+pagenum).get(0);
                    pdfjsLib.renderTextLayer({
                        textContent: textContent,
                        container: textLayerDiv,
                        viewport: viewport,
                        textDivs: []
                    }).promise.then(function() {
                        // Two layers of defence against garbage selections:
                        // 1) spans that are PURE glyph garbage (private-use / symbol
                        //    codepoints from a font with no ToUnicode map).
                        if (window.LOOMA && LOOMA.disableGarbageSpans) LOOMA.disableGarbageSpans(textLayerDiv);
                        // 2) spans laid over a FIGURE image — a figure's baked-in
                        //    text labels, the worst selection garbage of all.
                        imageRectsPromise.then(function (rects) {
                            disablePdfImageText(textLayerDiv, rects, viewport);
                        });
                        delete renderPromises[pagenum];
                    });

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
        await setZoom(Math.max(currentScale * 0.8,1));  // restricting min zoom to 35%
    });

    $('#zoom-in').one('click', async function () {
        $('#zoom-btn').text(Math.round((currentScale * 1.25 / initialZoom) * 100).toString() + '%');
        await setZoom(Math.min(currentScale * 1.25,3.25));  // restricting max zoom to 200%
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

        $('#showthumbs').click(function () {
            $('#thumbs').toggle();
            $('#fullscreen').toggleClass('pdf-thumbs-open', $('#thumbs').is(':visible'));
        });
        $('.thumb-canvas').click(function() {
            $('#thumbs').hide();
            $('#fullscreen').removeClass('pdf-thumbs-open');
            showPage($(this).attr('data-page'));
        });
        $('#showthumbs').show();
    }
}  // end drawThumbs()

function playPDF(PDFdiv,filename,filepath,start,len,lang,zoom) {

    // get calling PARAMs
    //filename = $('#pdf').data('fn');
    //filepath = $('#pdf').data('fp');
    //startPage = $('#pdf').data('page') ? $('#pdf').data('page') : 1;
    startPage = start ? start : 1;
    if (len && len >0)
        endPage = startPage + len - 1; else endPage = startPage + 999;
    //currentScale = $('#pdf').data('zoom') && !isNaN($('#pdf').data('zoom')) ? $('#pdf').data('zoom') : initialZoom;
    if (zoom) currentScale = zoom; else currentScale = initialZoom;
    // load the PDF file
    //turnOffControls();
    pdfjsLib.getDocument(filepath + filename).promise.then(
        async function(doc) {
            pdfdoc = doc;
            currentPage = startPage;
            maxPages = doc._pdfInfo.numPages || 1;
            if (endPage > maxPages) endPage = maxPages;
            $('#maxpages').text(endPage - startPage + 1);
            console.log('loaded file ' + filepath + filename + ' with ' + maxPages + ' pages');

            makePageDivs(PDFdiv,doc, startPage, endPage);

            // displayFirstPage(doc,startPage);

            await drawMultiplePages(doc, startPage, endPage).promise;
            showPageNum(startPage);
            //turnOnControls();
        }).then( () =>  {drawThumbs();});

} // end playPDF()
