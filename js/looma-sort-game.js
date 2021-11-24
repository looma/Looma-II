/*
LOOMA javascript file
Filename: looma-sort-game.js
Description: supports looma-sort-game.php

Programmer name: Skip
Owner: Looma Education Company
 */

'use strict';
/* declare global variables here */

var gameOver = false;
var words = [];
var wordlist = [
        {key: 'man', value:'a'},
        {key: 'hat', value:'a'},
        {key: 'cat', value:'a'},
        {key: 'black', value:'a'},
        {key: 'dad', value:'a'},
        {key: 'bed', value:'e'},
        {key: 'head', value:'e'},
        {key: 'ten', value:'e'},
        {key: 'said', value:'e'},
        {key: 'set', value:'e'},
        {key: 'men', value:'e'},
        {key: 'fox', value:'o'},
        {key: 'hot', value:'o'},
        {key: 'spot', value:'o'},
        {key: 'dog', value:'o'},
];
/*
at, man, hat, dad, an, than, cat, black, fat, can
ten, bed, set, head, when, them, red, said, men, then
it, will, big, in, if,  give, him, fish, bit, sit, milk
sock, hot, doll, not, want, mom, job, spot, top, pot
fun, sun, under, run, jump, up, done, one, us, bus, nut
*/

/* declare functions here */

function nextWord() {
        if (words.length === 0) {
               // $('.bin').empty();
                $('#words').empty();
                gameOver = true;
                words = wordlist.slice();
                LOOMA.alert('<p>Game over. Good work.</p>Click "Play again" to play again', 10, true);
                $('#next_button').text('Play again');
                return;
        } else if(gameOver) {
                $('.bin').empty();
                $('#next_button').text('Next word');
                wordlist.sort(() => Math.random() - 0.5);
                words = wordlist.slice();
        }
        
        var $word = $("<p class='word " + words[0].value + "'>" + (words[0].key) + "</p>");
        $word.draggable({revert:'invalid',
                    cursor:'move',
                    helper:'clone',
                    scope:words[0].value,
                    start: function( event, ui ) {ui.helper.css('font-size','1em')}}  //.addClass('word')
            );
        
        $('#words').empty().append($word);
        words = words.slice(1);
};

$(document).ready( function () {
        
        // SPEAK button will say the word, unless text is selected, in which case, it will speak the selected text
        $('button.speak').off('click').click(function () {
                var selectedString = document.getSelection().toString();
                var toSpeak = (selectedString ? selectedString : $('#words p.word').text());
                console.log('VOCAB: speaking ', toSpeak);
                LOOMA.speak(toSpeak);
        }); //end speak button onclick function
        
        $('button.lookup').off('click').click(function(){
                var toString = window.getSelection().toString();
                var toString = (toString ? toString : $('#words p.word').text());
                console.log ('selected text to lookup: "', toString, '"');
                // LOOMA.lookupWord(toString);
                LOOMA.popupDefinition(toString.split(' ')[0], 15);
        });
        
        $('#heading1').text('Short "a"');
        $('#heading2').text('Short "e"');
        $('#heading3').text('Short "o"');
        
        $(".bin").droppable({
                accept:".word",
                drop: function(event, ui) {
                        //alert('dropped');
        
                        var $dest = ui.helper.clone(true).addClass('dragging').off(); // clone(true) to retain all DATA for the element
                        //NOTE: crucial to "off()" event handlers,
                        //or the new element will still be linked to the old
                        $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
                        $dest.removeAttr('style').addClass('dropped');
                        $dest.appendTo(event.target);
                        
                       // ui['draggable'].draggable( "disable" );
                        nextWord();
                }
                });
        $('#bin1').droppable({scope:'a'});
        $('#bin2').droppable({scope:'e'});
        $('#bin3').droppable({scope:'o'});
        
        
        
        $('#next_button').click(nextWord);
        
        wordlist.sort(() => Math.random() - 0.5);
        words = wordlist.slice();
        nextWord();
});

