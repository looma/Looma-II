/*
Filename: looma-bagh-chal.js
Description: supports looma-bagh-chal.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 5/18, 3/19
Revision: Looma 5.0
 */

/* future CHALLENGES:
        1. make this a remotely located players game. AJAX calls to a backend PHP that stores game state in mongo
        2. revise BAGH CHAL to play other alquerque games [Bagh-bandi,Sher-bakar, Main Tapal Empat,
            Aadu puli attam, Rimau,Rimau-rimau,Adugo, Komikan,Buga-shadara,Kungser,Mekha-Puli]

    //  #game is the game board
    //  #alquerque is the SVG drawing of the paths between board positions - informational only
    //  'animal' is either "tiger" or "goat"
    //  a 'spot' is a position on the game board. a <div> with class='spot'. corner spots have class='corner'.
    //          spots that are legal moves have class='legal'
    //         'spot' has 'data-x='. 'data-y=' properties for location, and class = 'tiger' or 'goat' or 'empty'
    //  a 'tiger' is a <div> with class="animal tiger"
    //  a 'goat'  is a <div> with class="animal goat"
    //  'goat' and 'tiger' are draggable. selected ('.legal') spot's are droppable for goats and tigers
 */

'use strict';
var boardSize = 5;
var numberOfGoats = 20;
var newGoats;
var currentAnimal;

var gameRules = "Alternate turns. Goats play first.<br>";
gameRules += "Goat's turn: move a goat onto the board.<br>";
gameRules += "When all the goats are on the board,<br>";
gameRules += "then move one goat one space.<br>";
gameRules += "Tiger's turn: move one tiger one space<br>";
gameRules += "or jump a goat to capture it.<br>";
gameRules += "Game over: 5 goats captured,<br>";
gameRules += "or tigers can't move";

// clear any animal from this spot
function clearSpot(spot) {
    if (spot.attr('id') != 'corral') spot.empty().removeClass('tiger').removeClass('goat').addClass('empty');//.attr('data-animal','none');
    }

function fillSpot(spot, animal) {
    $(spot).empty().removeClass('empty legal').addClass(animal);
    //$(spot).attr('data-animal',animal);
    $(spot).droppable('disable');
    var item = $('<div class="animal ' + animal + '" >');
    item.draggable({
        revert: "invalid",
        containment:"#game",
        cursor:'move',
        snap:'.spot',
        start: function(e,item) {dragStart(item);},
        stop: dragStop
    });
    $(spot).append(item);
} // end fillSpot()

function getAnimal(item) {
    return item.hasClass('tiger')? 'tiger' : item.hasClass('goat') ? 'goat' : 'none';
} // end getAnimal()

// checks whether 'a' is an orthogonal neighbor of 'b' at distance 'distance'
function orthogonal(a,b,distance) {
    return(a.data('y') == b.data('y') && Math.abs(a.data('x') - b.data('x')) == distance || a.data('x') == b.data('x') && Math.abs(a.data('y') - b.data('y')) == distance);}

// property of "alquerque" game board is that diagonals are only attached to every other intersection
// this function decides whether the spot "x" is at one of those intersections
function hasDiagonal(x) {return (x.data('x') % 2) == (x.data('y') % 2);}  //

// checks whether 'a' is a diagonal neighbor of 'b' at distance 'distance'
function diagonal(a,b,distance) {
    return (hasDiagonal(a) && (Math.abs(a.data('x') - b.data('x')) == distance && Math.abs(a.data('y') - b.data('y')) == distance));}

// checks whether the spot between a and b contains a 'goat'
function jumpable(a,b) {  //only call if a and b are two steps apart
    var m = (a.data('x') + b.data('x'))/2;
    var n = (a.data('y') + b.data('y'))/2;
    if (Number.isInteger(m) && Number.isInteger(n) && goatAt(m,n)) return true; else return false;
}

function doJump(a,b) {
        if (jumpable(a,b)) {
            var m = (a.data('x') +b.data('x'))/2;
            var n = (a.data('y') +b.data('y'))/2;
            clearSpot($('.spot[data-x=' + m + '][data-y=' + n + ']'));
            numberOfGoats--;
        }
}

//  check whether there is a 'goat' at position x,y
function goatAt(x,y) { return (getAnimal($('.spot[data-x=' + x + '][data-y=' + y + ']')) === 'goat');}

//  check whether the 'spot' hovered over is a legal drop spot for the currently dragged animal
function legalMove(a,b, animal) {
    var OK = false;
    if (!b.hasClass('empty')) return false;
    if (animal ==='tiger') OK = orthogonal(a,b,1) || diagonal(a,b,1) || ((orthogonal(a,b,2) || diagonal(a,b,2)) && jumpable(a,b));
    else                   OK = orthogonal(a,b,1) || diagonal(a,b,1);
    return OK ;
    }
    
$.fn.legal = function (from) { return this.filter(function(i,to) {return legalMove($(from),$(to),getAnimal($(from)));});};

function dragStart(from) {
    $( ".spot" ).droppable( "disable" ).removeClass('legal');
    $( ".spot" ).legal($(from.helper[0]).parent()).droppable( "enable" ).addClass('legal');
}

function newGoatDragStart() { $( ".spot.empty" ).droppable( "enable" ).addClass('legal');}

function dragStop() {$('.spot').removeClass('legal')}

function tigersCanMove() {
    var any = false;
    $('.spot.tiger').each(function() {if ($('.empty').legal(this).length > 0) any=true;});
    return any;
}

function gameOver () {return (numberOfGoats === 15 || ! tigersCanMove());}

function displayTurn() {
    $('#next').attr('src',currentAnimal=='tiger'?'images/tiger.png ' : 'images/goat.png');
}

function nextPlayer() {
    if (gameOver()) winner(currentAnimal);
    else {
        $('.animal.' + currentAnimal).draggable('disable');
        currentAnimal = currentAnimal=='tiger' ? 'goat' : 'tiger';
        displayTurn();
        if (currentAnimal === 'tiger') $('.animal.tiger').draggable('enable');
        else if (newGoats > 0)
             $('#corral .animal.goat').draggable('enable');
        else $('#game .animal.goat').draggable('enable');
    }
}

function winner(animal){LOOMA.alert((animal === 'goat' ? "Goat" : "Tiger") + ' wins!', null, false, newGame)}

function newGame() {
    LOOMA.confirm('Quit this game?',
        function () {parent.location.href = 'looma-bagh-chal.php';},
        function () {},
        true);
}

$(document).ready  (function () {

    // draw the game positions ['spots']
    for (var i = 1; i <= boardSize; i++) {
        for (var j = 1; j <= boardSize; j++) {
            var spot = $('<div class="spot" data-x=' + i + ' data-y=' + j + '>');//.css('grid-column', i).css('grid-row', j);
            if ((i == 1 || i == boardSize) && (j == 1 || j == boardSize)) {
                spot.addClass('corner');
            }
            else clearSpot(spot);
            spot.droppable({
                accept: '.tiger, .goat',
                drop: function (e, item) {
                    //  item.draggable is the element that is being dropped
                    if ($(e.target).is('.ui-droppable')) {  //legal move
                        var animal = getAnimal(item.draggable);
                        fillSpot(this, animal);
                        if (animal == 'tiger') doJump(item.draggable.parent(),$(this));
                        if ($(item.draggable.parent()).attr('id') === 'corral') newGoats--;
                        clearSpot(item.draggable.parent());
                        item.draggable.remove();
                        nextPlayer(animal);
                    }
                }
            });
            $('#game').append(spot);
        }
    }

    // draw the tigers in the corner board spots
    $('#game  .corner').each(function () {fillSpot(this, 'tiger');});
    
    // draw the goats in the corral
    for (var i = 1; i <= numberOfGoats; i++) {
        var goat = $('<div class="animal goat" /*data-animal="goat"*/>');//.css('grid-column', i % 2).css('grid-row', i / 2);
        goat.draggable().draggable({
            revert: "invalid",
            cursor: 'move',
            start: function(e,item) {newGoatDragStart(item);},
            stop: dragStop
        });
        $('#corral').append(goat);
    }
    
    currentAnimal = 'goat';
    $('.animal.tiger').draggable('disable');
    $('#corral .animal.goat').draggable('enable');
    displayTurn();
    newGoats = numberOfGoats;
    
    $('#newgame').click(newGame);
    $('#info').click(function () {LOOMA.alert(gameRules, 0, true);});
}); // end document.ready()
