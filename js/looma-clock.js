/*
*
LOOMA js code file
Filename: looma-time.js
Description: This program runs the main clock in looma's time features.  It
gets the time from the computer, and draws the current time on an analog and digital
clock.  The analog clock is drawn with a canvas (methods: drawFace(), drawNumbers(),
drawTicks() drawTime()).
It then uses a setInterval() call to count up, redrawing the time each second.  The
canvas has three event listeners: mousedown, mousemove, and mouseup, which allow the
user to drag and drop the hour and minute hands and the program updates the time.  It
also has an event listener for a button that resets the clock back to the current time,
and one for hiding and showing the buttons on the screen.

The program also runs a digital clock, which is hidden from the screen until the user
clicks on the "digital clock" button (another event listener), which hides the analog clock
and shows the digital clock.  The button also works in the opposite direction.  The digital
clock displays the time, as well as the day of the week and date.  It has a button to
switch between 24 and 12 hour times (event listener).

It uses uses window.addEventListener('resize') to allow the clocks to shrink and grow
as the window size changes.

Programmer name: John Weingart and Grant Dumanian
Email: jrweingart@gmail.com, grant.dumanian@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 7/12/2016
Revision: Looma 2.0.x
Comments:
The hour hand drag will lag a bit if dragged too fast
-->
*/

//global variables for the time
var time;
var hour;
var minute;
var second;
var timer = false;
var twentyFour = false;

//months and weeks for digital clock
var months = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];
var weeks = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday" ];

$(document).ready (function() {

//ANALOG CLOCK METHODS
//draws the clock
    function drawInitialClock() {
        drawFace();
        drawNumbers();
        drawTime(hour, minute, second);
        drawTicks(radius * 0.02);
        drawDigitalClock();
    }

//increments the time, and then draws the clock
    function drawNextClock() {
        //console.log(radius);
        second++;
        if (second > 59) {
            second = 0;
            minute = minute + 1;
            
            if (minute > 59) {
                minute = 0;
                hour = hour + 1;
                if (hour > 24) {
                    hour = 1;
                }
            }
        }
        drawFace();
        drawNumbers();
        drawTime(hour, minute, second);
        drawTicks(radius * 0.02);
        drawDigitalClock();
        drawDigitalTime();
    }

//draw the face of the clock
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

//draw the numbers on the clock
    function drawNumbers() {
        var ang;
        var num;
        ctx.font = radius * 0.18 + "px arial";
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

//draw tick marks in between numbers
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
    
    function getCurrentTime() {
        var x = new Date();
        return x;
    }

//draw the hands on the clock depending on the hour, minute, and second
    function drawTime(hour, minute, second) {
        var newHour = hour;
        var newMinute = minute;
        
        if (newHour > 12) {
            newHour = newHour - 12;
        }
        
        //hour
        newHour = (newHour * Math.PI / 6) + (minute * Math.PI / (6 * 60));
        drawHand(newHour, radius * 0.5, radius * 0.04);
        
        //minute
        minute = (minute * Math.PI / 30);
        drawHand(minute, radius * 0.8, radius * 0.04);
        
        //second
        if(second >= 0) {
            second = second * Math.PI / 30;
            drawHand(second, radius * 0.8, radius * .025);
        }
    }

//draw any hand
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

//draws the small digital clock under the analog clock
    function drawDigitalClock(){
        var minutePrint = minute;
        var hourPrint = hour;
        //console.log(hour);
        
        if (minute < 10) {
            minutePrint = "0" + minute;
        } else {
            minutePrint = minute;
        }
        if(hourPrint > 12)
        {
            hourPrint = hourPrint - 12;
        }
        
        if(hour > 24) {
            hour = 1;
        }
        
        document.getElementById("digitalTime").innerHTML = hourPrint + ":" + minutePrint;
        if(hour < 24 && hour >= 12) {
            document.getElementById("amOrPm1").innerHTML = "PM";
        }
        else {
            document.getElementById("amOrPm1").innerHTML = "AM";
        }
    }

//revert back to the current time clock
    function toCurrentTime() {
        time = getCurrentTime();
        hour = time.getHours();
        minute = time.getMinutes();
        second = time.getSeconds();
        
        if(hour == 0) {
            hour = 24;
        }
        drawInitialClock();
        $("#toCurrentTime").hide();
        //clearInterval(timer);
        clearTimers();
        if(!timer) {timer = setInterval(drawNextClock, 1000);}
    }

//click the oneClock button (simpler clock), show/hide the buttons
    function hideOrShowButtons() {
        if(!hidden) {
            document.getElementById("a").style.display = 'none';
            document.getElementById("b").style.display = 'none';
            document.getElementById("b2").style.display = 'none';
            document.getElementById("c").style.display = 'none';
            document.getElementById("d").style.display = 'none';
            currentTimeSwitch.style.display = 'none';
            document.getElementById("dragHands").innerHTML = "";
        }
        else {
            document.getElementById("a").style.display = 'block';
            document.getElementById("b").style.display = 'block';
            document.getElementById("b2").style.display = 'block';
            document.getElementById("c").style.display = 'block';
            document.getElementById("d").style.display = 'block';
            currentTimeSwitch.style.display = 'block';
            document.getElementById("dragHands").innerHTML = "Drag and drop the hour or minute hand!";
        }
        hidden = !hidden;
    }

//shows the digital clock elements and hides the analog clock elements
    function toDigital() {
        //analog --> digital
        document.getElementById("mainClock").style.display = 'none';
        document.getElementById("digitalDisplay").style.display = 'none';
        $('#digitalTime').hide();
        //document.getElementById("digitalTime").style.display = 'none';
        document.getElementById("dragHands").innerHTML = "";
        
        //$("#toCurrentTime").hide();
        
        //document.getElementById("toCurrentTime").style.display = 'none';
        $('#amOrPm1').hide();
        //document.getElementById("amOrPm1").style.display = 'none';
        
        document.getElementById("time").style.display = 'block';
        document.getElementById("date").style.display = 'block';
        document.getElementById("day").style.display = 'block';
        document.getElementById("seconds").style.display = 'block';
        document.getElementById("clockBox").style.display = 'block';
        document.getElementById("twentyFourHour").style.display = 'block';
        document.getElementById("amOrPm").style.display = 'block';
        
        document.getElementById("analogClockButton").style.display = 'block';
        document.getElementById("digitalClockButton").style.display = 'none';
        
        //document.getElementById("b").style.display = 'none';
        //document.getElementById("b2").style.display = 'block';
        toCurrentTime();
    }

//shows the analog clock elements and hides the digital clock elements
    function toAnalog() {
        //digital --> analog
        document.getElementById("mainClock").style.display = 'inline-block';
        document.getElementById("digitalDisplay").style.display = 'inline-block';
        $('#digitalTime').show();
        //$("#toCurrentTime").show();
        //document.getElementById("toCurrentTime").style.display = 'block';
        $('#amOrPm1').show();
        //document.getElementById("amOrPm1").style.display = 'block';
        document.getElementById("dragHands").innerHTML = "Drag and drop the hour or minute hand!";
        
        document.getElementById("time").style.display = 'none';
        document.getElementById("date").style.display = 'none';
        document.getElementById("day").style.display = 'none';
        document.getElementById("seconds").style.display = 'none';
        document.getElementById("clockBox").style.display = 'none';
        document.getElementById("twentyFourHour").style.display = 'none';
        document.getElementById("amOrPm").style.display = 'none';
        
        document.getElementById("analogClockButton").style.display = 'none';
        document.getElementById("digitalClockButton").style.display = 'block';
        
        //document.getElementById("b").style.display = 'block';
        //document.getElementById("b2").style.display = 'none';
        toCurrentTime();
    }
//click on canvas
    function click(event) {
        var mouseCoords = getMouseCoords(event);
        var minuteDouble = minuteHand(mouseCoords.x, mouseCoords.y)
        var minuteClicked = Math.floor(minuteDouble);
        var hourClicked = minuteClicked / 5;
        var hourCheck = hour;
        
        console.log('mouse down at min: ' + minuteClicked + ' and hour: ' + hourClicked);
        
        if(hourCheck > 12) {
            hourCheck = hourCheck - 12;
        }
        if(hourClicked < 1) {
            hourClicked +=12;
        }
        
        var distance = Math.sqrt((mouseCoords.x - canvas.height / 2) * (mouseCoords.x - canvas.height / 2) + (mouseCoords.y - canvas.height / 2) * (mouseCoords.y - canvas.height / 2));
        var howFarOff = Math.abs(hourClicked - (hourCheck + minute / 60));
        
        console.log(hourCheck + minute / 60);
        //console.log(hourClicked);
        if((minuteClicked == minute || minuteClicked == minute - 1) && distance < radius * 0.85) {
            mouseIsDown = true;
            checkHandLocation(minuteDouble);
        }
        else if(howFarOff < 0.5 && distance < radius * 0.6){
            mouseIsDownHour = true;
            checkHandLocation(minute);
        }
    }

//mouse has been moved on canvas
    function mouseMoved(event)
    {
        if(mouseIsDown) {
            //clearInterval(timer);
            clearTimers();
            timer = false;
            
            var mouseCoords = getMouseCoords(event);
            var minuteDouble = minuteHand(mouseCoords.x, mouseCoords.y);
            minute = Math.floor(minuteDouble);
            
            checkHandLocation(minuteDouble);
            
            drawFace();
            drawNumbers();
            drawTime(hour, minute , -1);
            drawTicks(radius * 0.02);
            drawDigitalClock();
            $("#toCurrentTime").show();
    
        }
        
        else if(mouseIsDownHour) {
            //clearInterval(timer);
            clearTimers();
            timer = false;
            
            var mouseCoords = getMouseCoords(event);
            var hourDouble = hourHand(mouseCoords.x, mouseCoords.y);
            minute = Math.floor((hourDouble - hour) * 60);
            
            minute = minute % 60;
            if(minute < 0) {
                minute = 60 + minute;
            }
            
            checkHandLocation(minute);
            drawFace();
            drawNumbers();
            drawTime(hour, minute, -1);
            drawTicks(radius * 0.02);
            drawDigitalClock();
            $("#toCurrentTime").show();
    
        }
        //$("#toCurrentTime").show();
    }

//mouse released
    function exitDrag(event) {
        mouseIsDown = false;
        mouseIsDownHour = false;
    }

//increments or decreases the hour if the minute hand crosses the 12
    function checkHandLocation(minuteDouble) {
        if(minuteDouble < 20 && minuteDouble >= 0) {
            if(side == -1) {
                incrementHour();
            }
            side = 1;
        }
        else if(minuteDouble > 40 && minuteDouble < 60) {
            if(side == 1) {
                decreaseHour();
            }
            side = -1;
        }
        
        else if(minuteDouble < 40 && minuteDouble > 20) {
            side = 0;
        }
    }
    
    function decreaseHour() {
        if(hour == 1) {
            hour = 24;
        }
        else {
            hour = hour - 1;
        }
    }
    
    function incrementHour() {
        if(hour == 24) {
            hour = 1;
        }
        else {
            hour = hour + 1;
        }
    }

//returns x and y coords of click on the canvas
    function getMouseCoords(event)
    {
        var rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

//returns which minute was clicked
    function minuteHand(x, y) {
        var diffX = x - canvas.height / 2;
        var diffY = canvas.height / 2 - y;
        var angle = -Math.atan(diffY / diffX) + Math.PI / 2;
        
        if (diffX >= 0) {
            return angle * 30 / Math.PI;
        } else {
            return (angle + Math.PI) * 30 / Math.PI;
        }
    }

//returns the exact hour clicked (as a double)
    function hourHand(x, y) {
        var diffX = x - canvas.height / 2;
        var diffY = canvas.height / 2 - y;
        var angle = -Math.atan(diffY / diffX) + Math.PI / 2;
        
        if (diffX >= 0) {
            return angle * 6 / Math.PI;
        } else {
            return (angle + Math.PI) * 6 / Math.PI;
        }
    }

//DIGITAL CLOCK METHODS

//actual digital clock page, with time, date, day of week
    function drawDigitalTime() {
        var hourPrint = hour;
        var minutePrint = minute;
        var secondPrint = second;
        
        if (minute < 10) {
            minutePrint = "0" + minute;
        } else {
            minutePrint = minute;
        }
        if (second < 10) {
            secondPrint = "0" + second;
        } else {
            secondPrint = second;
        }
        
        if (!twentyFour) {
            if (hour >= 12 && hour <= 24) {
                if(hour !=12) {
                    hourPrint = hourPrint - 12;
                }
                if(hour !=24) {
                    document.getElementById("amOrPm").innerHTML = "PM";
                }
            } else {
                document.getElementById("amOrPm").innerHTML = "AM";
            }
        }
        document.getElementById("time").innerHTML = hourPrint + ":"
            + minutePrint;
        document.getElementById("seconds").innerHTML = secondPrint;
        document.getElementById("day").innerHTML = weeks[time.getDay()];
        document.getElementById("date").innerHTML = months[time.getMonth()]
            + " " + time.getDate() + ", " + time.getFullYear();
    }

//24 <--> 12 hour time
    function switchHour() {
        twentyFour = !twentyFour;
        if(twentyFour){
            switchTime.innerHTML = "12 Hour Time";
            document.getElementById("amOrPm").innerHTML = "";
        }
        else{
            switchTime.innerHTML = "24 Hour Time";
        }
        drawDigitalTime();
    }

//resize canvas, draw clocks with current time
    function changeSize() {
        //clearInterval(timer);
        clearTimers();
        timer = false;
        
        resizeCanvas();
        ctx.translate(radius, radius);
        radius = radius * 0.9;
        
        drawFace();
        drawNumbers();
        drawTime(hour, minute, -1);
        drawTicks(radius * 0.02);
        drawDigitalClock();
        
        toCurrentTime();
    }

//resizes the canvas using the window.innerWidth and window.innerHeight
    
    
    
    function resizeCanvas() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        
        //  IMPORTANT:  the factor below "0.7" is the size of the clock DIV relative to viewport size
        //      this is set in looma-clock.css (currently around line 145) using
        //      #mainClock{height:70vh;width:70vh;}
        //      if the CSS changes, the factor needs to be changed here. else, dragging the hands wont work
        //
        //   FIX: this code should interrogate the size of #mainClock and use those dimensions to set
        //        the canvas H and W
        if(width < height)
        {
            canvas.height = width * 0.7;
            canvas.width = width * 0.7;
        }
        
        else {
            canvas.height = height * 0.7;
            canvas.width = height * 0.7;
        }
        
        radius = canvas.height / 2;
    }
    
    // SPEAK button will say the time, unless text is selected, in which case, it will speak the selected text
    $('button.speak').off('click').click(function () {
        var selectedString = document.getSelection().toString();
        
        time = getCurrentTime(); hour = time.getHours();
        var ampm =        (hour > 12) ? ("P M") : "A M";
        var hourToSpeak = (hour > 12) ? (hour - 12) : hour;
        var timeToSpeak = hourToSpeak + ' O clock and ' + time.getMinutes() + ' minutes ' + ampm;
        var toSpeak = (selectedString ? selectedString : timeToSpeak);
        console.log('VOCAB: speaking ', toSpeak);
        LOOMA.speak(toSpeak);
    }); //end speak button onclick function

//create the canvas for the clock, add eventListeners for click and drag
    canvas = document.getElementById("mainClock");
    canvas.addEventListener('mousedown', click);
    canvas.addEventListener('mousemove',mouseMoved);
    canvas.addEventListener('mouseup', exitDrag);
    var mouseIsDown = false;
    var mouseIsDownHour = false;
    var side = 0;

//create event listener for one clock button
    var oneClock = document.getElementById("clock-only");
    oneClock.addEventListener('click', hideOrShowButtons);
    var hidden = false;

//create event listener for digital clock button
    var digitalClock = document.getElementById("b");
    digitalClock.addEventListener('click', toDigital);
    
    var analogClock = document.getElementById("b2");
    analogClock.addEventListener('click', toAnalog);

//switch back to current time button
    var currentTimeSwitch = document.getElementById("toCurrentTime");
    currentTimeSwitch.addEventListener("click", toCurrentTime);

//switch b/w 24-hour and 12-hour time
    var switchTime = document.getElementById("twentyFourHour");
    switchTime.addEventListener("click", switchHour);


//graphics of the canvas
    var canvas;
    
    resizeCanvas();
    var ctx = canvas.getContext("2d");
    var radius = canvas.height / 2;
    ctx.translate(radius, radius);
    radius = radius * 0.90;
    window.addEventListener('resize', changeSize);
    
    toCurrentTime();
    
    function clearTimers() {
        for(var i=0; i < timer; i+=1) {clearInterval(i);}
        timer = 0;
    };  // end clearTimers()
    
    window.onbeforeunload = clearTimers;
  
    $(document).ready(function() {
        toolbar_button_activate("clock");
    });
    
});
