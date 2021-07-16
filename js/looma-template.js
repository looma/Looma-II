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
    
    $("#sample_button").click(function() {
        LOOMA.alert("sample alert message", 5, true);
    });
});

