/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 3.0

filename: looma-text-scan.js
author: skip
 */

var sequence = 1;

'use strict';
$(document).ready(function() {
    
    $.post("looma-database-utilities.php",
        {cmd: "openText", collection: "text", skip: sequence},
        function(result) {
            document.querySelector("div#display").innerHTML = result.data;
            $('#legend').html(result.dn);
        },
        'json'
    );

    $('#next').click(function() {
        sequence++;
        $.post("looma-database-utilities.php",
            {cmd: "openText", collection: "text", skip: sequence},
        function(result) {
            document.querySelector("div#display").innerHTML = result.data;
            $('#legend').html(result.dn);
        },
        'json'
    );
    })
});
