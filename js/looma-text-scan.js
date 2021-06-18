/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 3.0

filename: looma-text-scan.js
author: skip
 */

/* FUTURE CENHANCEMENT:
    Use the filter term to look up a lesson in lessons collection
    and show all the text-files from that lesson - OK we do this by having ch_id in the lesson name
    
    another improvement: get a COUNT from mongo [based on the FILTER, if any] and grey out
    NEXT, PREV, +10 and -10 buttons if they will go beyond the range [0..count]
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
                   // document.querySelector("div#text-display").innerHTML = result.data;
                    $('#dn').html(result.dn);
                    $('#edit').attr('data-id', result._id.$id || result._id.$oid);
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
        if (sequence > 1) {
            sequence--;
            fetch(sequence);
        }
    });
    
    $('#plus10').click(function() {
        sequence += 10;
        fetch(sequence);
    });
    
    $('#minus10').click(function() {
        if (sequence > 10) {
            sequence -= 10;
        } else {
            sequence = 1;
        }
        fetch(sequence);
    });
    
    $('#filter').click(function(){
        sequence = 1;
        fetch(sequence);
    });

    $('#edit').click(function() {
      if (sequence >= 0) window.open('looma-edit-text.php?id=' + encodeURIComponent($('#edit').attr('data-id')));
    });
});
