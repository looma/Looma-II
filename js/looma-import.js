/*
Name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 04
Revision: Looma 2.0.0
filename: looma-import.js
 */

'use strict';
$(document).ready (function() {

    $('#check').click (function(){
        $('.filter_checkbox').prop('checked', true);
    });

    $('#uncheck').click (function(){
        $('.filter_checkbox').prop('checked', false);
    });

	$('.theme').change(LOOMA.changeTheme); // change theme when a theme button is clicked

	$('.theme#' + LOOMA.readStore('theme', 'cookie')).attr('checked', 'checked'); //add checkmark on current theme
}); //end of document.ready anonymous function
