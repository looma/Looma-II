/*
Filename: looma-bagh-chal.js
Description: supports looma-bagh-chal.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 5/18
Revision: Looma 3.0
 */

/*
    CHALLENGES:
        1. make this a two player game. AJAX calls to a backend PHP that stores game state in mongo
        2. revise BAGH CHAL to play other alquerque games [Bagh-bandi,Sher-bakar, Main Tapal Empat,
            Aadu puli attam, Rimau,Rimau-rimau,Adugo, Komikan,Buga-shadara,Kungser,Mekha-Puli]
 */


/* TODO:
        - responsive SVG, tied to BOARD exactly
        - popup to announce winner
        - add a next game button
        - add an info button - pops up the rules
        -add <p> Tigers turn | Goats turn </p>
 */

'use strict';
var boardSize = 5;
var numberOfGoats = 20;

//  #game is the game board
//  #board is the SVG drawing of the paths between board positions - informational only
//  'animal' is either "tiger" or "goat"
//  a 'spot' is a position on the game board. a <div> with class='spot', 'data-x=' and 'data-y=' properties for location
//  a 'tiger' is a <div> with class="tiger"
//  a 'goat'  is a <div> with class="goat"
//  'goat' and 'tiger' are draggable. selected 'spot's are droppable for goats and tigers

// clear any animal from this spot
function clearSpot(spot) {
    spot.removeClass('hasTiger').removeClass('hasGoat').addClass('empty');
    spot.droppable(
        {   accept: '.tiger, .goat',
            drop: function(event, ui) { ui.helper.data('dropped', true);}
        });
    }

//  put a 'goat' or 'tiger' at this spot
function fillSpot(spot, animal) {
    spot.removeClass('empty').addClass(animal=='goat' ? 'hasGoat' : 'hasTiger');
    spot.droppable("disable");
}

// checks whether 'a' is a neighbor of 'b' at distance 'distance'
function neighbor(a,b,distance) {
    if (a.y == b.y && MATH.abs(a.x - b.x) == distance || a.x == b.x && MATH.abs(a.y - b.y) == distance)
        return true; else return false;}

// property of "alquerque" game board is that diagonals are only attached to every other intersection
// this function decides whether the spot "x" is at one of those intersections
function hasDiagonal(x) {return (x.x % 2) == (x.y % 2);}  //

// checks whether 'a' is a diagonal neighbor of 'b' at distance 'distance'
function diagonal(a,b,distance) {
    if (hasDiagonal(a) && (MATH.abs(a.x - b.x) == distance && MATH.abs(a.y - b.y) == distance))
        return true; else return false;}

// checks whether the spot between a and b contains a 'goat'
function jumpable(a,b) {  //only call if a and b are two steps apart
    var m = (a.x +b.x)/2;
    var n = (a.y +b.y)/2;
    if (goatAt(m,n)) return true; else return false;
}

//  check whether there is a 'goat' at position x,y
function goatAt(x,y) {
    return $('.spot[data-x=x][data-y=y]').hasClass('hasGoat)');
}

//  check whether the 'spot' hovered over is a legal drop spot for the currently dragged animal
function legalMove(a,b, animal) {
    var OK = false;
    if (!b.hasClass('empty')) return;
    if (animal ==='tiger') OK = neighbor(a,b,1) || diagonal(a,b,1) || ((neighbor(a,b,2) || diagonal(a,b,2)) && jumpable(a,b));
    else                   OK = neighbor(a,b,1) || diagonal(a,b,1);
    return OK ;
    }

function winner(animal){LOOMA.alert(animal=='goat' ? "Goat" : "Tiger" + ' wins!')};

$(document).ready  (function () {

// draw the game positions ['spots']
    for (var i=1; i <= boardSize; i++){
        for (var j=1; j <= boardSize; j++){
            var spot = $('<div class="spot" data-x=' + i + ' data-y=' + j + '>');
            if ((i==1||i==boardSize) && (j==1||j==boardSize))
                 {spot.addClass('corner');}
            else {spot.addClass('empty').droppable();}
            $('#game').append(spot);
        }
    };

// draw the goats in the corral
    for (var i=1; i <= numberOfGoats; i++){
            var goat = $('<div class="goat" >');
            goat.draggable().draggable({
                revert: "invalid",
                start: function (event, ui) {ui.helper.data('dropped', false);}
                });
            $('#corral').append(goat);
        }

// draw the tigers in the corner board spots
    $('#game  .corner').each(function() {
        var tiger = $('<div class="tiger" >');
        tiger.draggable().draggable({
            revert: "invalid",
            start: function (event, ui) {ui.helper.data('dropped', false);}
            });
        $(this).append(tiger);
        $(this).removeClass('empty').addClass('hasTiger');
    });
});

    $('.spot').hover(function() {
       // return legalMove(currently-dragging-spot, this-spot, currently-dragging-animal)
    });
    
    $('#newgame').click(function() {
    
        LOOMA.confirm('Quit this game?',
            function () {parent.location.href = 'looma-bagh-chal.php';},
            function () {},
            true);
    });
    
    $('#info').click(function(){LOOMA.alert('summary of game rules here');});

//    $('#svg-container').attr("transform", "scale(0.25)");

/*
    make spots droppable, then only .spot.legal droppable

    on drag hover, indicate legal drop with color change
 
    on drop attempt
        if not legal - revert to original position
        if legal - execute move
            snap to grid positionning
            if tiger and jump, remove goat
            toggle goat/tiger next move
            recompute class="legal"
                legals are (i) one space away and unoccupied, or tiger && two spaces && goat in between && unoccupied
            compute win|continue
                win is goats = 20 || or tiger's move and no .legal drop spots
        indicate  win or who has next move

 */
