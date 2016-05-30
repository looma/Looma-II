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

window.onload = function() {
	
			var on = true;
			$('#canvas').click(function()
				{
					
					console.log('cursor is ' + $('#canvas').css('cursor'));
					
					if (on) $('#canvas').css("cursor", 'no-drop');
					else 	$('#canvas').css("cursor", 'crosshair');
							
					on = !on;
				});
	};
