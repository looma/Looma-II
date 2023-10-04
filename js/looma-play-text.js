/*
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 3.0

filename: looma-image.js
author:
Description: JS for looma-xxxx.php
 */
'use strict';

function displayText(result) {
    if (result.dn !== 'File not found') {
        var native = (result.nepali) ? result.nepali : result.data;
        var html = '<div class="english">' + result.data + '</div><div class="native" hidden>' + native + '</div>';
        $('.text-display').html(html);
        LOOMA.translate(language);
    
    }
    else $('.text-display').html('<h2>File not found</h2>');
}; //end displayText()

function removeTags(str) {
    if ((str===null) || (str===''))
        return '';
    else
        str = str.toString();
    return str.replace( /(<([^>]+)>)/ig, '');
}

$(document).ready(function() {


// SPEAK button will read the whole slide,
//     unless text is selected, in which case, it will speak the selected text
    $('button.speak').off('click').click(function () {
        var selection, texts, slide, toSpeak;
        
        selection = document.getSelection().toString();
        if (!selection) selection = removeTags($('.english').html());
        
        selection = $("<textarea/>").html(selection).text();
       
        //texts = [];
        //$('#editor').find('.english').find('span').each(function() {texts.push($(this).text());});
        //slide = texts.join(' ');
       // toSpeak = (selection ? selection : slide);
        console.log('Text file: speaking "' + selection + '"');
        LOOMA.speak(selection);
    }); //end speak button onclick function
    
    
    var div = document.getElementById('the_id');
	if (div)
        $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "text",
                    db: div.getAttribute('data-db'),
                    id: div.getAttribute('data-id')},
                displayText,
                'json'
        );
	else {
	    div = document.getElementById('the_dn');
	    if (div)
            $.post("looma-database-utilities.php",
                {cmd: "open", collection: "text", ft: "text",
                    db: div.getAttribute('data-db'),
                    dn: decodeURIComponent(div.getAttribute('data-dn'))},
                displayText,
                'json'
            );
    };
    


});
