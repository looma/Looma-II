/*
* 
LOOMA js code file
Filename: looma-clock-singleclock.js
Description: This file randomly chooses a time to display on the clock using a canvas.  
It then checks if the user inputted the correct time in the dropdown menu.  It uses 
window.addEventListener('resize') to allow the clocks to shrink and grow as the window size changes.

Programmer name: John  and Grant
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 7/12/2016
Revision: Looma 2.0.x

*/

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
    grad = ctx.createRadialGradient(0, 0, radius * 0.95, 0, 0, radius * 1.05);
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
    printTime(hour, minute);
    
    hour = (hour * Math.PI / 6) + (minute * Math.PI / (6 * 60));
    drawHand(hour, radius * 0.5, radius * 0.04);
    
    //minute
    minute = (minute * Math.PI / 30);
    drawHand(minute, radius * 0.8, radius * 0.04);
}

function getRandomTime() {
    var randomHour = Math.floor(Math.random() * 13);
    var randomMinute = Math.floor(Math.random() * 13);
    
    var hour = randomHour;
    var minute = (randomMinute * 5);
    
    return {
        randHour: hour,
        randMinute: minute
    };
}

function printTime(hour, minute) {
    if (hour == 0) {
        hour = 12;
    }
    if (minute == 60) {
        hour++;
        minute = 0;
    }
    globalHour = hour;
    globalMinute = minute;
    return;
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

function userInput() {
    var outputValue = "";
    var userHour = document.getElementById("userHour");
    userH = userHour.value;
    var userMin = document.getElementById("userMin");
    userM = userMin.value;
    //var txtOutput = document.getElementById("txtOutput");
    var $txtOutput = $("#txtOutput");
    
    if (userH == globalHour && userM == globalMinute) {
        outputValue = "<span style='color:green;'>You are correct! </span>The time displayed on the clock is ";
    }
    
    else {
        outputValue = "<span style='color:red;'>That's not right. </span> The correct answer is ";
    }
    
    if(globalMinute < 10) {
        outputValue = outputValue + globalHour + ":" + "0" + globalMinute + ".";
    }
    else {
        outputValue = outputValue + globalHour + ":" + globalMinute + ".";
    }
    
    $txtOutput.html(outputValue);
    return false;
}

function changeSize() {
    resizeCanvas();
    ctx.translate(radius, radius);
    radius = radius * 0.9;
    
    drawFace();
    drawNumbers();
    drawTime(globalHour, globalMinute);
    drawTicks(radius * 0.02);
}

function resizeCanvas() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    if(width < height)
    {
        canvas.height = width * 5 / 9;
        canvas.width = width * 5 / 9;
    }
    
    else {
        canvas.height = height * 5 / 9;
        canvas.width = height * 5 / 9;
    }
    
    radius = canvas.height / 2;
}

var globalHour;
var globalMinute;
var canvas, ctx, radius;

function newproblem() {   resizeCanvas();
    txtOutput.innerHTML = "";
    
    ctx = canvas.getContext("2d");
    radius = canvas.height / 2;
    ctx.translate(radius, radius);
    radius = radius * 0.90;
    window.addEventListener('resize', changeSize);
    
    var randomTime = getRandomTime();
    drawClock(randomTime.randHour, randomTime.randMinute);}
    
window.onload = function() {
    var submitButton = document.getElementById("submit");
    submitButton.addEventListener('click', userInput);
    
    var reset = document.getElementById("newproblem");
    reset.addEventListener('click', newproblem);
    
    //graphics of the canvas
    canvas = document.getElementById("mainClock");
 
    newproblem();
 
}