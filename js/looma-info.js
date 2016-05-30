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

$(document).ready(function ()
    {
    function roll()
        {
        $('#credits-wrapper').css('top', '');
        $('#credits-wrapper').animate({top:"-450%"}, 30000, roll);
        //adjust 'top:"-xxx%"}' when adding more names
        //adjust [time=]30000 to go faster or slower
        };

    roll();
    });

