/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 3.0

filename: looma-image.js
author:
Description: JS for looma-xxxx.php
 */

function displayText(result) {
    if (!result.error) $('.text-display').html(result.data);
    else $('.text-display').html('<h2>File not found</h2>');
}; //end displayText()

'use strict';
$(document).ready(function() {

	var div = document.getElementById('the_id');
	if (div)
        $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "text", id: div.getAttribute('data-id')},
                displayText,
                'json'
        );
	else {
	    div = document.getElementById('the_dn');
	    if (div)
            $.post("looma-database-utilities.php",
                {cmd: "open", collection: "text", ft: "text", dn: decodeURIComponent(div.getAttribute('data-dn'))},
                displayText,
                'json'
            );
    };
    


});
