 /*
  * Author: Skip
  * Email: skip@stritter.com
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
    $('button.speak').click(function(){
        var viewerWindow = document.getElementById('iframe').contentWindow;
        var toString = viewerWindow.getSelection().toString();
        console.log ('selected text is ', toString);
        LOOMA.speak(toString);
    });
}); //end document.ready function