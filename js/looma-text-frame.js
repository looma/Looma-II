  /*
LOOMA javascript file
Filename: looma-text-editor.JS
Description:

    NOTE: This JS is for looma-text-frame.php - the embedded looma
            page another editor [e.g. lesson-plan.php
    NOTE: there is a different JS (looma-edit-text.js)
            which is a stand-alone looma page for text editing
            
           
Programmer name: skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: nov 2016
Revision: Looma 2.4
 */

'use strict';


// new function June 2017 - used to close the text-editor iFrame when called from in another editor, e.g. lesson plan
    function quitframe(e) {
      $('#main-container-horizontal', window.parent.document).removeClass('all-transparent');
      $('#commands', window.parent.document).removeClass('all-transparent');
      $('#text-editor', window.parent.document).hide();
    }

    callbacks ['quit'] = quitframe;
    
    $(document).ready(function ()
    {
        
        
        
        $('#dismiss').off('click').click( quitframe );  //close the text edit iframe and go back to the calling editor
    });
