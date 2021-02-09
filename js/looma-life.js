/*
LOOMA javascript file
Filename: looma-life.js

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: APR 2020
Revision: Looma 3.0
 */

'use strict';

var width = 150;
var height = 75;
var wait = 500;  // milliseconds to pause between generations
var grid = []; var newgrid= []; var gridrow = []; var newgridrow = [];

var stopped = true;   var generation = 0;
var timer;

function copy (source) {
    let dest = [];
    for (let k=0;k<source.length;k++) dest[k] = source[k].slice();
    return(dest);
}

// the RULES of the GAME of LIFE
//   live cell with 2 or 3 live neighbors stays alive
//   dead cell with 3 live neighbors comes alive
function stateChange(h,w) {
    let thiscell = grid[h][w];
    let liveneighbors = 0;
    for (let m = h-1;m<=h+1;m++)    for (let n=w-1;n<=w+1;n++) {
        if (m>=0 && m <height && n>=0 && n <width && !(m===h && n===w) && grid[m][n] === 1) liveneighbors++;
    }
    return ( (thiscell === 1 && (liveneighbors < 2 || liveneighbors > 3)) || (thiscell === 0 && liveneighbors === 3));
}

function run() {
    timer = setInterval(function() {
        if (stopped) { clearInterval(timer); return;}
        newgrid = copy(grid);
         for (let i=0;i<height;i++)
            for (let j=0;j<width;j++) {
                if (stateChange(i, j)) {
                    let s = newgrid [i][j] = 1 - grid[i][j];
                    if (s === 1) $('.cell[data-x=' + (j) + ']').filter('[data-y=' + (i) + ']').addClass('live');
                    else         $('.cell[data-x=' + (j) + ']').filter('[data-y=' + (i) + ']').removeClass('live');
                }
            }
            grid = copy(newgrid);
        generation++;
    }
    ,wait);
}

$(document).ready(function() {
   
   // build the grid
    $('#world').css( 'grid-template-columns', 'repeat('+ width +',1fr');
    $('#world').css( 'grid-template-rows', 'repeat('+ height +',1fr');
    
    for (let j = 0; j < height; j++) {
        gridrow = []; newgridrow = [];
        for (let i = 0; i < width; i++) {
            $('<div/>', {class: 'cell', 'data-x': i, 'data-y': j}).appendTo($('#world'));
            gridrow.push (0) ;
            newgridrow.push (0) ;
        }
        grid.push (gridrow); newgrid.push(newgridrow);
    }
    
    // clicking a cell changes its state live <-> dead
    function toggleCell($cell) {
        if ($cell.hasClass('live')) {$cell.removeClass('live'); grid[parseInt($cell.data('y')) ][parseInt($cell.data('x')) ] = 0;}
        else                        {$cell.addClass('live');    grid[parseInt($cell.data('y')) ][parseInt($cell.data('x')) ] = 1;}
    }
    
    $('.cell').click(function () {toggleCell($(this));});
    
    $('.play-pause').click(playPause);
    
    function playPause () { // play or pause the currently playing MEDIA - stored in global var media
        if (stopped) {
            stopped = false;
            $('.cell').off('click');
            $('.play-pause').css('background-image', 'url("images/pause.png")');
            run();
        } else {
            stopped = true;
            $('.cell').click(function () {toggleCell($(this));});
            $('.play-pause').css('background-image', 'url("images/video.png")');
        }
    } //end mediaPlayPause()
});
