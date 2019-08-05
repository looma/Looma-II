/*
*
LOOMA js code file
Filename: looma-time.js
Description: This program creates eight different clocks on the canvas elements in
looma-clock-worldclocks.php.  Each clock shows the time in a different city.  It updates
each clock every second, and uses window.addEventListener('resize') to allow the clocks to
shrink and grow as the window size changes.

Programmer name: John Weingart and Grant Dumanian
Email: jrweingart@gmail.com, grant.dumanian@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 7/12/2016
Revision: Looma 2.0.x
Comments:
-->
*/

window.onload = function() {
    //canvas set-up
    var nepal = document.getElementById("nepal");
    var ctx1 = nepal.getContext("2d");
    var melbourne = document.getElementById("tokyo");
    var ctx2 = melbourne.getContext("2d");
    var newYork = document.getElementById("newYork");
    var ctx3 = newYork.getContext("2d");
    var paris = document.getElementById("paris");
    var ctx4 = paris.getContext("2d");
    var london = document.getElementById("london");
    var ctx5 = london.getContext("2d");
    var sanFrancisco = document.getElementById("sanFrancisco");
    var ctx6 = sanFrancisco.getContext("2d");
    var moscow = document.getElementById("moscow");
    var ctx7 = moscow.getContext("2d");
    var cairo = document.getElementById("cairo");
    var ctx8 = cairo.getContext("2d");

    var allCanvases = [nepal, melbourne, newYork, paris, london, sanFrancisco, moscow, cairo];
    var allCanvasContexts = [ctx1, ctx2, ctx3, ctx4, ctx5, ctx6, ctx7, ctx8];
    var names =       ["Kathmandu, Nepal", "Tokyo, Japan", "New York City, United States",
                       "Paris, France", "London, England", "San Francisco, United States", "Moscow, Russia", "Cairo, Egypt"];
    var nativeNames = ["काठमॉनडु, नेपाल",     "टोक्यो, जापान",   "न्यूयोर्क शहर, संयुक्त राज्य अमेरिका",
                       "पेरिस, फ्रान्स",     "लन्डन, इङ्गल्याण्ड",   "सैन फ्रान्सिस्को, संयुक्त राज्य अमेरिका",  "मास्को, रूस",       "कायरो, इजीपट"];
    
    var num;
    var fullRadius;
    var radius;
    
    //resize and translate all canvases
    for(num = 0; num < allCanvasContexts.length; num++) {
        resizeCanvas(allCanvases[num]);
        allCanvasContexts[num].translate(fullRadius, fullRadius);
    }
    radius = fullRadius * 0.80;
    
    window.addEventListener('resize', changeSize);

    //time
    var time = new Date();
    var hour = time.getUTCHours();
    var minute = time.getUTCMinutes();
    var second = time.getUTCSeconds();

    drawAllClocks();
    drawAllNames();
    
    $('#translate').click(function() {
       location.reload();
    });
    
    var myVar = setInterval(nextTime, 1000);
    
    function drawAllClocks() {
        drawClock(45, 5, ctx1);
        drawClock(0, 9, ctx2);
        drawClock(0, -4, ctx3);
        drawClock(0, 2, ctx4);
        drawClock(0, 1, ctx5);
        drawClock(0, -7, ctx6);
        drawClock(0, 3, ctx7);
        drawClock(0, 2, ctx8);
    }
    
    function drawAllNames() {
        if (language === 'english')
            for (num = 0; num < names.length; num++) {
                drawName(allCanvasContexts[num], names[num]);
            }
        else for (num = 0; num < nativeNames.length; num++) {
            drawName(allCanvasContexts[num], nativeNames[num]);
        }
    };
    
    function drawClock(distanceM, distanceH, ctx) {
        drawFace(ctx);
        drawNumbers(ctx);
        drawTicks(ctx, radius * 0.02);
        drawTime(ctx, hour + distanceH, minute + distanceM, second);
        drawDigitalTime(hour + distanceH, minute + distanceM, ctx);
    }

    function nextTime() {
        incrementSecond();
        drawAllClocks();
    }
    
    function incrementSecond() {
        second++;
        if (second > 59) {
            second = 0;
            minute = minute + 1;
            if (minute > 59) {
                hour = hour + 1;
                minute = 0;
                if (hour > 24) {
                    hour = 1;
                }
            }
        }
    }
    
    function drawFace(ctx) {
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

    function drawNumbers(ctx) {
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

    function drawTicks(ctx, width) {
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

    function drawTime(ctx, hour, minute, second) {
        var newHour = hour;
        if (newHour > 12) {
            newHour = newHour - 12;
        }
        //hours
        newHour = (newHour * Math.PI / 6) + (minute * Math.PI / (6 * 60));
        drawHand(ctx, newHour, radius * 0.5, radius * 0.07);

        //minute
        minute = (minute * Math.PI / 30);
        drawHand(ctx, minute, radius * 0.8, radius * 0.07);

    }

    function drawHand(ctx, pos, length, width) {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.moveTo(0, 0);
        ctx.rotate(pos);
        ctx.lineTo(0, -length);
        ctx.stroke();
        ctx.rotate(-pos);
    }

    function drawName(ctx, name) {
        ctx.font = "18px Chalkboard";
        ctx.fillStyle = "yellow";
        ctx.fillText(name, 0, -radius - 15);
    }
    
    function drawDigitalTime(hours, minutes, ctx) {
        ctx.clearRect(-radius * 2 / 3, radius, radius * 1.5, radius / 2);
        var printHour = hours;
        var printMinute = minutes;
        if(printMinute < 0) {
            printMinute = 60 + printMinute;
            printHour --;
        }
        else if(printMinute > 59) {
            printMinute = printMinute - 60;
            printHour ++;
        }
        
        if(printMinute < 10) {
            printMinute = "0" + printMinute;
        }
        if(printHour <= 0) {
            printHour += 24;
        }
        if(printHour > 24) {
            printHour = printHour - 24;
        }
        
        ctx.fillStyle = "yellow";
        ctx.font = "18px Chalkboard";
        //ctx.font = "25px Ariel";
        
        if(printHour >= 12 && printHour < 24) {
            if(printHour != 12) {
                ctx.fillText((printHour - 12) + ":" + printMinute + " PM", 0, radius + 12);
            }
            else {
                ctx.fillText(printHour + ":" + printMinute + " PM", 0, radius + 12);
            }
        }
        else {
            if(printHour == 24) {
                ctx.fillText("12:" + printMinute + " AM", 0, radius + 12);
            }
            else {
                ctx.fillText(printHour + ":" + printMinute + " AM", 0, radius + 12);
            }
        }
    }
    
    function changeSize() {
        var num;
        for(num = 0; num < allCanvases.length; num++) {
            resizeCanvas(allCanvases[num]);
            allCanvasContexts[num].translate(fullRadius, fullRadius);
        }
        radius = fullRadius * 0.80;

        drawAllClocks();
        drawAllNames();
    }
    
    function resizeCanvas(thisCanvas) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        
        if(width < height)
        {
            thisCanvas.height = width / 3;
            thisCanvas.width = width / 3;
        }
        
        else {
            thisCanvas.height = height / 3;
            thisCanvas.width = height / 3;
        }
        
        fullRadius = thisCanvas.height / 2;
    }
}
