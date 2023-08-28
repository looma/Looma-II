/*
LOOMA javascript file
Filename: looma-update.js
Description: supports looma-update.php

Programmer name: Skip
Owner: Looma Education Company
Date: AUG  2023
 */

'use strict';
var ellipsisTimer;
function starttimer() {
    ellipsisTimer = setInterval(
    function () {
        $('#ellipsis').text($('#ellipsis').text().length < 10 ? $('#ellipsis').text() + '.' : '');
    },
        500);
};

function stoptimer() {clearInterval(ellipsisTimer);};

function back() {parent.history.back();};

function update() {
    LOOMA.confirm('Update this Looma? This may take a long time. Do not turn off the Looma or disconnect from Internet',
        function(){
            $("#1, #2, #radios, #button-div").hide();
            $('#warning, #waiting').show();
        },
        back
    );
};

$(document).ready( function () {
    
    // check if the system is online
    if (!navigator.onLine) {
        LOOMA.alert('This Looma is not connected to the Internet', 10, false);
        parent.history.back();
    } else {
        // check network speed
        // $('#1').text('Update Looma code and content');
        $('#2').text('This may take a long time depending on network speed');
    };
    
    $("input[type='radio'][name='code']").click(function () {
        $('#button-div').show();
        var includecontent = this.value;
    });
    
    $('#submit').click(function () {
        $('#warning').text('Checking network speed.');
        
        starttimer();
        
        $.post("looma-updater.php",
            {cmd: "nwspeed"},
            function (result) {
                stoptimer();
                $('#warning, #waiting').hide();
                LOOMA.confirm(result + 'Continue at this network speed?',
                    update,
                    back);
            }
        );
        
        $('#cancel').click(function () {
            parent.history.back();
        })
    });
});