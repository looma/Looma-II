/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 3.0

filename: looma-image.js
author:
Description: JS for looma-xxxx.php
 */

'use strict';
$(document).ready(function() {

	var div = document.getElementById('the_id');
	$.post("looma-database-utilities.php",
			{cmd: "openByID", collection: "text", id: div.getAttribute('data-id')},
			function(result) {
				document.querySelector("div#display").innerHTML = result.data;
			},
			'json'
	);


});
