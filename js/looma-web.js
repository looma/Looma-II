/*
 * Name: Skip
Email: skip@stritter.com
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

$(document).ready(function()
    {if (navigator.onLine)
        {
            console.log('WEB:  internet connection is OK');
             $('#frame').attr('src','http://www.bing.com');
             //  NOTE: cant use GOOGLE - they dont allow cross-origin access inside an iframe !

        }
     else
         {
              console.log('WEB: No internet connection');
             $('#frame').attr('src','looma-404.php');
             }
     }
 );

