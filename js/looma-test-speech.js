/*
LOOMA javascript file
Filename: xxx.JS
Description:
Programmer name: Skip
Date:
Revision: Looma 2.0.x
 */

'use strict';

    $(document).ready (function() {
        $('#synthesis').click(function(){
            LOOMA.speak($('input#text').val(), $(this).attr('id'), null, $('#rate').val());
        });
        $('#mimic').click(function(){
            LOOMA.speak($('input#text').val(), $(this).attr('id'), null, $('#rate').val());
        });
        
        $('#piper').click(function(){
            LOOMA.speak($('input#text').val(), $(this).attr('id'), null, $('#rate').val());
        });
    
        $('#piper-voices').change(function() {
            var newVoice = encodeURIComponent(this.value);
            var engine = 'piper';
            LOOMA.changeVoice(newVoice); // change voice when voice button is clicked
            LOOMA.speak('the voice has been changed', engine, newVoice);
        });
    
    
    }); //end document.ready function
