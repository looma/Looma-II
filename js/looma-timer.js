"use strict";
// TIMER functions
// used by looma-game.js

// var $timer is defined and set by the calling JS code
// function timedOut()   is supplied by calling JS code

var secs;
var timer;

// functions setTimeout() and clearTimeout() are standard JS functions

function setTimer (secs) { $timer.html(secs); };

function getTimer () {return $timer.html(); };

function pauseTimer () {
    clearTimeout(timer);
    return $timer.html();
};

function clearTimer () {
    pauseTimer();
    setTimer(0);
};

function startTimer (secs) {
    clearTimeout(timer);
    if (secs) setTimer(secs);
    timer = setTimeout(tick, 1000);
};

function tick() {
    var currentTime = getTimer();
    currentTime--;
    setTimer (currentTime);
    if (currentTime > 0) {
        clearTimeout(timer);
        timer = setTimeout(tick,1000);
    }
    else timedOut();
};

/*
    on startTimer(), could also start a css animation with duration 'secs''
    changing background from green to red, vertical slide animation
 
     start with green background (z-index = 1)
     CSS translate a red background across the div (z-index = 2)
     [later note: the above can be done with CSS 'transition']
     animated with time = secs, so it finishes when the timer expires
*/


