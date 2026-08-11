/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-epaath.js
Description: html page display JS for looma-html.php
 */
'use strict';

$(document).ready (function() {

// *********  SELECTION BAND HEIGHT ***************
//   A converted chapter is a scanned page with a layer of transparent text spans
//   over it. Left alone, the browser paints the blue selection at the height of
//   the FONT, which is taller than the gap to the next line — two selected lines
//   merged into one slab that covered the lines around them.
//   LOOMA.speak.installSelectionBands() paints the selection with the same
//   geometry as the reading band instead, so the two are the same height.
    (function installChapterSelectionBands() {
        var frame = document.getElementById('iframe');
        if (!frame) return;

        function install() {
            try {
                if (frame.contentDocument) LOOMA.speak.installSelectionBands(frame.contentDocument);
            } catch (e) { /* cross-origin frame (never a chapter): leave it alone */ }
        }

        frame.addEventListener('load', install);   // also covers navigation inside the frame
        install();
    })();

//attach LOOMA.speak() to the '.speak' button
//NOTE: this code is different from other pages' speak buttons because looma-pdf.php displays the PDF in an <iframe>
// turn OFF the other CLICK handler, add a new CLICK handler that gets the selection from the iframe
    $('button.speak').off('click').click(function(){
        // HTML/ePaath content lives inside an iframe, so Speak must read the selection from that inner document.
        var viewerFrame = document.getElementById('iframe') || document.getElementById('epaath_iframe');
        var word = viewerFrame && viewerFrame.contentWindow ? viewerFrame.contentWindow.getSelection().toString() : '';
        //console.log ('In PDF viewer - selected text to speak: ', word);
    
        // speak the definition if a lookup popup is showing
        var $def = $('#definition');
        if ($def) word += $def.text();
    
        LOOMA.speak(word);
    });
    
// *********  LANGUAGE SWITCH for an HTML chapter ***************
//   Reuses the global #translate toolbar button, the same way the PDF viewer
//   does (see the click.loomaPdfLang handler in looma-play-pdf.js). Bound with
//   .on() so looma.js's keyword-translation handler still runs first on the same
//   click — the interface language it stores is then what the next page reads.
//
//   looma-html.php puts the other-language file on the iframe as data-altfp /
//   data-altfn, and only when that file really exists on disk. Without it (a
//   Wikipedia article, ePaath, a PhET simulation, or a chapter that was never
//   translated) this handler does nothing at all and Translate keeps its old
//   meaning.
    $('#translate').on('click.loomaHtmlLang', function () {
        var frame = document.getElementById('iframe');
        if (!frame) return;

        var altFp = frame.getAttribute('data-altfp');
        var altFn = frame.getAttribute('data-altfn');
        if (!altFp || !altFn) return;

        try {
            if (window.LOOMA && LOOMA.telemetry) {
                LOOMA.telemetry.track('lang_switch', {
                    from: frame.getAttribute('data-lang')    || null,
                    to:   frame.getAttribute('data-altlang') || null,
                    file: altFn
                });
                if (LOOMA.telemetry.stopChapterTimer) LOOMA.telemetry.stopChapterTimer();
            }
        } catch (e) { /* telemetry must never block the switch */ }

        window.location = 'html?fp=' + encodeURIComponent(altFp) +
                            '&fn=' + encodeURIComponent(altFn);
    });

    //attach LOOMA.lookup() to the '.lookup' button
//NOTE: this code is different from other pages' speak buttons because looma-pdf.php displays the PDF in an <iframe>
// turn OFF the other CLICK handler, add a new CLICK handler that gets the selection from the iframe
    $('button.lookup').off('click').click(function(){
        var viewerWindow = document.getElementById('iframe').contentWindow;
        var word = viewerWindow.getSelection().toString();
        //console.log ('In PDF viewer - selected text to lookup: "', word, '"');
        LOOMA.popupDefinition(word, 15, 'en');
    });
});
