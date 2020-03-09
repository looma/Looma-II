/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 3.0

filename: looma-text-scan.js
author: skip
 */

var sequence = 1;

function fetch(seq) {
    $.post("looma-database-utilities.php",
        {cmd: "openText", collection: "text", skip: seq},
        function(result) {
            document.querySelector("div#display").innerHTML = result.data;
            $('#dn').html(result.dn);
            $('#edit').attr('data-dn',result.dn);
        },
        'json'
    );
};

'use strict';
$(document).ready(function() {
    
    fetch();
    
    
    $('#next').click(function() {
        sequence++;
        fetch(sequence);
    });
    
    $('#prev').click(function() {
        sequence--;
        fetch(sequence);
    });
    
    $('#plus10').click(function() {
        sequence += 10;
        fetch(sequence);
    });
    
    $('#minus10').click(function() {
        sequence -= 10;
        fetch(sequence);
    });
    
    $('#edit').click(function() {
      if (sequence >= 0) window.open('looma-edit-text.php?dn=' + encodeURIComponent($(this).attr('data-dn')));
    });
});
