/*
LOOMA javascript file
Filename: looma-template.js
Description: supports looma-xxx.php

Programmer name: Skip
Owner: Looma Education Company
Date: xxx  2017
Revision: Looma 3.0
 */

'use strict';
/* declare global variables here */

/* declare functions here */

$(document).ready( function () {
    //initialization code here
        
        /* Set up the initial map center and zoom level */
        var map = L.map('map', {
        center: [31.74, -99.9], // EDIT coordinates to re-center map
        zoom: 12,  // EDIT from 1 (zoomed out) to 18 (zoomed in)
        tap: false
    });
 
});

