/*

filename: looma-play-pdf.js

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2020 03
Revision: Looma 2.0.0
Author: Skip
Description: display layer built on pdf.js for showing chapters in PDFs
 */

"use strict";

$(window).resize(async function() {
    await drawMultiplePages(pdfdoc, startPage, endPage).promise;
});

/**
 * The element of the pdf.js text layer that a node belongs to — i.e. the direct
 * child of a `.pdf-text` container. Walks up past anything wrapped around the
 * text since it was rendered (the reading highlight wraps spans of its own).
 * Returns null for nodes outside a text layer.
 */
function pdfTextItem(node) {
    var el = (node && node.nodeType === 3) ? node.parentNode : node;
    while (el && el.nodeType === 1) {
        var parent = el.parentNode;
        if (parent && parent.classList && parent.classList.contains("pdf-text")) return el;
        el = parent;
    }
    return null;
}

/**
 * Rebuild the selected text in the order the words actually appear on the page.
 *
 * A pdf.js text layer is a pile of absolutely positioned spans, and their DOM
 * order is the PDF's content-stream order — NOT the order a reader sees. Taking
 * the selection as a flat string therefore drags in every span that merely falls
 * between the two ends in DOM order, wherever it happens to sit on the page: the
 * page number, the running header, a figure label. Since long words are split
 * across several spans ("fin" + "e"), one of those strays lands *inside* a word
 * and "some" comes out as "so1me".
 *
 * So: take the spans the selection touches, sort them into reading order (by
 * line, then left to right), and keep only the ones between the two ends of the
 * selection in THAT order. A page number above the selected line now sorts
 * outside the window and is dropped instead of being spliced into a word.
 *
 * Returns "" when the selection is not in a text layer, so the caller can fall
 * back to the plain selection string.
 */
function getPdfSelectionItems(range) {
    var startItem = pdfTextItem(range.startContainer);
    var endItem = pdfTextItem(range.endContainer);
    if (!startItem || !endItem) return [];

    var items = [];
    $("#pdf .pdf-text").each(function () {
        var children = this.children;
        for (var i = 0; i < children.length; i++) {
            var el = children[i];
            if (!range.intersectsNode(el)) continue;
            var rect = el.getBoundingClientRect();
            items.push({el: el, top: rect.top, left: rect.left, height: rect.height});
        }
    });
    if (!items.length) return [];

    // Group into lines before sorting left-to-right: spans on one line never share
    // an exact `top`, so a tolerance of half a line is what separates "next word"
    // from "next line".
    items.sort(function (a, b) { return (a.top - b.top) || (a.left - b.left); });
    var tolerance = Math.max(4, (items[0].height || 12) * 0.6);
    var line = 0;
    var lineTop = items[0].top;
    items.forEach(function (item) {
        if (item.top - lineTop > tolerance) { line++; lineTop = item.top; }
        item.line = line;
    });
    items.sort(function (a, b) { return (a.line - b.line) || (a.left - b.left); });

    var startAt = -1, endAt = -1;
    items.forEach(function (item, index) {
        if (item.el === startItem) startAt = index;
        if (item.el === endItem) endAt = index;
    });
    if (startAt === -1 || endAt === -1) return [];

    return items.slice(Math.min(startAt, endAt), Math.max(startAt, endAt) + 1);
}

function getPdfSelectionText() {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return "";

    var range = selection.getRangeAt(0);
    var items = getPdfSelectionItems(range);
    var text;

    if (items.length) {
        // The two end spans are only partly selected, so clip them to the part the
        // user actually dragged over. pdf.js already carries the spaces between
        // words in the span text itself (and splits words with no space at all), so
        // the pieces are joined with nothing added and the whitespace collapsed after.
        text = items.map(function (item) {
            var el = item.el;
            var holdsStart = el.contains(range.startContainer);
            var holdsEnd = el.contains(range.endContainer);
            if (!holdsStart && !holdsEnd) return el.textContent || "";

            try {
                var clipped = el.ownerDocument.createRange();
                clipped.selectNodeContents(el);
                if (holdsStart) clipped.setStart(range.startContainer, range.startOffset);
                if (holdsEnd) clipped.setEnd(range.endContainer, range.endOffset);
                return clipped.toString();
            } catch (e) {
                return el.textContent || "";
            }
        }).join("");
    } else {
        // Not a text-layer selection (a caption, the toolbar, a lesson iframe …).
        var container = document.createElement("div");
        container.appendChild(range.cloneContents());
        text = container.innerText || container.textContent || selection.toString() || "";
    }

    // Safety net for anything the reading-order pass still let through.
    return LOOMA.cleanSelectedText(text);
}

/**
 * When the user copies (Ctrl+C) a selection out of the PDF, replace the
 * clipboard text with the SAME cleaned, reading-order text that TTS and the
 * dictionary use — so a copy never carries the raw text-layer garbage (broken
 * ToUnicode "n1achine", figure-label noise, stray page numbers). Only copies
 * that start inside the PDF text layer are touched; everything else is left
 * exactly as the browser would copy it.
 */
document.addEventListener('copy', function (e) {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    var node = selection.anchorNode;
    var el = (node && node.nodeType === 3) ? node.parentNode : node;
    if (!el || !el.closest || !el.closest('#pdf .pdf-text')) return;

    var clean = getPdfSelectionText();
    if (clean && e.clipboardData) {
        e.clipboardData.setData('text/plain', clean);
        e.preventDefault();
    }
});

window.onload = function() {

  $('button.speak').off('click').click(function(){
      // PDFs need their own extractor so the central TTS logic receives readable text instead of broken span fragments.
      var toString = getPdfSelectionText();

      var $def = $('#definition');
      if ($def) toString += " " + $def.text();

      console.log ('selected text to speak: ', toString);
      LOOMA.speak(toString);
      return false;
    });

  $('button.lookup').off('click').click(function(){
       // var toString = selection;

      var toString = getPdfSelectionText();

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

    playPDF($('#pdf')[0], $('#pdf').data('fn'),
                          $('#pdf').data('fp'),
                          $('#pdf').data('page'),
                          $('#pdf').data('len'),
                          $('#pdf').data('lang'),
                          $('#pdf').data('zoom') );

    toolbar_button_activate("library");

// *********  TELEMETRY: chapter time tracking ***************
    try {
        var $pdf = $('#pdf');
        var initialMeta = {
            chapter_id:   $pdf.data('ch')      || null,
            chapter_name: $pdf.data('chdn')    || null,
            grade:        ($pdf.data('grade')  || '').toString() || null,
            subject:      ($pdf.data('subject')|| '').toString().toLowerCase() || null,
            language:     $pdf.data('lang')    || null,
            page:         $pdf.data('page')    || null,
        };
        if (window.LOOMA && LOOMA.telemetry) {
            LOOMA.telemetry.track('page', Object.assign({ page: 'pdf' }, initialMeta));
            LOOMA.telemetry.startChapterTimer(initialMeta);
        }
    } catch (e) { /* ignore */ }

// *********  LANGUAGE SWITCH (preserves current page) ***************
//   Reuses the existing global #translate toolbar button. Bound with .on()
//   so the keyword-translation handler in looma.js still runs first; we just
//   piggy-back on the same click to swap the PDF file for its alternate
//   language while keeping the current page number.
    $('#translate').on('click.loomaPdfLang', function () {
        var $pdf = $('#pdf');
        var altFn = $pdf.data('nfn');
        if (!altFn) return; // no alternate-language version → leave the click alone

        var keepPage = (typeof currentPage !== 'undefined' && currentPage) ? currentPage
                       : ($pdf.data('page') || 1);
        var altFp   = $pdf.data('nfp')   || $pdf.data('fp');
        var curLang = ($pdf.data('lang') || '').toString().toLowerCase();
        var newLang = (curLang === 'np') ? 'en' : 'np';

        if (window.LOOMA && LOOMA.telemetry) {
            LOOMA.telemetry.track('lang_switch', {
                chapter_id: $pdf.data('ch') || null,
                from: curLang || null, to: newLang, page: keepPage,
            });
            LOOMA.telemetry.stopChapterTimer();
        }

        window.location = 'pdf?fn=' + encodeURIComponent(altFn) +
                 '&fp='   + encodeURIComponent(altFp) +
                 '&lang=' + encodeURIComponent(newLang) +
                 '&zoom=' + encodeURIComponent($pdf.data('zoom') || '2.3') +
                 '&len='  + encodeURIComponent($pdf.data('len')  || 100) +
                 '&page=' + encodeURIComponent(keepPage) +
                 '&nfn='  + encodeURIComponent($pdf.data('fn')   || '') +
                 '&nfp='  + encodeURIComponent($pdf.data('fp')   || '') +
                 '&npage=' + encodeURIComponent($pdf.data('page') || '') +
                 '&ch='   + encodeURIComponent($pdf.data('ch')   || '') +
                 '&chdn=' + encodeURIComponent($pdf.data('chdn') || '') +
                 '&grade='+ encodeURIComponent($pdf.data('grade')|| '') +
                 '&subject=' + encodeURIComponent($pdf.data('subject') || '');
    });

};
