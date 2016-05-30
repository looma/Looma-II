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
}); //end of document.ready anonymous function
