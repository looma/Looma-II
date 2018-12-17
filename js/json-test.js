/*
LOOMA javascript file
Filename: looma-template.js
Description: supports looma-xxx.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: xxx  2017
Revision: Looma 3.0
 */

'use strict';

$(document).ready (function() {
 
 /*   $.getJSON({
        "../json/json_test.json",
        function(data) {
            console.log('got ' + data['name']);
            //$('#display').text(response.name);
        }
    });
 */
    $.getJSON("../json/json_test.json",
        function (data){
            $('#display').text('name ' + data.name + ', job ' + data.job + ', company ' + data.company);
    });
});
