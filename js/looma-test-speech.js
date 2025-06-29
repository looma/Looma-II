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
            LOOMA.speak($('input#text').val(), 'synthesis', null, $('#rate').val());
        });
        $('#mimic').click(function(){
            LOOMA.speak($('input#text').val(), 'mimic', "cmu_us_axb", $('#rate').val());
        });
        
        $('#piper').click(function(){
            LOOMA.speak($('input#text').val(), 'piper', piperVoice, $('#rate').val());
        });
    
        var piperVoice = "en_US-amy-medium.onnx"; //default
        
        $('#piper-voices').change(function() {
            piperVoice = encodeURIComponent(this.value);
            var engine = 'piper';
            LOOMA.changeVoice(newVoice); // change voice when voice button is clicked
            LOOMA.speak('the voice for piper has been changed', engine, piperVoice);
        });
    
    
    }); //end document.ready function
