/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: xxxxx.js
Description:
 */

'use strict';

/*check navigator.onLine to see if we have an internet connection
 *         NOTE: need to verify that nav.onLine works with all browsers
 */


/* NOTE: tried this alternative to "navigator.onLine" [used below] with XHR check, but keep getting CORS faults trying to access outside resources
 * like google, bing, or even villagetechsolutions
 *
function internet() { //check if can access the internet
    var xhr = new XMLHttpRequest();
    var target = 'http://looma.website/index.php?rand=' + Math.round(Math.random() * 1000);
    xhr.open ('HEAD', target, false);  //'false' for synchronous XHR
    try {
            xhr.send();
            return (xhr.status >= 200 && xhr.status <= 304);
    }
    catch(e) {return false;}
};  //end INTERNET()
 */

var addressBar = document.getElementById("address-bar");
var submitButton = document.getElementById("submit");

var backButton = document.getElementById("back");
var forwardButton = document.getElementById("forward");

function navigate() {
    var url = addressBar.value;
    // If "http://" or "https://" isn't added, the iframe will treat it like a relative URL.
    if (!url.indexOf('http') == 0) {
        url = 'https://' + url;
    }
    $('#frame').attr('src', url);
    // We can't keep track of the url in the iframe, so it's better not to show it.
    addressBar.value = "";
}

$(document).ready(function() {
    if (navigator.onLine) {
        console.log('WEB:  internet connection is OK');

        $('#frame').attr('src', 'https://www.bing.com');
        // Google has issues with cross-origin access - a Chrome Plugin should be able to override it

    } else {
        console.log('WEB: No internet connection');
        $('#frame').attr('src', 'looma-503.php');
    };

    addressBar.addEventListener("keydown", function(e) {
         const CR = 13;  // RETURN key maps to keycode `13`
        if (e.keyCode == CR) {
            navigate();
        }
    });
    
    toolbar_button_activate ("web");

    submitButton.addEventListener("click", navigate);

    backButton.addEventListener("click", function() {
        history.back();
    });
    forwardButton.addEventListener("click", function() {
        history.forward();
    });
});
