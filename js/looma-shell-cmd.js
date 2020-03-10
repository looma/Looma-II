/*
LOOMA javascript file
Filename: looma-shell-cmd.js
Description: supports looma-xxx.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: xxx  2017
Revision: Looma 3.0
 */

'use strict';
$(document).ready(function () {
    $('#exec').submit(function(e) {
        e.preventDefault();
        var cmd = $('#input').val();
        LOOMA.confirm('Are you sure you want to exec ' + cmd + '?',
            function(){
                $.post( "looma-system.php",
                    {cmd: cmd},
                    function(result) { },
                    'json'
                )},
            function(){ });
    });
});

