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

function getDefinition(event) {
    event.preventDefault();
/*
    //This is the "success" code, which reads the word and returns all of its attributes
    function gotAWord(definition) {
        
        //This gets the word's definition and displays it in the HTML
        
        var def = italicize(definition.def);
        
             if (def == 'past tense of') def = def + ' ' + definition.rw;
        else if (def == 'third person singular of') def = def + ' ' + definition.rw;
        
        //This gets the word itself, turns it to uppercase, and displays it in the HTML
        //displayArea = document.getElementById("definitionDisplay")
        //displayArea.innerHTML = '<p>' + def.replace(/;/g, '</p><p>') + '<\p>';
        $('#definitionDisplay').html('<p>' + def.replace(/;/g, '</p><p>') + '<\p>');
        
        //var displayAreatwo = document.getElementById("english");
        //var englishWord = document.getElementById("input").value;
        //var upperEnglishWord = englishWord.toUpperCase();
        //displayAreatwo.textContent = upperEnglishWord;
      //  $('#english').text( $('#input').val().toUpperCase());
        
        //var displayAreathree = document.getElementById("nepali");
        //displayAreathree.textContent = definition.np;
      //  $('#nepali').text(definition.np);
        
        //document.getElementById("input").value = '';
        $('#input').val(' ');
        
        event.preventDefault();
        
        $('#rootWord, #rwNepali, rwDefinition').empty();
        //document.getElementById("rootWord").innerHTML = "";
        //document.getElementById("rwNepali").innerHTML = "";
        //document.getElementById("rwDefinition").innerHTML = "";
        
        if (definition.rw != '') {
            LOOMA.lookup(definition.rw, gotARootWord, fail);
        }
        
    } //end gotAWord
    
    function gotARootWord(definition) {
        var def = definition.def;
        //if (def.includes('dictionary.reference.com')) def = 'Definition not found';
        //the dictionary defines derivative forms with "plural of", "past tense of", etc. and has an entry "rw" for the root word
        // here we reconstruct the definition by combining the generic phrase with the root word from the dictionary
        //
        //This gets the word's nepali translation and displays it in the HTML
        var rwDisplayWord = document.getElementById("rootWord");
        var rwupperEnglishWord = definition.en.toUpperCase();
        rwDisplayWord.textContent = rwupperEnglishWord;
        var rwnp = document.getElementById("rwNepali");
        rwnp.textContent = definition.np;
        var rwdef = document.getElementById("rwDefinition");
        rwdef.textContent = def;
        event.preventDefault();
    }// end of gotARootWord
*/
    function OK(html) {
        $('#definitionDisplay').html(html);


//The MODAL - opens window of image when clicked
var modal = document.getElementById('myModal');
// Get the image and insert it inside the modal
var img = document.getElementById('image');
var modalImg = document.getElementById("img01");
img.onclick = function(){
    modal.style.display = "block";
    modalImg.src = this.src;
}
// Get the <span> element (x) that closes the modal
var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
    modal.style.display = "none";
}
    
    
        if ($('#definition').text().length > 100) $('#definition').css('font-size', '0.75em');
        if ($('#rwdef').text().length > 100)      $('#rwdef').css('font-size', '0.75em');
    };
    
    //This is the fail function, used when the Looma database can not find the word
    function fail(jqXHR, textStatus, errorThrown) {
        alert("enter function fail");
        console.log('jqXHR is ' + jqXHR.status);
        window.alert('failed with textStatus = ' + textStatus);
        window.alert('failed with errorThrown = ' + errorThrown);
    } //end FAIL
    
    var input = document.getElementById("input").value;
    
    LOOMA.define(input, OK, fail);
    
    return false;
}; //end getDefinition

$(document).ready (function() {
 
    
    var elem = document.getElementById("lookup");
    elem.addEventListener('submit', getDefinition);
 
    // SPEAK button will say the word, unless text is selected, in which case, it will speak the selected text
    $('button.speak').off('click').click(function () {
        var vocabWord, definition, temp, selectedString, toSpeak;
        selectedString = document.getSelection().toString();
        vocabWord =      document.getElementById('input').value;
        temp = document.getElementById('definition');
        if (temp) definition = temp.innerText;
        if (!vocabWord) vocabWord = document.getElementById('theword').innerText;
        if (definition && definition != "") {
            definition = definition.replace("(v)", " verb ");
            definition = definition.replace("(n)", " noun ");
            vocabWord += "     " + definition;
        };
        toSpeak = (selectedString ? selectedString : vocabWord);
        console.log('VOCAB: speaking ', toSpeak);
        LOOMA.speak(toSpeak);
    }); //end speak button onclick function
});
