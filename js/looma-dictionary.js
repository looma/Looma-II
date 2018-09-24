/*
Author: Grant Dumanian, Jayden Kunwar, Mahir Arora
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 07, 20178 07
Revision: Looma 3.0

filename: looma-dictionary.js
Description:
*/
'use strict';

var displayArea;

    function italicize (def) {  //put part-of-speech in italics
        def = def.replace('pronoun', '<i>pronoun</i>');
        def = def.replace('preposition', '<i>preposition</i>');
        def = def.replace('noun', '<i>noun</i>');
        def = def.replace('verb', '<i>verb</i>');
        def = def.replace('adj.', '<i>adjective</i>');
        def = def.replace('adverb', '<i>adverb</i>');
        def = def.replace('adv.', '<i>adverb</i>');
        def = def.replace('contraction', '<i>contraction</i>');
        return def;
    };

    function OK(html) {
        $('#definitionDisplay').html(html);
    
        var img = document.getElementById('definitionThumb');
        if (img) {
            
            //The MODAL - opens window of image when clicked
            var modal = document.getElementById('definitionImage');
            // Get the image and insert it inside the modal
            var modalImg = document.getElementById("img01");
            img.onclick = function () {
                modal.style.display = "block";
                modalImg.src = this.src;
            };
            // Get the <span> element (x) that closes the modal
            var span = document.getElementsByClassName("close")[0];
            span.onclick = function () {
                modal.style.display = "none";
            };
        }
    
        if ($('#definition').text().length > 100) $('#definition').css('font-size', '0.75em');
        if ($('#rwdef').text().length > 100)      $('#rwdef').css('font-size', '0.75em');
    }; //end OK()
    
    //This is the fail function, used when the Looma database can not find the word
    function fail(jqXHR, textStatus, errorThrown) {
        alert("enter function fail");
        console.log('jqXHR is ' + jqXHR.status);
        window.alert('failed with textStatus = ' + textStatus);
        window.alert('failed with errorThrown = ' + errorThrown);
    } //end FAIL

function getDefinition(event) {
    event.preventDefault();
    var input = document.getElementById("input").value;
    LOOMA.define(input, OK, fail);
    return false;
}; //end getDefinition()

$(document).ready (function() {
    
    var elem = document.getElementById("lookup");
    elem.addEventListener('submit', getDefinition);
 
    // SPEAK button will say the word, unless text is selected, in which case, it will speak the selected text
    $('button.speak').off('click').click(function () {
        var selection, word, pos, definition, rwdef, toSpeak;
    
        selection = document.getSelection().toString();
        word =      document.getElementById('input').value;
        pos =       document.getElementById('partOfSpeech'); if (pos) word += ', ' + pos.innerText;
        if (document.getElementById('definition')) definition = document.getElementById('definition').innerText;
        if (definition && definition != "") {
            definition = definition.replace("(v)", " verb ");
            definition = definition.replace("(n)", " noun ");
            word += ', ' + definition;
        };
        rwdef = document.getElementById('rwdef'); if (rwdef) word += ', ' + rwdef.innerText;
    
        toSpeak = (selection ? selection : word);
        console.log('VOCAB: speaking ', toSpeak);
        LOOMA.speak(toSpeak);
        
    }); //end speak button onclick function
});
