/*
LOOMA javascript file
Filename: xxx.JS
Description:

Programmer name:
Email:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision: Looma 2.0.x

Comments:
 */

'use strict';

/*define functions here */



    $(document).ready (function() {
        $('#synthesis').click(function(){
            LOOMA.speak($('input#text').val(), $(this).attr('id'));
        });
        $('#mimic').click(function(){
            LOOMA.speak($('input#text').val(), $(this).attr('id'));
        });
        
        $('#rate').change(function(){
            speechSynthesis.rate =  $(this).val();
        });

    /*  $('button.synthesis').click(function(){speak('hello looma. speech is working');});

        $('input#text').change(function(){
            //$('input:textbox').val()
            LOOMA.speak(this:textbox.val());
        });
    */
    }); //end document.ready function
