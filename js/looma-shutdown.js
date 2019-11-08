/*
LOOMA javascript file
Filename: looma-shutdown.js
Description: supports looma-xxx.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: xxx  2017
Revision: Looma 3.0
 */

'use strict';
$(document).ready(function () {
    LOOMA.confirm('Are you sure you want to shut down Looma?',
    function(){window.location = "looma-system.php?cmd=shutdown";},
    function(){window.history.back()}, false);
});

