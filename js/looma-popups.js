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

var popup = (function()
{  //IIFE returns functions popup.alert(), popup.confirm(), and popup.prompt()
    var $window  = $(window);

    var $popup   = $('<div class="popup" />');
    var $content = $('<div class="popup-content" />');
    var $close   = $('<button class="popup-dismiss"> X </button>');

    $popup.append($content, $close);

    // dismiss
    $('.popup-dismiss').click(close());

    // if the user clicks outside the popup, then dismiss the popup
    window.onclick = function(e) {
        if (e.target !== $popup) popup.close();
    };

    return {

        //ALERT takes 2 arguments
        //  'element' is a javascript element representing the HTML to be displayed in the POPUP
        //  'time' is the number of seconds to display the POPUP. If time is 0 or not given, the POPUP does not timeout
        alert: function (contents, secs) // 'contents' is a jQuery object, 'secs' is 0 or number of seconds to display the popup
        {
            $content.empty().append(contents);
            $popup.appendTo('body');

            // is SECS is specified, timeout the popup in seconds
            if (secs && secs !== 0) setTimeout(function() {popup.close();}, secs * 1000);
        },  //end ALERT()

        //CONFIRM takes 3 arguments
        //  'element' is a javascript element representing the HTML to be displayed in the POPUP
        //  'confirmed() is a callback that is called if the user clicks 'confirm'
        //  'concelled() is a callback if the user clicks 'cancel' or dismisses the POPUP with the 'X' button
        confirm: function(element, confirmed, cancelled)
        {

        },  //end CONFIRM()

        //PROMPT takes 3 arguments
        //  'element' is a javascript element representing the HTML to be displayed in the POPUP
        //  'confirmed(text) is a callback that is called if the user inputs text
        //  'concelled() is a callback if the user click 'cancel' or dismisses the POPUP with the 'X' button
        prompt: function (element, confirmed, cancelled)
        {

        },  //end PROMPT()

        close: function () {
            $content.empty();
            $popup.detach();
        }   //end CLOSE()

    };
}());  //end of IIFE to create 'popup'
