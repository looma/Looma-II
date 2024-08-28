/*
Filename: looma-sort-game.js

Programmer name: Skip
Date: May 2022
Owner: Looma Education Company
 */

'use strict';
/* declare global variables here */

var words = [];
var wordlist;
/*
at, man, hat, dad, an, than, cat, black, fat, can
ten, bed, set, head, when, them, red, said, men, then
it, will, big, in, if,  give, him, fish, bit, sit, milk
sock, hot, doll, not, want, mom, job, spot, top, pot
fun, sun, under, run, jump, up, done, one, us, bus, nut
*/

function setHeadings() {
        $('#heading1').text('Short "a"');
        $('#heading2').text('Short "e"');
        $('#heading3').text('Short "o"');
}
function setScopes() {
        $('#bin1').droppable({scope:'a'});
        $('#bin2').droppable({scope:'e'});
        $('#bin3').droppable({scope:'o'});
}
function getNewWordList () {
        var list = [
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
        list.sort(() => Math.random() - 0.5);
        return list.slice();
}

function startGame() {
        words = getNewWordList();
        nextWord();
       $(".bin").empty();
}

function nextWord() {
        if (words.length === 0) {
                $('#words').empty();
                LOOMA.alert('<p>Game over. Good work.</p>Click "Play Again" to play again', 10, true);
                return;
        }
        
        var $word = $("<p class='word " + words[0].value + "'>" + (words[0].key) + "</p>");
        $word.draggable({revert:'invalid',
                    cursor:'move',
                    helper:'clone',
                    scope:words[0].value,
                    start: function( event, ui ) {ui.helper.css('font-size','1em')}}  //.addClass('word')
            );
        $('#words').empty().append($word);
        words = words.slice(1); // removes the first word from 'words'
};

$(document).ready( function () {
        
        $('button.speak').off('click').click(function () {
           var selectedString = document.getSelection().toString();
           var toSpeak = (selectedString ? selectedString : $('#words p.word').text());
           LOOMA.speak(toSpeak);
        }); //end speak button onclick function
        
        $('button.lookup').off('click').click(function(){
                var toString = window.getSelection().toString();
                var toString = (toString ? toString : $('#words p.word').text());
                LOOMA.popupDefinition(toString.split(' ')[0], 15, 'en');
        });
        
        $(".bin").droppable({
                accept:".word",
                drop: function(event, ui) {
                        // clone(true) to retain all DATA for the element
                        var $dest = ui.helper.clone(true).addClass('dragging').off();
                        //NOTE: crucial to "off()" event handlers,
                        //or the new element will still be linked to the old
                        $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
                        $dest.removeAttr('style').addClass('dropped');
                        $dest.appendTo(event.target);
                        
                        nextWord();
                }
                });
        
        $('#next_button').click(startGame);
        
        setHeadings();
        setScopes();
        startGame();
});