/* LOOMA WHITEBOARD
 * VillageTech Solutions     www.villagetechsolutions.org
 * Version 3.0
 * programmed Summer 2014, Winter 2015, Summer 2015, Fal 2015
 * by Audrey Flower, John D Wilson, Akshay Srivatsan, Skip
 * Filename looma-paint.js
 * Companion files: looma-paint.php, looma-paint.css, looma-paint-openfile.html
 * Libraries used: paper-full.js
 */

"use strict";

var canvas;

var isDrawing = false;

var x;
var y;
var startX;
var startY;
var width;
var height;

//var canvasWidth;
//var canvasHeight;

var clearElement;
var undoElement;

var drawElement;
var eraseElement;

var saveElement;
var openElement;
var backElement;

var mouseDown;
var mouseMove;
var mouseUp;

var clear;
var undo;

var select; //function to process a button click that changes PAINT settings (e.g. color, shape, ...)

// collect all user settings in one object
// properties are 'color', 'size', 'shape' and 'pencil'
//   legal values for 'color': any strokeColor value accepted by paper.js. similar to CSS colors, e.g. "red" or "#ff0000"
//   legal values for 'size': any strokeWidth value accepted by paper.js, e.g. 'thin', 'extrathin' or numrical - '4' means "4pt"
//     legal values for 'shape': 'scribble', 'line', 'rectangle', 'oval', 'heart'
//     legal values for 'pencil': 'draw', 'erase'
var currentSettings = {
    color: "red",
    size : 10,
    shape: "scribble",
    pencil: "draw"
};

var currentPath;
var historyStack = [];
var startPoint;
//var currentSymbolInstance;
var previousScale;


var ALT_HEART =
       "M 254.61918,253.64205 C 117.17208,251.17089 -10.019359,466.12329 360.54492,688.98275 ";
       ALT_HEART += "C 360.95119,688.25159 362.51369,688.25159 362.91995,688.98275  ";
       ALT_HEART += "C 745.43794,458.93404 597.58506,237.34257 455.54564,254.5921  ";
       ALT_HEART += "C 400.17294,261.31658 374.04232,292.04855 361.73239,318.48008  ";
       ALT_HEART += "C 349.42256,292.04855 323.29184,261.31658 267.91932,254.5921  ";
       ALT_HEART += "C 263.48052,254.05283 259.053,253.72191 254.61918,253.64205 z";


// big heart shape from internet
var HEART_STRING = 'M340.8 98.4 c50.7 0 91.9 41.3 91.9 92.3 c0 26.2-10.9 49.8-28.3 66.6 L256 407.1 ';
    HEART_STRING += 'L105 254.6 c-15.8-16.6-25.6-39.1-25.6-63.9 c0-51 41.1-92.3 91.9-92.3 c38.2 0 70.9 23.4 84.8 56.8 ';
    HEART_STRING += 'C269.8 121.9 302.6 98.4 340.8 98.4 M340.8 83 C307 83 276 98.8 256 124.8 c-20-26-51-41.8-84.8-41.8 ';
    HEART_STRING += 'C112.1 83 64 131.3 64 190.7 c0 27.9 10.6 54.4 29.9 74.6 L245.1 418 l10.9 11 l10.9-11 l148.3-149.8 ';
    HEART_STRING += 'c21-20.3 32.8-47.9 32.8-77.5 C448 131.3 399.9 83 340.8 83 L340.8 83 z';

                /*

            "M1 0.5 C1 0 0 0.25 1 1 L1 0.5 C1 0 2 0.25 1 1";

             function drawHeart (ctx, x, y, startX, startY) {
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    var width = x - startX;
                    var height = y - startY;
                    ctx.beginPath();
                    ctx.moveTo(startX + width / 4, startY);
                    ctx.bezierCurveTo(startX, startY, startX, startY + height / 4, startX + width / 2, y);
                    ctx.moveTo(x - width / 4, startY);
                    ctx.bezierCurveTo(x, startY, x, startY + height / 4, startX + width / 2, y);
                    ctx.moveTo(x - width / 4, startY);
                    ctx.quadraticCurveTo(startX + width / 2, startY, startX + width / 2, startY + height / 4);
                    ctx.moveTo(startX + width / 4, startY);
                    ctx.quadraticCurveTo(startX + width / 2, startY, startX + width / 2, startY + height / 4);
                    ctx.stroke();
              }    ; //end drawHeart()

    */

var SMOOTH_AMOUNT = 50;

var COUNTER = "counter";

window.onload = function () {

        // Initialize all the elements, and set up paper.js to use the canvas.
        canvas = document.getElementById("canvas");
        paper.setup(canvas);

        //canvasWidth = canvas.width;
        //canvasHeight = canvas.height;

        canvas.onmousedown = mouseDown;
        canvas.onmouseup =     mouseUp;
        canvas.onmousemove = mouseMove;

        clearElement = document.getElementById("clear");
        undoElement =    document.getElementById("undo");

        clearElement.onclick = clear;
        undoElement.onclick = undo;

        $('.drop-content img').click(select);  //change currentSettings based on user button press

        // trying to override PAGESPEED optimization that doesnt change COLOR button image
        $('#colorButton').attr('src', 'images/reddot.png');


        saveElement = document.getElementById("save");
        openElement = document.getElementById("open");
        backElement = document.getElementById("back");

        saveElement.onclick = saveFile;
        openElement.onclick = showOpenMenu;
        backElement.onclick = back;

        // If this is the first run, set the counter to 0.
           // If not, don't change anything.
        localStorage.setItem(COUNTER, localStorage.getItem(COUNTER) || "0");

        // if we are being called from looma-paint-openfile, then the # hash value contains the filename to open
        if (location.hash != "") {
            openFile(location.hash.substring(1));
        }

        //non-W3C standard CSS "user-select:none" keeps the canvas from being selectable
        //NOTE: why not put this in the CSS?
        ["", "-moz-", "-webkit-", "-ms-", "-khtml-"].forEach(function(obj, i){
          document.body.style[obj + "user-select"] = "none";
        });
};

function getColor() {
    var color;
    if (currentSettings.pencil == 'erase') {
        color = 'white';
    }
    else {
//        color = selectedColor.getAttribute("value");
          color = currentSettings.color;
    }
    return color;
}

mouseDown = function(e) {
    /*
    Called when the user clicks on the canvas. This function decides what shape to
    start drawing, and sets its color and initial properties.
    */

    //DEBUG
      //console.log('PAINT: mouseDown');
    //

    x = e.pageX - $('#canvas').offset().left;
    y = e.pageY - $('#canvas').offset().top;

    startPoint = new paper.Point(x, y);
    var color = getColor();

    if (currentSettings.shape == 'scribble' || currentSettings.pencil == 'erase')
    {
        /*
        The user is either free-drawing or erasing. The only difference between
        these modes is that the eraser doesn't activate smoothing.
        */

        currentPath = new paper.Path({
            segments: [new paper.Point(x, y)]
        });
    }
    else if (currentSettings.shape == 'line')
    {
        currentPath = new paper.Path.Line
            (new paper.Point(x, y), new paper.Point(x, y));
    }
    else if (currentSettings.shape == 'rectangle' || currentSettings.shape == 'oval')
    {
        var rect = new paper.Rectangle(new paper.Point(x, y), new paper.Point(x,y));
        if (currentSettings.shape == 'rectangle') {
            currentPath = new paper.Path.Rectangle(rect);
        }
        else {
            currentPath = new paper.Path.Ellipse(rect);
        }
    }
    else if (currentSettings.shape == 'heart')
    {
        /*
        HEART_STRING is a set of SVG path commands that draws a heart out of bezier
        curves.
        */
        //var p = new paper.Path(HEART_STRING);
        var p = new paper.Path(ALT_HEART);
        p.scale(.01, startPoint);  //scale down from big heart shape
        //p.fillColor = color;  //NOTE: should be OUTLINE, not FILL to conform with RECT and OVAL, but bezier curves need to be fixed
        p.strokeColor = color;
        p.strokeWidth = 0.1 * currentSettings.size;
        p.position = startPoint;
        p.scale(100, startPoint);
        previousScale = 100;
        currentPath = p;
    }

        if (currentPath) {

            currentPath.strokeColor = color;
            currentPath.strokeWidth = currentSettings.size;
            currentPath.strokeCap = 'round';
        }

    isDrawing = true;
}; //end mouseDown()

mouseMove = function(e) {
        if (isDrawing) {
            /*
            Alter the drawing to accomodate the new mouse coordinates. This either
            requires scaling or adding more points to the path.
            */

            x = e.pageX - $('#canvas').offset().left;
            y = e.pageY - $('#canvas').offset().top;

            if (currentSettings.shape == 'scribble' || currentSettings.pencil == 'erase')
            {
                currentPath.add(new paper.Point(x, y));
            }
            else if (currentSettings.shape == 'line')
            {
                // Remove the last point and add a new endpoint.
                currentPath.removeSegment(1);
                currentPath.add(new paper.Point(x, y));
            }
            else if (currentSettings.shape == 'rectangle' ||
        currentSettings.shape == 'oval')
            {
                // Rather that scaling the shape, just delete it and make a new one.
                currentPath.remove();
                var rect = new paper.Rectangle(startPoint, new paper.Point(x, y));
                if (currentSettings.shape == 'rectangle') {
                    currentPath = new paper.Path.Rectangle(rect);
                }
                else {
                    currentPath = new paper.Path.Ellipse(rect);
                }
                var color = getColor();
                currentPath.strokeColor = color;
                currentPath.strokeWidth = currentSettings.size;
                currentPath.strokeCap = 'round';
                paper.view.draw();
            }
            else if (currentSettings.shape == 'heart')
            {
                var p = new paper.Path(HEART_STRING);
                p.fillColor = color;
                p.strokeColor = color;
                p.position = startPoint;
                currentPath.scale(1/previousScale, startPoint);
                previousScale = Math.min(
                       Math.abs(startPoint.x-x),
                      Math.abs(startPoint.y-y)
                       );
                previousScale += 0.00001;
                previousScale *= 1;
                currentPath.scale(previousScale, startPoint);
            }
        } //end IF (isDrawing)
}; //end mouseMove()

mouseUp = function(e) {

    /*DEBUG
      console.log('PAINT: mouseUp');
    */

        if (isDrawing) {
            if (currentSettings.shape == 'scribble' && currentSettings.pencil != 'erase')
            {
                /*
                Smooth the drawing.
                This value can be changed to achieve different effects.
                */
                currentPath.simplify(SMOOTH_AMOUNT);
            }

            // Add the path to our undo stack.
            historyStack.push(currentPath);
            //currentPath = null; //NOTE: why did AKSHAY have this?????
        }
        // Force a repaint.
        paper.view.draw();
        isDrawing = false;
}; //end mouseUp()

clear = function() {
    // Get rid of everything, and reset the undo stack.
    paper.project.activeLayer.removeChildren();
    paper.view.draw();
    historyStack = [];
}; //end clear()

undo = function() {
    // Undo the last draw/erase operation by deleting it.
    var lastOperation = historyStack.pop();
    if (lastOperation)
    {
        lastOperation.remove();
    }
    paper.view.draw();
};    //end undo()

select = function(e) {
    //user selected a new color/shape/size/pencil setting button
    //use the new value to update currentSettings
    //change the heading button image to the image from the selected button
    var name  = $(e.target).attr('name');
    var value = $(e.target).attr('value');
    currentSettings[name] = value;
    // e.target is a .drop-content img. insert its SRC into the img of the parent (.drop-button) of the parent (.drop-content) of e.target
    $(e.target.parentNode.parentNode.children[0]).attr('src', $(e.target).attr('src'));

    //set custom cursor if ERASE, else restore regular cursor
    if (name == 'pencil') {

        console.log('PAINT: changing cursor: name is ' + name + ' value is '  + value);

        if (value == 'erase') $('#canvas').css('cursor', 'no-drop');
        else                  $('#canvas').css('cursor', 'crosshair');
    };


}; //end SELECT()

function showOpenMenu() {
  // Navigate to the "Open" menu.

     var r = confirm("Save current drawing?\nClick 'OK' to save, 'Cancel' to delete current drawing");
     if (r) saveFile();
     window.location = ("looma-paint-openfile.php");
}

function back() {window.location = 'index.php';}

function saveFile() {
  /*
  Save the file in localStorage.
  Counter is incremented to ensure each file gets a unique id.
  Return the file's id.
  */
    var counter = parseInt(localStorage.getItem(COUNTER));
    localStorage.setItem(
    "LOOMA_" + (counter + 1).toString(),
    paper.project.exportSVG({
      asString: true
    })
  );
    localStorage.setItem(COUNTER, (counter + 1).toString());
    LOOMA.notice('notice', 5);  //shows a hidden div with id='notice' for 5 seconds
  return "LOOMA_" + (counter + 1).toString();
}

function openFile(fileName) {
  /*
  Actually open a file by name/id.
  Before loading it, clear everything.
  If the file doesn't exist, it clears the project but doesn't load anything.
  */
    paper.project.clear();
    historyStack = [];
    paper.project.importSVG(localStorage.getItem(fileName));
    paper.view.draw();
}

function deleteFile(fileName) {
  /*
  Remove a file from localStorage.
  Not used, but included to offer a full "API".
  */
    localStorage.removeItem(fileName);
}
