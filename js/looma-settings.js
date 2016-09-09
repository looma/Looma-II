/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: xxxxx.js
Description:
 */

'use strict';
$(document).ready (function() {
    $('.theme').change(LOOMA.changeTheme); // change theme when a theme button is clicked
    $('.theme#' + LOOMA.readStore('theme', 'cookie')).attr('checked', 'checked'); //add checkmark on current theme

    $('.voice').change(LOOMA.changeVoice); // change voice when voice button is clicked
    $('.voice#' + LOOMA.readStore('voice', 'cookie')).attr('checked', 'checked'); //add checkmark on current voice

    console.log('reading cookie: ' + LOOMA.readStore('voice', 'cookie'));
    console.log('setting CHECKED on: ', '.voice#' + LOOMA.readStore('voice', 'cookie'));

    if (!LOOMA.loggedIn())  //not logged in
    {   $('#login-status').text('You are not logged in');
        $('.login').text('Login for Advanced Settings').click( function(){ window.location = "looma-login.php";});

    }
    else //logged in
    {   $('#login-status').text('You are logged in as ' + LOOMA.readStore('login', 'cookie'));
        $('.settings-control').show();
        $('.login').toggleClass('loggedIn').text('Logout').click
            ( function()
                {
                LOOMA.confirm('are you sure you want to log out?',
                    function(){window.location = "looma-logout.php";},
                    function(){}, true);
                }
            );

    }

}); //end of document.ready anonymous function
