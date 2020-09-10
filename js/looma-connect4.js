/*
LOOMA javascript file
Filename: looma-connect-four.js

Programmer name: Caroline
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: AUG 2020
Revision: Looma 3.0
 */

'use strict';

// Game Variables
const ROWS = 6;
const COLS = 7;
var grid = [];
var p1Turn = true;
var p1Marker = "r";
var p2Marker = "b";

$(document).ready(function() {
    // drawing board
    $('#world').css('grid-template-rows', `repeat(${ROWS}, ${ROWS}fr)`);
    $('#world').css('grid-template-columns', `repeat(${COLS}, ${COLS}fr)`);
    
    // creating ROWS x COLS board
    for (let i=0; i<ROWS; i++) {
        var gridrow = [];
        for (let j=0; j<COLS; j++) {
            $('<div/>', {class: 'cell', 'data-x': i, 'data-y': j}).appendTo($('#world'));
            gridrow.push(null);
        }
        grid.push(gridrow);
    }
    
    // adds piece to board, assigns correct color
    function addPiece(col){
        for (let i=ROWS-1; i>=0; i--){
            if (grid[i][col] === null){
                if (p1Turn){
                    grid[i][col] = p1Marker;
                    $(`.cell[data-x="${i.toString()}"][data-y="${col.toString()}"]`).addClass('player1');
                    checkWin(grid, p1Marker, i, col);
                    p1Turn = false;
                }
                else {
                    grid[i][col] = p2Marker;
                    $(`.cell[data-x="${i.toString()}"][data-y="${col.toString()}"]`).addClass('player2');
                    checkWin(grid, p2Marker, i, col);
                    p1Turn = true;
                }
                break;
            }
        }
    }
    
    // mouseMoved on cell
    function highlightColumn($cell){
        // remove previous selections
        $('.cell').removeClass('selected')
        var col = $cell.data('y');
        // highlights selected column
        var nextMoveHighlighted = false
        for (let i=ROWS-1; i<=0; i--){
            if (!nextMoveHighlighted){
                if (grid[i][parseInt(col)] === null){
                     $('.cell') (data['x'] = i)(data('y') === col) .addClass('highlight')
                    nextMoveHighlighted = true
                }
            }
            // selects column of cells
            // $('cell') (data('y') === col) .addClass('selected')
        }
    }
    
    function checkDirection(i, j, row, col, marker){
        var numInARow = 0;
        for (let k=1; k<4; k++){
            var x = row+(i*k);
            var y = col+(j*k);
            // if legal
            if (x<ROWS && x>=0 && y<COLS && x>=0){
                if (grid[x][y] === marker){
                    numInARow++; }
            } else { break; }
        }
        return numInARow;
    }
    
    function gameOver(){
        var player = "";
        if (p1Turn === true){
            player = "player1";
        } else {
            player = "player2"
        }
        console.log("game over!", player);
        LOOMA.alert ('Game over. Player ' + player + ' wins',5);
        $('.cell').off('click');
    }
    
    // up/down, diagonal-left, diagonal-right, left/right
    var directions = [[0, 1], [1, 1], [-1, 1], [1, 0]];
    function checkWin(grid, marker, newRow, newCol){
        for (let i=0; i<directions.length; i++){
            var x = directions[i][0];
            var y = directions[i][1];
            var numInARow = (1 + checkDirection(x, y, newRow, newCol, marker) + checkDirection(-x, -y, newRow, newCol, marker));
            if (numInARow>=4){
                gameOver();
                break;
            }
        }
    }
    
    // cell click
    function selectColumn($cell){
        var col = $cell.data('y');
        addPiece(parseInt(col));
    }
    
    $('.cell').click(function () {selectColumn($(this));});
});
