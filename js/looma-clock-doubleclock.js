/*
* 
LOOMA js code file
Filename: looma-clock-doubleclock.js
Description: this file randomly chooses two times to display on the two clocks 
(using Math.random()), draws the clocks with these times, and checks if the user 
inputs the correct difference in time between the two clocks.  It uses 
window.addEventListener('resize') to allow the clocks to shrink and grow as the window size changes.

Programmer name: John  and Grant
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 7/12/2016, rev 2: 2020 10 23 (Skip)
Revision: Looma 2.0.x
Comments:
-->
*/
var globalHourFirst;
var globalMinuteFirst;
var globalHourSecond;
var globalMinuteSecond;

var flag = 0;

var hoursPassed;
var minutesPassed;
var canvas, ctx, radius;

/* selects two random times for the two clocks, and makes sure the second time
* is greater than the first time
*/

function drawRandomClocks() {
    var randomTime;
    var hour;
    var minute;
    
    /* Get first random time, making sure it is not too high; if it is
    too high it will take a long time to randomly select a higher value for the second*/
    
    do {
        randomTime = getRandomTime();
        hour = randomTime.randHour;
        minute = randomTime.randMinute;
    } while(hour == 11);
    
    //draws clock and sets
    drawClock(hour, minute);
    
    //get second random time, making sure it is later than the first
    do {
        randomTime = getRandomTime();
        hour = randomTime.randHour;
        minute = randomTime.randMinute;
    } while(hour + minute / 60 < globalHourFirst + globalMinuteFirst / 60);
    
    mirrorClock(hour, minute);
    calculate();
}

//Returns random hour and minute (hour: 0 - 11, minute: 0 - 55, multiples of 5)
function getRandomTime() {
    var randomHour = Math.floor(Math.random() * 12);
    var randomMinute = Math.floor(Math.random() * 12);
    
    var hour = randomHour;
    var minute = (randomMinute * 5);
    
    return {
        randHour: hour,
        randMinute: minute
    };
}

function drawClock(hour, minute) {
    drawFace();
    drawNumbers();
    drawTime(hour, minute);
    drawTicks(radius * 0.02);
}

function drawFace() {
    var grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    grad = ctx.createRadialGradient(0, 0, radius * 0.95, 0, 0,
        radius * 1.05);
    grad.addColorStop(0, '#333');
    grad.addColorStop(0.5, 'white');
    grad.addColorStop(1, '#333');
    ctx.strokeStyle = grad;
    ctx.lineWidth = radius * 0.1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
}

function drawNumbers() {
    var ang;
    var num;
    ctx.font = radius * 0.15 + "px arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("AM", 0, -radius / 4);
    for (num = 1; num < 13; num++) {
        ang = num * Math.PI / 6;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.81);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.81);
        ctx.rotate(-ang);
    }
}

function drawTicks(width) {
    var ang;
    var num;
    
    for (num = 1; num < 61; num++) {
        ang = num * Math.PI / 30;
        ctx.beginPath();
        if (num % 5 == 0) {
            ctx.lineWidth = width * 2;
        } else {
            ctx.lineWidth = width;
        }
        ctx.lineCap = "round";
        ctx.rotate(ang);
        ctx.moveTo(0, -radius * 0.92);
        ctx.lineTo(0, -radius);
        ctx.stroke();
        ctx.rotate(-ang);
    }
}

function drawTime(hour, minute) {
    //hour
    hour = hour % 12;
    printTime(hour, minute);
    hour = (hour * Math.PI / 6) + (minute * Math.PI / (6 * 60))
    drawHand(hour, radius * 0.5, radius * 0.04);
    
    //minute
    minute = (minute * Math.PI / 30);
    drawHand(minute, radius * 0.8, radius * 0.04);
}

function drawHand(pos, length, width) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
}

function mirrorClock(hour, minute) {
    var fullRadius = canvas.height / 2;
    
    ctx.translate(fullRadius * 2, 0);
    drawClock(hour, minute);
}

function printTime(hour, minute) {
    if (minute == 60) {
        hour++;
        minute = 0;
    }
    if (flag == 0) {
        globalHourFirst = hour;
        globalMinuteFirst = minute;
        flag = 1;
    } else {
        globalHourSecond = hour;
        globalMinuteSecond = minute;
        flag = 0;
    }
    console.log(globalHourFirst);
    console.log(globalHourSecond);
    return;
}

function userInput() {
    var userHour = document.getElementById("userHour");
    userH = userHour.value;
    var userMin = document.getElementById("userMin");
    userM = userMin.value;
    //var txtOutput = document.getElementById("txtOutput");
    var $txtOutput = $("#txtOutput");
    
    if (userH == hoursPassed && userM == minutesPassed) {
        outputValue = "<span style='color:green;'>You are correct! </span>The difference between the clocks is ";
    }
    
    else {
        outputValue = "<span style='color:red;'>That's not right.  </span>The correct answer is ";
    }
    
    outputValue = outputValue + hoursPassed + " hours, " + minutesPassed + " minutes";
    
    $txtOutput.html(outputValue);
    return false;
}

function calculate() {
    hoursPassed = 0;
    minutesPassed = 0;
    
    //minutes
    if (globalMinuteFirst == globalMinuteSecond) {
        minutesPassed = 0;
    } else if (globalMinuteFirst < globalMinuteSecond) {
        minutesPassed = globalMinuteSecond - globalMinuteFirst;
    } else {
        minutesPassed = (60 - globalMinuteFirst) + globalMinuteSecond;
        globalHourFirst++;
    }
    
    //hours
    if (globalHourFirst == globalHourSecond) {
        hoursPassed = 0;
    } else {
        hoursPassed = globalHourSecond - globalHourFirst;
    }
}

function changeSize() {
    resizeCanvas();
    ctx.translate(radius, radius);
    radius = radius * 0.9;
    
    drawClock(globalHourFirst, globalMinuteFirst);
    mirrorClock(globalHourSecond, globalMinuteSecond);
}

function resizeCanvas() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    if(width < 2 * height)
    {
        canvas.height = width * 4 / 15;
        canvas.width = width * 8 / 15;
    }
    else {
        canvas.height = height * 8 / 15;
        canvas.width = height * 16 / 15;
    }
    radius = canvas.height / 2;
}

function newproblem() {
    //graphics of the canvas
    txtOutput.innerHTML = "";
    
    resizeCanvas();
    ctx = canvas.getContext("2d");
    radius = canvas.height / 2;
    ctx.translate(radius, radius);
    radius = radius * 0.90;
    window.addEventListener('resize', changeSize);
    
    drawRandomClocks();
}

window.onload = function() {  

    var submitButton = document.getElementById("submit");
    submitButton.addEventListener('click', userInput);
    
    var reset = document.getElementById("newproblem");
    reset.addEventListener('click', newproblem);
    
    canvas = document.getElementById("doubleClock");
    
    newproblem();
}