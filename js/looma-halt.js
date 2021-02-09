/*
LOOMA javascript file
Filename: looma-halt.js
Description: supports looma-xxx.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: xxx  2017
Revision: Looma 3.0
 */

'use strict';
$(document).ready(function () {
    
    // Ask for password first
    
    LOOMA.confirm('Are you sure you want to halt Looma?',
        function(){
            $.post( "looma-system.php",
                    {cmd: "halt"},
                    function(result) { },
                    'json'
                )},
        function(){window.history.back()}, false);
});

