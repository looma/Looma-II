// Script 10.7- register.js
// This script validates a form.

// Function called when the form is submitted.
// Function validates the form data.
function validateForm(e) {
    'use strict';

    // Get the event object:
    if (typeof e == 'undefined') e = window.event;

    // Get form references:
    var displayname = $('#displayname');
    var nativedisplayname = $('#nativedisplayname');
    var pagenum = $('#pagenum');
    var nativepagenum = $('#nativepagenum');
    var filename = $('#filename');
    var nativefilename = $('#nativefilename');
    var filepath = $('#filepath');
    var filetype = $('#filetype');
    var affiliation = $('#affiliation');
    var chapter_id = $('#chapter_id');
    var MB = $('#MB');
    var min = $('#min');

    // Flag variable:
    var error = false;

    // Validate all input into fields, managing only the fields that actually exist for this type of record
    if(displayname != null)
    {
        if (typeof displayname.value == 'string' || displayname.value == "")
        {
            LOOMA.removeErrorMessage('displayname');
        }
        else
        {
            LOOMA.addErrorMessage('displayname', 'Please ensure that your displayname is a string');
            error = true;
        }
    }

    if(nativedisplayname != null)
    {
        if (typeof nativedisplayname.value == 'string' || nativedisplayname.value == "")
        {
            LOOMA.removeErrorMessage('nativedisplayname');
        }
        else
        {
            LOOMA.addErrorMessage('nativedisplayname', 'Please ensure that your nativedisplayname is a string');
            error = true;
        }
    }

    if(pagenum != null)
    {
        if (/^[0-9]+$/.test(pagenum.value) || pagenum.value == "")
        {
            LOOMA.removeErrorMessage('pagenum');
        }
        else
        {
            LOOMA.addErrorMessage('pagenum', 'Please ensure that your pagenum is numeric');
            error = true;
        }
    }

    if(nativepagenum != null)
    {
        if (/^[0-9]+$/.test(nativepagenum.value) || nativepagenum.value == "")
        {
            LOOMA.removeErrorMessage('nativepagenum');
        }
        else
        {
            LOOMA.addErrorMessage('nativepagenum', 'Please ensure that your nativepagenum is a numeric');
            error = true;
        }
    }

    if(filename != null)
    {
        if (/^([a-z]|-|_|[0-9])+.(mp4|jpg|pdf|png|gif|jpeg)$/i.test(filename.value) || /^[0-9]{7}$/.test(filename.value) || filename.value == "")
        {
            LOOMA.removeErrorMessage('filename');
        }
        else
        {
            LOOMA.addErrorMessage('filename', 'Please ensure that your filename is valid');
            error = true;
        }
    }

    if(nativefilename != null)
    {
        if (/^([a-z]|-|_|[0-9])+.(mp4|jpg|pdf|png|gif|jpeg)$/i.test(nativefilename.value) || /^[0-9]{7}$/.test(nativefilename.value) || nativefilename.value == "")
        {
            LOOMA.removeErrorMessage('nativefilename');
        }
        else
        {
            LOOMA.addErrorMessage('nativefilename', 'Please ensure that your nativefilename is valid');
            error = true;
        }
    }

    if(filetype != null)
    {
        if (/^(mp4|jpg|pdf|png|gif|EP)$/.test(filetype.value) || filetype.value == "")
        {
            LOOMA.removeErrorMessage('filetype');
        }
        else
        {
            LOOMA.addErrorMessage('filetype', 'Please ensure that your filetype is valid');
            error = true;
        }
    }

    if(filepath != null)
    {
        if (/^(([0-9]|[a-z]|-|_)+\/)+$/i.test(filepath.value) || /^..\/(([0-9]|[a-z]|-|_)+\/)+$/.test(filepath.value) || filepath.value == "")
        {
            LOOMA.removeErrorMessage('filepath');
        }
        else
        {
            LOOMA.addErrorMessage('filepath', 'Please ensure that your filepath is valid');
            error = true;
        }
    }

    if(affiliation != null)
    {
        if (typeof affiliation.value == 'string' || affiliation.value == "")
        {
            LOOMA.removeErrorMessage('affiliation');
        }
        else
        {
            LOOMA.addErrorMessage('affiliation', 'Please ensure that your affiliation is valid');
            error = true;
        }
    }

    if(chapter_id != null)
    {
        if(/^[1-8](EN|S|M|SS|N)[0-9]{2}$/.test(chapter_id.value)|| /^[1-8](EN|S|M|SS|N)[0-9].[0-9]{2}$/.test(chapter_id.value) || chapter_id.value == "")
        {
            LOOMA.removeErrorMessage('chapter_id');
        }
        else
        {
            LOOMA.addErrorMessage('chapter_id', 'Please ensure that your chapter_id is valid');
            error = true;
        }
    }

    if(MB != null)
    {
        if (/^([0-9]|.)+$/.test(MB.value) || MB.value == "")
        {
            LOOMA.removeErrorMessage('MB');
        }
        else
        {
            LOOMA.addErrorMessage('MB', 'Please ensure that your MB is numeric');
            error = true;
        }
    }

    if(min != null)
    {
        if (/^[0-9]{1,3}:[0-9]{2}$/.test(min.value) || min.value == "")
        {
            LOOMA.removeErrorMessage('min');
        }
        else
        {
            LOOMA.addErrorMessage('min', 'Please ensure that your length is numeric');
            error = true;
        }
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

// Function called when the terms checkbox changes.
// Function enables and disables the submit button.
function toggleSubmit() {
    'use strict';

    // Get a reference to the submit button:
    var submit = $('#submit');

    // Toggle its disabled property:
    if ($('#terms').checked) {
        submit.disabled = false;
    } else {
        submit.disabled = true;
    }

} // End of toggleSubmit() function.

// Establish functionality on window load:
window.onload = function() {
    'use strict';

    // The validateForm() function handles the form:
    LOOMA.addEvent($('#form'), 'submit', validateForm);

    // Disable the submit button to start:
    //$('submit').disabled = true;

    // Watch for changes on the terms checkbox:
    //LOOMA.addEvent($('terms'), 'change', toggleSubmit);

    // Enbable tooltips on the phone number:
    //U.enableTooltips('phone');

};