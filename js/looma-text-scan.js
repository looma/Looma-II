/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 3.0

filename: looma-text-scan.js
author: skip
 */

/* FUTURE CENHANCEMENT:
    Use the filter term to look up a lesson in lessons collection
    and show all the text-files from that lesson
 */
var sequence = 1;

function fetch(seq) {
    if (seq > 0) {
        $.post("looma-database-utilities.php",
            {
                cmd: "openText", collection: "text",
                filter: $('#filterterm').val(), skip: seq-1
            },
            function (result) {
                if (result.hasOwnProperty('error')) {
                    $('div#text-display').html('<br><br>' + $('#filterterm').val() + ' not found');
                    $('#dn').html("");
                    $('#edit').attr('data-id', "");
                } else {
                    $('div#text-display').html(result.data);
                    document.querySelector("div#text-display").innerHTML = result.data;
                    $('#dn').html(result.dn);
                    $('#edit').attr('data-id', result._id.$id);
                }
                ;
            },
            'json'
        );
    }
};

'use strict';
$(document).ready(function() {
    
    fetch(sequence);
    
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
    
    $('#filter').click(function(){
        sequence = 1;
        fetch(sequence);
    });

    $('#edit').click(function() {
      if (sequence >= 0) window.open('looma-edit-text.php?dn=' + encodeURIComponent($('#edit').attr('data-id')));
    });
});
