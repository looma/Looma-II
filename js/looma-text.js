/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-image.js
Description: image display JS for looma-image.php
 */

'use strict';
$(document).ready(function() {

	var div = document.getElementById('the_id');
	$.post("looma-database-utilities.php",
			{cmd: "openByID", collection: "text", id: div.getAttribute('data-id')},
			function(result) {
				document.querySelector("div#fullscreen").innerHTML = result.data;
			},
			'json'
	);

	$('#fullscreen').click(function (e) {
			e.preventDefault();
			screenfull.toggle(this);
            });

});