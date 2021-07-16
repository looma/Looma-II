/*
LOOMA javascript file
Filename: looma-sort-game.js
Description: supports looma-sort-game.php

Programmer name: Skip
Owner: Looma Education Company
 */

'use strict';
/* declare global variables here */

/* declare functions here */

function nextWord() {

};

$(document).ready( function () {

    $('.bin').droppable();
    $('#word').draggable({
        revert: true
    });
    
    $("#next_button").click(function() {
        nextWord();
    });
});

