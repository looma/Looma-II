'use strict';
var $timer;
var maxTimer = 10;
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
    $('#timer').style()
    if (currentTime > 0) {
        clearTimeout(timer);
        timer = setTimeout(tick,1000);
    }
    else timedOut();
};

function timedOut(){
    startTimer(maxTimer);
}
$(document).ready (function() {
    $timer = $('#timer-count');
    startTimer(maxTimer);
    
    /*
    on starttimer, also start a css animation with duration maxTimer
    changing background from green to red, vertical slide animation
   
   start with green background (z-index = 1)
   CSS translate a red background across the div (z-index = 2)
   animated with time = maxTimer, so it finishes when the timer expires
     */
});