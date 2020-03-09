 /*
  * Author: Skip
  *
  * Owner: VillageTech Solutions (villagetechsolutions.org)
  * Date: 2016 02
  * Revision: Looma 2.0.0
  * File:  looma-pdf.js
  *
  */

'use strict';

$(document).ready (function() {

//attach LOOMA.speak() to the '.speak' button
//NOTE: this code is different from other pages' speak buttons because looma-pdf.php displays the PDF in an <iframe>
// turn OFF the other CLICK handler, add a new CLICK handler that gets the selection from the iframe
    $('button.speak').off('click').click(function(){
        var viewerWindow = document.getElementById('iframe').contentWindow;
        var word = viewerWindow.getSelection().toString();
        //console.log ('In PDF viewer - selected text to speak: ', word);
        
        // speak the definition if a lookup popup is showing
        var $def = $('#definition');
        if ($def) word += $def.text();
        
        LOOMA.speak(word);
    });

    //attach LOOMA.lookup() to the '.lookup' button
//NOTE: this code is different from other pages' speak buttons because looma-pdf.php displays the PDF in an <iframe>
// turn OFF the other CLICK handler, add a new CLICK handler that gets the selection from the iframe
    $('button.lookup').off('click').click(function(){
        var viewerWindow = document.getElementById('iframe').contentWindow;
        var word = viewerWindow.getSelection().toString();
        console.log ('In PDF viewer - selected text to lookup: "', word, '"');
        LOOMA.popupDefinition(word, 15);
    });
}); //end document.ready function
