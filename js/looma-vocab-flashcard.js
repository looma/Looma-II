//Author: Sasha Cassidy and Lily Barnett
//Description: Generates vocabulary words corresponding to the selected cookies.  Advances the flashcards by loading a new word on the next or previous card.

'use strict';

var frontShowing = true;
var index = 0;
var vocabGrade;
var vocabSubject;
var vocabCount;
var vocabRandom;
var list;
var word;


//Reads the cookies in order to generate the word list
function init()
{
    document.getElementById("next").addEventListener("click", next);
    document.getElementById("prev").addEventListener("click", prev);

    $('.stage').on('click', function() {
        $('.stage').toggleClass('flipped');
        if (frontShowing) { frontShowing = false; }
        else              { frontShowing = true; }
    }); //end flashcard onclick function

    // SPEAK button will say the word, unless text is selected, in which case, it will speak the selected text
    $('button.speak').click(function(){
        var selectedString = document.getSelection().toString();
        var vocabWord = document.getElementById('wordFront').textContent.toString();
        var toSpeak = (selectedString ? selectedString : vocabWord);
        console.log ('VOCAB: speaking ', toSpeak);
        LOOMA.speak(toSpeak);
    }); //end speak button onclick function

    vocabGrade =   LOOMA.readStore("vocab-grade",   'local'); if (!vocabGrade) vocabGrade = "class1";
    vocabSubject = LOOMA.readStore("vocab-subject", 'local'); if (!vocabSubject) vocabSubject = "english";
    vocabCount =   LOOMA.readStore("vocab-count",   'local'); if (!vocabCount) vocabCount = "25";
    vocabRandom =  LOOMA.readStore("vocab-random",  'local'); if (!vocabRandom) vocabRandom = "true";

    LOOMA.wordlist(vocabGrade, vocabSubject, vocabCount, vocabRandom, succeed, fail);
}

//If it fails, it alerts the user and describes the failure
function fail(jqXHR, textStatus, errorThrown)
{
    alert("enter function fail");
    console.log('VOCAB: AJAX call to dictionary-utilities.php FAILed, jqXHR is ' + jqXHR.status);
    window.alert('failed with textStatus = ' + textStatus);
    window.alert('failed with errorThrown = ' + errorThrown);
}

//Generates the next card with the front word and corresponding back information
function succeed(result)
{
    console.log('VOCAB: success getting word list');
    //$('#wordlist-output').text(result);
    //$('#nepali-output').text(result.np);
    //$('#defn-output').text(result.def);
    //if (result.img) $('#img-output').html('<img src="' + result.img + '>');
    list = result;
    word = list[index];
    console.log('VOCAB: looking up ' + word);
    LOOMA.lookup(word, gotAWord, fail);
}

//Once a word is generated, generate corresponding backside and put it on back of card
function gotAWord(definition)
{
    document.getElementById("wordFront").innerHTML = word;
    document.getElementById("nepaliBack").innerHTML = definition.np;

// Clean up the definition for display - italicize 'part of speech'
         definition.def = definition.def.replace('pronoun', '<i>pronoun</i>');
         definition.def = definition.def.replace('preposition', '<i>preposition</i>');
         definition.def = definition.def.replace('noun', '<i>noun</i>');
         definition.def = definition.def.replace('verb', '<i>verb</i>');
         definition.def = definition.def.replace('adj.', '<i>adjective</i>');
         definition.def = definition.def.replace('adverb', '<i>adverb</i>');
         definition.def = definition.def.replace('adv.', '<i>adverb</i>');

         if (definition.def.includes('dictionary.reference.com')) definition.def='Definition not found';

        //the dictionary defines derivative forms with "plural of", "past tense of", etc. and has an entry "rw" for the root word
        // here we reconstruct the definition by combining the generic phrase with the root word from the dictionary
        //
        //NOTE: in the future, should go the dictionary one more time and get the definition of the ROOT WORD
        //
        if (definition.def =='plural of') definition.def= definition.def + ' ' + definition.rw;
        else if (definition.def =='past tense of') definition.def= definition.def + ' ' + definition.rw;
        else if (definition.def =='past perfect tense of') definition.def= definition.def + ' ' + definition.rw;
        else if (definition.def =='progressive form of') definition.def= definition.def + ' ' + definition.rw;
        else if (definition.def =='past and past perfect tense of') definition.def= definition.def + ' ' + definition.rw;
        else if (definition.def =='third person singular of') definition.def= definition.def + ' ' + definition.rw;

//Change the font size according to definition length.  If definition is too long, chop it off accordingly
    if(definition.def.length < 144)
    {
        $('#largeWordBack').show();
        document.getElementById("largeWordBack").innerHTML = definition.def;
        $('#mediumWordBack').hide();
        $('#smallWordBack').hide();
    }

    else if(definition.def.length >= 144 && definition.def.length < 240)
    {
        $('#largeWordBack').hide();
        $('#mediumWordBack').show();
        document.getElementById("mediumWordBack").innerHTML = definition.def;
        $('#smallWordBack').hide();
    }


    else if(definition.def.length >= 240 && definition.def.length < 750)
    {
        $('#largeWordBack').hide();
        $('#mediumWordBack').hide();
        $('#smallWordBack').show();
        document.getElementById("smallWordBack").innerHTML = definition.def;
    }

    else
    {
        $('#largeWordBack').hide();
        $('#mediumWordBack').hide();
        document.getElementById("smallWordBack").innerHTML = definition.def.substring(0,750);
    }
    //document.getElementById("img-output").src = "images/apple.jpg";

}

//If the current face is the backside, the card will be flipped to show the front of the next card. Otherwise, the new front will show.  The 'next' arrow will not be displayed on the last word card.
function next()
{
    if (index < 25)
    {
        index++;
        word = list[index];
        LOOMA.lookup(word, gotAWord, fail);
    }
    document.getElementById("prev").style.visibility = 'visible';
    if (index >= 24)
    {
        document.getElementById("next").style.visibility = 'hidden';
        document.getElementById("prev").style.visibility = 'visible';
    }
    else
    {
        document.getElementById("next").style.visibility = 'visible';
        document.getElementById("prev").style.visibility = 'visible';
    }
    if (!frontShowing)
    {
        $('.stage').toggleClass('flipped');
        frontShowing = true;
    }
}

//Returns to the front face of the previous word.  The 'prev' arrow will not be displayed on the first card.
function prev()
{
    if (index > 0)
    {
        index--;
        word = list[index];
        LOOMA.lookup(word, gotAWord, fail);
    }
    if (index == 0)
    {
        document.getElementById("prev").style.visibility = 'hidden';
        document.getElementById("next").style.visibility = 'visible';
    }
    else
    {
        document.getElementById("prev").style.visibility = 'visible';
        document.getElementById("next").style.visibility = 'visible';
    }
    if (!frontShowing)
    {
        $('.stage').toggleClass('flipped');
        frontShowing = true;
    }
}

window.onload = init;
