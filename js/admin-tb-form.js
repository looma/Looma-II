/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: admin-tb-form.js
Description: validates the textbook input form
 */

'use strict';

// Function called when the form is submitted.
// Function validates the form data.
function validateForm(e) {
    'use strict';

    // Get the event object:
	if (typeof e == 'undefined') e = window.event;

    // Get form references:
	var grade = $("input[name='class']:checked").val();
	var subject = $("input[name='subject']:checked").val();
	var dn = $('#dn').val();
	var fn = $('#fn').val();
	var fp = $('#fp').val();
	var nfn = $('nfn').val();

	// Flag variable:
	var error = false;

	// Validate the display name:
	if (/^[A-Z _\.\-'\?]{2,30}$/i.test(dn)) {
		removeErrorMessage('dn');
	} else {
		addErrorMessage('dn', 'Please enter a display name between 2 and 30 chars (no special chars).');
		error = true;
	}
	
	// Validate the file name:
	if (/^[A-Z\.\-']{2,30}$/i.test(fn)) {
		removeErrorMessage('fn');
	} else {
		addErrorMessage('fn', 'Please enter a filename and valid extension (no special chars).');
		error = true;
	}
	
	// Validate the filepath:
	if (/^[A-Z\.\-']{2,30}$/i.test(fp)) {
		removeErrorMessage('fp');
	} else {
		addErrorMessage('fp', 'Please enter a valid filepath ending with "/".');
		error = true;
	}
	
	// Validate the native filename:
	if ((!nfn.value) || (/^[A-Z\.\-']{2,30}$/i.test(nfn))) {
		removeErrorMessage('nfn');
	} else {
		addErrorMessage('nfn', 'Please enter a filename and valid extension (no special chars).');
		error = true;
	}


    // If an error occurred, prevent the default behavior:
	if (error) {

		// Prevent the form's submission:
	    if (e.preventDefault) {
	        e.preventDefault();
	    } else {
	        e.returnValue = false;
	    }
	    return false;
    
	}
    
} // End of validateForm() function.

function addErrorMessage(id, msg) {
   	'use strict';
    
    // Get the form element reference:
    var elem = document.getElementById(id);
    
    // Define the new span's ID value:
    var newId = id + 'Error';
    
    // Check for the existence of the span:
    var span = document.getElementById(newId);
    if (span) {
        span.firstChild.value = msg; // Update
    } else { // Create new.
    
        // Create the span:
        span = document.createElement('span');
        span.id = newId;
		span.className = 'error';
        span.appendChild(document.createTextNode(msg));
        
        // Add the span to the parent:
        elem.parentNode.appendChild(span);
        elem.previousSibling.className = 'error';

    } // End of main IF-ELSE.

} // End of addErrorMessage() function.

// This function removes the error message.
// It takes one argument: the form element ID.
function removeErrorMessage(id) {
   	'use strict';

    // Get a reference to the span:
    var span = document.getElementById(id + 'Error');
	if (span) {
    
	    // Remove the class from the label:
	    span.previousSibling.previousSibling.className = null;
    
	    // Remove the span:
	    span.parentNode.removeChild(span);

	} // End of IF.
    
} // End of removeErrorMessage() function.

// Function called when the terms checkbox changes.
// Function enables and disables the submit button.
function toggleSubmit() {
	'use strict';
    
	// Get a reference to the submit button:
	var submit = $('submit');
	
	// Toggle its disabled property:
	if ($('terms').checked) {
		submit.disabled = false;
	} else {
		submit.disabled = true;
	}
	
} // End of toggleSubmit() function.

$(document).ready (function() {		
		
	 //U.addEvent(U.$('tb-form'), 'submit', validateForm);
		
	$('#tb_form').submit(validateForm);
	$('input#date').value = Date().now; //embed today's date in the form
	
}); //end of document.ready anonymous function
