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

window.onload = function()
{
		$('#show').click(function(e){e.preventDefault(); $('#iframe').toggle(1000);});
		var id = "58fd32b7cc33e63103d63af2";
		LOOMA.makeActivityButton(id, "", $('#test')[0]);

};
