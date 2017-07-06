/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-epaath.js
Description: image display JS for looma-image.php
 */

'use strict';
$(document).ready(function() {

    /*
        $('#fullscreen').click(function (e) {
                e.preventDefault();
                screenfull.toggle(this);
            });
    */

        //attach LOOMA.speak() to the '.speak' button
            $('button.speak').click(function(){
                var toString = window.getSelection().toString();
                console.log ('selected text is', toString);
                LOOMA.speak(toString);
            });
        });
