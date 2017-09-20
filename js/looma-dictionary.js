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

function Listener(event) {
    event.preventDefault();
    
    //This is the "success" code, which reads the word and returns all of its attributes
    function gotAWord(definition) {
        
        //This gets the word's definition and displays it in the HTML
        //var newElement = document.createElement('div');
        //newElement.innerHTML = definition;
        var def = definition.def;
        def = def.replace('pronoun', '<i>pronoun</i>');
        def = def.replace('preposition', '<i>preposition</i>');
        def = def.replace('noun', '<i>noun</i>');
        def = def.replace('verb', '<i>verb</i>');
        def = def.replace('adj.', '<i>adjective</i>');
        def = def.replace('adverb', '<i>adverb</i>');
        def = def.replace('adv.', '<i>adverb</i>');
        def = def.replace('contraction', '<i>contraction</i>');
        /* attempt below to italicize 'part of speech' FAILED so far. detect embedded '&nbsp;' but results from dictionary arent consistent
            var m = def.indexOf('\xa0', 0);
            var n = def.indexOf('\xa0', m+1);
            var p = def.indexOf('\xa0', n+1);
            def = def.slice(0,n) +  def.slice(n+1, p).italics() + def.slice(p);
            */
        
             if (def == 'past tense of') def = def + ' ' + definition.rw;
        else if (def == 'third person singular of') def = def + ' ' + definition.rw;
        
        //This gets the word itself, turns it to uppercase, and displays it in the HTML
        displayArea.innerHTML = '<p>' + def.replace(/;/g, '</p><p>') + '<\p>';
        
        var displayAreatwo = document.getElementById("theword");
        var englishWord = document.getElementById("word").value;
        var upperEnglishWord = englishWord.toUpperCase();
        displayAreatwo.textContent = upperEnglishWord;
        var displayAreathree = document.getElementById("nepali");
        displayAreathree.textContent = definition.np;
        document.getElementById("word").value = '';
        event.preventDefault();
        
        document.getElementById("rootWord").innerHTML = "";
        document.getElementById("rwNepali").innerHTML = "";
        document.getElementById("rwDefinition").innerHTML = "";
        
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
    
    
    //This is the fail function, used when the Looma database can not find the word
    function fail(jqXHR, textStatus, errorThrown) {
        alert("enter function fail");
        console.log('jqXHR is ' + jqXHR.status);
        window.alert('failed with textStatus = ' + textStatus);
        window.alert('failed with errorThrown = ' + errorThrown);
    } //end FAIL
    
    var word = document.getElementById("word").value;
    
    LOOMA.define(word, OK, fail);
    
    function OK(html) {
        $(displayArea).html(html);
    }
} //end Listener

//This code calls the Listener function when a word is submitted
function init() {
    
    displayArea = document.getElementById("definition")
    
    var elem = document.getElementById("lookup");
    elem.addEventListener('submit', Listener);
    
    // SPEAK button will say the word, unless text is selected, in which case, it will speak the selected text
    $('button.speak').off('click').click(function () {
        var selectedString = document.getSelection().toString();
        var vocabWord = document.getElementById('word').value;
        if (!vocabWord) vocabWord = document.getElementById('theword').innerText;
        var toSpeak = (selectedString ? selectedString : vocabWord);
        console.log('VOCAB: speaking ', toSpeak);
        LOOMA.speak(toSpeak);
    }); //end speak button onclick function
    
}

window.onload = init;
