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
        function yes()  {
            console.log('YES');
        };
        function no()   {
            console.log('NO');
        };

        $('#alert').click(  function(){LOOMA.alert("alert", 10);});
        $('#confirm').click(function(){LOOMA.confirm("confirm", yes, no);});
        $('#prompt').click( function(){LOOMA.prompt("prompt", yes, no);});
     };