/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: xxxxx.js
Description:
 */

'use strict';
$(document).ready (function() {

        var right = document.getElementById("scroll-right");
        var left = document.getElementById("scroll-left");

        left.addEventListener("click", function(){
           document.getElementById("playground").scrollLeft += 200;
        });

        right.addEventListener("click", function(){
            document.getElementById("playground").scrollLeft -= 200;
        });

}); //end of document.ready anonymous function
