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

        function changelogo()
        {
            var logos = document.getElementsByClassName('looma-logo');
            logos[0].src = 'images/logos/VTS.jpg';
        };

        var button = document.getElementById('teach');

        button.addEventListener('click', changelogo);

    };