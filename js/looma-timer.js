"use strict";

// var $timer is defined and set by the calling code

var secs;
var timer;

//Code was adjusted from Teddy Koker’s reply on the thread from the link below
//https://stackoverflow.com/questions/31106189/create-a-simple-10-second-countdown

function clearTimer () {
    pauseTimer();
    setTimer(0);
};

function setTimer (secs) { $timer.html(secs); };

function getTimer () {return $timer.html(); };

function pauseTimer () {
    clearTimeout(timer);
    return $timer.html();
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



