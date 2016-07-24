/*
LOOMA javascript file
Filename: xxx.JS
Description:

Programmer name:
Email:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision: Looma 2.0.x

Comments:
 */

'use strict';

/*define functions here */

window.onload = function ()
    {
        var contents = $('<p>popup content here </p>');
        $('.alert').on('click', function() {popup.alert(contents, 0);});
    };