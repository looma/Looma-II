/* Looma
LOOMA javascript file
Filename: looma-phonics-wordsNEW.js
Programmer name: galen
*/

'use strict';

var wordlist, currentWord, count;
var words; // = new Array("Hat", "Cat", "Sat", "Flat", "Tap", "Flap", "Trap", "Mat", "Top", "Stop", "Flop", "Plot", "Hot", "Job", "Dog", "Fog");
var prompts;
var numWords;

function getGame (id) {
    $.ajax(
        "looma-database-utilities.php",
        {   type: 'GET',
            dataType: "json",
            data: "collection=games&cmd=getGame&gameId=" + id,
            error: fail,
            success: succeed
        });
} //  end getGame()

function succeed(result) {
     wordlist = result['prompts'];  // save the words in 'wordlist' so they can be re-used for 'new game'
     numWords = wordlist.length;
    var $game = $('#game');
    for(var i = 0; i < numWords; i++){
        $("<button class='word'></button>").appendTo($game);
        if(i%4 == 3) $("<br>").appendTo($('#game'));
    };
    runGame();
};  // end succeed()

function fail() {
    console.log('failed to load game' +  $('#game').data('id'));
} // end fail()

function runGame() {
    words = wordlist.slice();
    words.sort(() => (Math.random() > .5) ? 1 : -1);
    var children = $('#game').children('.word');
    for (var i = 0; i < children.length; i++) {
        children[i].innerText = words[i];
        $(children[i]).attr('word',words[i])
    }
    $('.word').click(function(){ LOOMA.speak($(this).text().toLowerCase());} );
    clearHighlights();
    $('#nextWord .english-keyword').text('Start play');
    
    count = -1;
    prompts = words.slice();
    prompts.sort(() => (Math.random() > .5) ? 1 : -1);
    currentWord = prompts[count];
} // end runGame()

function nextWord() {
    clearHighlights();
    count++;
    if (count < prompts.length) {
        currentWord = prompts[count];
        $('#nextWord .english-keyword').text('Next word');
        speakWord();
    } else runGame();
} // end nextWord

function highlightWord () {
    $(".word").each(function(){if($(this).text() === currentWord)
        $(this).css({'color':'red','background-color':'lemonchiffon','border':'5px solid yellow'})});
  //  $( ".word[data-word*='" + currentWord + "']" ).css('color','red');
}  // end highlightWord()

function clearHighlights() {
    $('.word').css({'color':'black','background-color':'white','border':'none'});
}  // end clearHighlights()

function speakWord() {
    clearHighlights();
    LOOMA.speak(currentWord.toLowerCase());
    setTimeout(highlightWord, 4000);
}  // end speakWord()

$(document).ready(function() {
    
    $('#newGame').click(  runGame);
    $('#speakWord').click(speakWord);
    $('#nextWord').click( nextWord);
    
    getGame( $('#game').data('id'));
});

