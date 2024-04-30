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
var option = "code";

function startEllipsis() {
    ellipsisTimer = setInterval(
    function () {
        $('#ellipsis').text($('#ellipsis').text().length < 10 ? $('#ellipsis').text() + '.' : '');
    },
500);
};

function stopEllipsis() {
    clearInterval(ellipsisTimer);
    $('#ellipsis').empty();
};

function disableButtons () {$('.buttons').prop('disabled',true);};
function enableButtons  () {$('.buttons').prop('disabled',false);};

function back() {window.location = 'settings';};

function cancel() {
    $("#1, #2, #3, #4, #radios, #button-div").show();
    $('#warning, #waiting').empty().show();
}

function checknetworkspeed() {
    disableButtons();
    startEllipsis();
    $('#message-box').show();
    $('#warning').html('Checking network speed. This takes about 1 minute').show();
    $('#waiting').show();
   // $('#radios').hide();
    $.post("looma-updater.php",
        {cmd: "nwspeed"},
        function (result) {
            stopEllipsis();
            $('#waiting, #warning, #ellipsis').empty();
            //$('#message-box, #warning, #waiting').hide();
            LOOMA.alert(result + '<br>Click UPDATE to update the Looma at this network speed');
            enableButtons();
    
        }
    );
}

function update() {
    LOOMA.confirm('Update this Looma? This may take a long time. Do not turn off the Looma or disconnect from Internet',
        function(){
           // $("p.info, #radios, #button-div").hide();
            $('#warning').html('Updating '+ option + '<br>This can take a long time').show();
            $('#waiting').text('Please wait').show();
    
            startEllipsis();
            disableButtons();
    
            $.post("looma-updater.php",
                {cmd: "update",
                 option: option
                },
                function (result) {
                    stopEllipsis();
                    $('#waiting').empty();
                    $('#warning').html(result).show();
                    enableButtons();
                }
            );
            
        },
        cancel
    );
};

$(document).ready( function () {
    
    // check if the system is online
    if (!navigator.onLine) {
        LOOMA.alert('This Looma is not connected to the Internet', 0, false);
        //parent.history.back();
    } else {
        // check network speed
        $('#1').text('Click "Update" to update the code and content on this Looma.');
        $('#2').text('Looma must be connected to the Internet. This may take a long time depending on network speed.');
        $('#3').text('Do not interrupt the update process. Leave the Looma powered on and idle.');
        $('#4').text('If the process is interrupted, you can try to run this Update again.');
    };
    
    $("input[type='radio'][name='code']").click(function () {
        $('#button-div').show();
        option = this.value;
    });
    
    $('#update').click(function () {
        $('#message-box').show();
        $('#warning').empty();
        $('#waiting').empty();
        update();
    });
    
    $('#network').click(checknetworkspeed);
    $('#cancel').click(back);
    
});