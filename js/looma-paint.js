/* LOOMA WHITEBOARD
 * VillageTech Solutions     www.villagetechsolutions.org
 * Version 3.0
 * programmed Summer 2014, Winter 2015, Summer 2015, Fal 2015
 * by Audrey Flower, John D Wilson, Akshay Srivatsan, Skip
 * Filename looma-paint.js
 * Companion files: looma-paint.php, looma-paint.css, looma-paint-openfile.html
 * Libraries used: paper-full.js
 */


/******************************************************
 suggested changes for future version
 1. Use FILECOMMANDS, e.g. add NEW command and use SAVE, DELETE, etc buttons
 
 2. Permanent SAVE
 savePaint and openPaint functions which call looma-database-utilities.php SAVE, openBy ID, etc
 save the SVG.asSTring in mondo [date, author, sag, dn?]
 
 3. Policies for SAVE (??)
 limit number per author
 only author or admin can erase?
 anyone can open anyone else’s pictures
 how to show all previews on OPEN? Need SEARCH before OPEN like in FILECOMMANDS?
 
 3a.  - should Paint Pictures be activities?
 
 4. show Looma toolbar and fullscreen button?
 4a. move PAINT toolbar to Looma std location?
 
 5. Only ask to SAVE if changes have been made
 5a. Ask to SAVE when leaving page
 ******************************************************/


"use strict";

var canvas;

var isDrawing = false;

var isDirty = false;            // true if the drawing has unsaved changes since last save/open/restore

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
//     legal values for 'shape': 'scribble', 'line', 'rectangle', 'oval', 'heart', 'arrow', 'star', 'diamond'
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

var DRAFT_KEY = "LOOMA_DRAFT";  // localStorage key for the auto-restored work-in-progress

// Note: this key intentionally does NOT start with "LOOMA_" so it is excluded
// from the saved-drawing thumbnail list in looma-paint-openfile.js.
var BACKGROUND_KEY = "loomaPaintBackground";

var navigationAllowed = false;  // bypass flag for the toolbar click interceptor

window.onload = function () {
    
    // Initialize all the elements, and set up paper.js to use the canvas.
    canvas = document.getElementById("canvas");
    paper.setup(canvas);
    
    //canvasWidth = canvas.width;
    //canvasHeight = canvas.height;
    
    canvas.onmousedown = mouseDown;
    canvas.onmousemove = mouseMove;
    // End the stroke no matter where the user releases — outside the canvas,
    // outside the browser, or even if they Cmd+Tab away. Otherwise isDrawing
    // stays true and a phantom line follows the cursor when it re-enters.
    function endStroke(e) {
        console.log('PAINT: endStroke fired, isDrawing was', isDrawing);
        mouseUp(e);
    }
    document.addEventListener('mouseup',    endStroke);  // release anywhere on page
    document.addEventListener('mouseleave', endStroke);  // cursor left the viewport
    window.addEventListener(  'blur',       endStroke);  // window lost focus
    
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
    // backElement.onclick = back;
    
    // If this is the first run, set the counter to 0.
    // If not, don't change anything.
    localStorage.setItem(COUNTER, localStorage.getItem(COUNTER) || "0");
    
    // if we are being called from looma-paint-openfile, then the # hash value contains the filename to open
    if (location.hash != "") {
        openFile(location.hash.substring(1));
    } else {
        // otherwise, restore the auto-saved draft from the previous visit (if any)
        restoreDraft();
    }

    // Restore the user's last chosen background (lined, grid, clock, etc.)
    setBackground(localStorage.getItem(BACKGROUND_KEY) || 'blank');

    // Wire up the Paper dropdown — each <p data-bg="..."> swaps the canvas background.
    $('#background .drop-content p').click(function () {
        setBackground($(this).data('bg'));
    });

    // Intercept clicks on Looma's main toolbar buttons (Home, Library, Dictionary, ...)
    // so that if the drawing has unsaved changes we can prompt "Save current drawing?"
    // Yes -> stash to DRAFT_KEY so the next visit restores it.
    // No  -> wipe any old draft so the next visit opens blank.
    // Uses the capture phase so we run BEFORE the inline onclick="parent.location.href=..."
    // attribute on each toolbar button gets a chance to navigate away.
    document.addEventListener('click', function(e) {
        if (navigationAllowed || !isDirty) return;
        var btn = e.target.closest ? e.target.closest('.toolbar-button') : null;
        if (!btn) return;
        // If the canvas is now empty (user cleared/undone everything), don't ask —
        // wipe any stale draft so next visit opens blank, and let navigation proceed.
        if (paper.project.activeLayer.children.length === 0) {
            clearDraft();
            isDirty = false;
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        confirmWithXlat(
            "Save current drawing?", "अहिलेको चित्र बचत गर्नुहोस्?",
            function () {            // YES — keep the work-in-progress
                saveDraft();
                isDirty = false;
                navigationAllowed = true;
                btn.click();         // re-fire the click; our interceptor will let it through now
            },
            function () {            // NO  — discard, next visit will be blank
                clearDraft();
                isDirty = false;
                navigationAllowed = true;
                btn.click();
            }
        );
    }, true);

    // Keep the drawing proportional when the browser window resizes.
    // Paper.js draws in canvas-buffer pixels — if the canvas's CSS size
    // changes but the buffer doesn't, drawings get stretched or cropped.
    // On each resize we (1) compute a uniform scale factor using the
    // smaller of the width/height ratios so nothing distorts, (2) scale
    // every existing item by that factor around the origin so points
    // (x, y) become (x*scale, y*scale), and (3) resize paper.js's view
    // to match the new canvas dimensions and redraw.
    var lastCanvasWidth  = canvas.clientWidth;
    var lastCanvasHeight = canvas.clientHeight;

    $(window).on('resize', function () {
        var newWidth  = canvas.clientWidth;
        var newHeight = canvas.clientHeight;
        if (newWidth <= 0 || newHeight <= 0) return;
        if (newWidth === lastCanvasWidth && newHeight === lastCanvasHeight) return;

        // Step 1: uniform base scale from the canvas-dimension change
        var scale = Math.min(newWidth / lastCanvasWidth,
                             newHeight / lastCanvasHeight);
        if (scale > 0 && scale !== 1 && isFinite(scale)) {
            paper.project.activeLayer.scale(scale, new paper.Point(0, 0));
        }

        paper.view.viewSize = new paper.Size(newWidth, newHeight);
        lastCanvasWidth  = newWidth;
        lastCanvasHeight = newHeight;

        // Step 2: safety net — if any part of the drawing still extends
        // past the new canvas edges (can happen if a stroke was near the
        // old edge, or if repeated resizes accumulate rounding error),
        // scale everything down further so the whole drawing stays
        // visible. Uniform scale keeps the drawing's aspect ratio.
        var bounds = paper.project.activeLayer.bounds;
        if (bounds && bounds.width > 0 && bounds.height > 0) {
            var fit = 1;
            if (bounds.right  > newWidth)  fit = Math.min(fit, newWidth  / bounds.right);
            if (bounds.bottom > newHeight) fit = Math.min(fit, newHeight / bounds.bottom);
            if (fit > 0 && fit < 1) {
                paper.project.activeLayer.scale(fit, new paper.Point(0, 0));
            }
        }

        paper.view.draw();
    });

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

// Build a diamond (rhombus) that fits the given bounding rectangle.
// Vertices at the midpoints of each side, so the diamond stretches to
// match the aspect ratio of the drag rectangle — same behavior as
// rectangle/oval.
function makeDiamond(rect) {
    var midX = (rect.left + rect.right)  / 2;
    var midY = (rect.top  + rect.bottom) / 2;
    var path = new paper.Path();
    path.add(new paper.Point(midX,        rect.top));       // top
    path.add(new paper.Point(rect.right,  midY));           // right
    path.add(new paper.Point(midX,        rect.bottom));    // bottom
    path.add(new paper.Point(rect.left,   midY));           // left
    path.closed = true;
    return path;
}

// Build a 5-pointed star centered in the given bounding rectangle.
// Uses the smaller of the rectangle's width/height to keep the star's
// radial symmetry (a stretched star looks strange in a way that a
// stretched diamond does not). Inner radius = 40% of outer, which is
// the standard proportion for a clean 5-point star.
function makeStar(rect) {
    var center = new paper.Point((rect.left + rect.right)  / 2,
                                 (rect.top  + rect.bottom) / 2);
    var outerRadius = Math.min(Math.abs(rect.width), Math.abs(rect.height)) / 2;
    if (outerRadius < 1) outerRadius = 1;   // avoid zero-radius errors during initial mousedown
    var innerRadius = outerRadius * 0.4;
    return new paper.Path.Star(center, 5, outerRadius, innerRadius);
}

// Build an arrow from `start` to `end` as a paper.Group containing the
// line shaft plus a filled triangular arrowhead at the tip. Length is the
// distance between the two points; direction is the line angle; size is
// the stroke width (which also scales the arrowhead proportionally).
function makeArrow(start, end, color, strokeWidth) {
    var group = new paper.Group();
    var dx = end.x - start.x;
    var dy = end.y - start.y;
    var len = Math.sqrt(dx * dx + dy * dy);

    if (len < 0.001) {
        // Zero-length: empty group; mousemove will rebuild as soon as it has
        // an endpoint different from the start point.
        return group;
    }

    // Unit vector along the arrow's direction
    var ux = dx / len;
    var uy = dy / len;

    // Arrowhead size scales with stroke width but has a sane minimum so the
    // head is still visible for thin strokes.
    var headLen   = Math.max(15, strokeWidth * 3);
    var headWidth = Math.max(10, strokeWidth * 2);

    // Base of the arrowhead (where the shaft ends and the triangle begins)
    var base = new paper.Point(end.x - ux * headLen, end.y - uy * headLen);

    // Shaft: straight line from start to base of head
    var shaft = new paper.Path.Line(start, base);
    shaft.strokeColor = color;
    shaft.strokeWidth = strokeWidth;
    shaft.strokeCap   = 'round';
    group.addChild(shaft);

    // Arrowhead: filled triangle with tip at `end` and base perpendicular
    // to the arrow's direction
    var head = new paper.Path();
    head.add(end);
    head.add(new paper.Point(base.x - uy * headWidth, base.y + ux * headWidth));
    head.add(new paper.Point(base.x + uy * headWidth, base.y - ux * headWidth));
    head.closed = true;
    head.fillColor   = color;
    head.strokeColor = color;
    head.strokeJoin  = 'round';
    group.addChild(head);

    return group;
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
    else if (currentSettings.shape == 'rectangle' ||
             currentSettings.shape == 'oval'      ||
             currentSettings.shape == 'diamond'   ||
             currentSettings.shape == 'star')
    {
        var rect = new paper.Rectangle(new paper.Point(x, y), new paper.Point(x,y));
        if      (currentSettings.shape == 'rectangle') currentPath = new paper.Path.Rectangle(rect);
        else if (currentSettings.shape == 'oval')      currentPath = new paper.Path.Ellipse(rect);
        else if (currentSettings.shape == 'diamond')   currentPath = makeDiamond(rect);
        else                                            currentPath = makeStar(rect);
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
    else if (currentSettings.shape == 'arrow')
    {
        // Start as a zero-length arrow; mouseMove rebuilds it as the user
        // drags to set length and direction.
        currentPath = makeArrow(startPoint, startPoint, color, currentSettings.size);
    }

    // Apply common stroke styling. Skip this for arrow — makeArrow already
    // styles the shaft and filled arrowhead, and forcing strokeColor here
    // on the Group would clobber the arrowhead's appearance.
    if (currentPath && currentSettings.shape !== 'arrow') {

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
                 currentSettings.shape == 'oval'      ||
                 currentSettings.shape == 'diamond'   ||
                 currentSettings.shape == 'star')
        {
            // Rather that scaling the shape, just delete it and make a new one.
            currentPath.remove();
            var rect = new paper.Rectangle(startPoint, new paper.Point(x, y));
            if      (currentSettings.shape == 'rectangle') currentPath = new paper.Path.Rectangle(rect);
            else if (currentSettings.shape == 'oval')      currentPath = new paper.Path.Ellipse(rect);
            else if (currentSettings.shape == 'diamond')   currentPath = makeDiamond(rect);
            else                                            currentPath = makeStar(rect);
            var color = getColor();
            currentPath.strokeColor = color;
            currentPath.strokeWidth = currentSettings.size;
            currentPath.strokeCap = 'round';
            paper.view.draw();
        }
        else if (currentSettings.shape == 'heart')
        {
            // Resize the heart by scaling currentPath in place.
            // Undo the previous scale, recompute from drag distance, then re-scale.
            currentPath.scale(1/previousScale, startPoint);
            previousScale = Math.min(
                Math.abs(startPoint.x-x),
                Math.abs(startPoint.y-y)
            );
            previousScale += 0.00001;
            currentPath.scale(previousScale, startPoint);
        }
        else if (currentSettings.shape == 'arrow')
        {
            // Rebuild the arrow each move so the user can set both length
            // and direction by dragging from the starting click point.
            currentPath.remove();
            currentPath = makeArrow(startPoint,
                                    new paper.Point(x, y),
                                    getColor(),
                                    currentSettings.size);
            paper.view.draw();
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
        isDirty = true;
    }
    // Force a repaint.
    paper.view.draw();
    isDrawing = false;
}; //end mouseUp()

clear = function() {
    // Get rid of everything, and reset the undo stack.
    var hadContent = paper.project.activeLayer.children.length > 0;
    paper.project.activeLayer.removeChildren();
    paper.view.draw();
    historyStack = [];
    if (hadContent) isDirty = true;
}; //end clear()

undo = function() {
    // Undo the last draw/erase operation by deleting it.
    var lastOperation = historyStack.pop();
    if (lastOperation)
    {
        lastOperation.remove();
        isDirty = true;
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
    // e.target is a .drop-content img. Update the dropdown button's face
    // to reflect the selection — EXCEPT for size and shape, whose buttons
    // use fixed category icons (linetiknessicon / shapesicon) that should
    // stay put regardless of which option the user picks.
    if (name !== 'size' && name !== 'shape') {
        $(e.target.parentNode.parentNode.children[0]).attr('src', $(e.target).attr('src'));
    }
    
    //set custom cursor if ERASE, else restore regular cursor
    if (name == 'pencil') {
        
        console.log('PAINT: changing cursor: name is ' + name + ' value is '  + value);
        
        if (value == 'erase') $('#canvas').css('cursor', 'no-drop');
        else                  $('#canvas').css('cursor', 'crosshair');
    };
    
    
}; //end SELECT()

function showOpenMenu() {
    // Navigate to the "Open" menu.

    // If nothing has changed since the last save/restore/load, the current
    // canvas already matches what's stored — no point asking.
    if (!isDirty) {
        window.location = "looma-paint-openfile.php";
        return;
    }
    // If the canvas is empty (everything cleared/undone), don't bother asking
    // either — clear any stale draft so next visit is also blank.
    if (paper.project.activeLayer.children.length === 0) {
        clearDraft();
        isDirty = false;
        window.location = "looma-paint-openfile.php";
        return;
    }

    confirmWithXlat("Save current drawing?", "अहिलेको चित्र बचत गर्नुहोस्?",
        function (){saveFile();window.location = ("looma-paint-openfile.php");},
        function (){window.location = ("looma-paint-openfile.php");}
    );
    //window.location = ("looma-paint-openfile.php");
}

function back() {  window.history.back();}   //currently goes to index.php, the homepage. should this just be history.back()?

function savePaint() {
    /*
    Save the file in mongoDB. tagged with size, author, date. 'svg' field contains a string representing the svg
    Counter is incremented to ensure each file gets a unique id.
    Return the file's id.
    */
    savefile('', paint_collection, 'paint', paper.project.exportSVG({asString: true}), "false");
    LOOMA.alert('Drawing saved', 10);
} //savePaint()

function saveFile() {  //original  version. saves files to user's localStorage. not permanent or accessible by others
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
    LOOMA.alert('Drawing saved',5,true);  //shows a hidden div with id='notice' for 5 seconds
    isDirty = false;
    return "LOOMA_" + (counter + 1).toString();
}

function saveDraft() {
    // Auto-save the current canvas to a fixed slot so it can be restored next visit.
    localStorage.setItem(DRAFT_KEY, paper.project.exportSVG({asString: true}));
}

function clearDraft() {
    // Remove any auto-saved draft so the canvas opens blank next visit.
    localStorage.removeItem(DRAFT_KEY);
}

function restoreDraft() {
    // If a draft was stashed last visit, load it back onto the canvas.
    var svg = localStorage.getItem(DRAFT_KEY);
    if (svg) {
        paper.project.importSVG(svg);
        paper.view.draw();
    }
}

// Wrapper around LOOMA.confirm that ALSO shows a small yellow translation
// box in the upper-right corner of the screen for as long as the popup is
// open. Mimics the .xlat hover tooltip used by keyword(), but visible
// continuously while the popup is shown. Whichever language is currently
// active, the OTHER language appears in the corner — so an English user
// sees the Nepali, a Nepali user sees the English.
function confirmWithXlat(english, native, onYes, onNo) {
    var language = LOOMA.readStore('language', 'cookie');
    var tipText  = (language === "english") ? native : english;
    var $tip     = $('<div id="paint-xlat-tooltip"></div>').text(tipText).appendTo(document.body);

    function teardown() { $tip.remove(); }

    LOOMA.confirm(
        LOOMA.translatableSpans(english, native),
        function () { teardown(); onYes(); },
        function () { teardown(); onNo(); }
    );
}

// ---- Paper / background images -------------------------------------------
// Educational backgrounds rendered as inline SVG data URLs and applied via
// CSS background-image on the canvas element. Paper.js draws on top with a
// transparent layer, so the background shows through. Saving/exporting the
// drawing does NOT include the background — it is purely a visual aid.
var BACKGROUNDS = (function () {
    function svgUrl(svg) {
        return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
    }

    var i, x, y;

    // Horizontal ruled lines (writing practice)
    var lined =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40">' +
        '<line x1="0" y1="39" x2="100" y2="39" stroke="#a3d3f7" stroke-width="1"/>' +
        '</svg>';

    // Square grid (graph paper)
    var grid =
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">' +
        '<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c8d8e8" stroke-width="1"/>' +
        '</svg>';

    // Coordinate plane: faint grid, heavier x/y axes, arrowheads, labels -9..9
    var coord = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">';
    coord += '<g stroke="#dde8f0" stroke-width="1">';
    for (i = 40; i < 800; i += 40) {
        if (i === 400) continue;
        coord += '<line x1="' + i + '" y1="0" x2="' + i + '" y2="800"/>';
        coord += '<line x1="0" y1="' + i + '" x2="800" y2="' + i + '"/>';
    }
    coord += '</g>';
    coord += '<g stroke="#666" stroke-width="2">';
    coord += '<line x1="0" y1="400" x2="800" y2="400"/>';
    coord += '<line x1="400" y1="0" x2="400" y2="800"/>';
    coord += '</g>';
    coord += '<polygon points="800,400 780,392 780,408" fill="#666"/>';
    coord += '<polygon points="400,0 392,20 408,20" fill="#666"/>';
    coord += '<g font-family="sans-serif" font-size="14" fill="#666" text-anchor="middle">';
    for (i = -9; i <= 9; i++) {
        if (i === 0) continue;
        coord += '<text x="' + (400 + i * 40) + '" y="418">' + i + '</text>';
        coord += '<text x="386" y="' + (400 - i * 40 + 5) + '">' + i + '</text>';
    }
    coord += '<text x="386" y="418">0</text>';
    coord += '</g></svg>';

    // Music staff: 5 lines as a repeating tile so multiple staves stack vertically
    var music = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">';
    for (i = 0; i < 5; i++) {
        y = 15 + i * 12;
        music += '<line x1="0" y1="' + y + '" x2="400" y2="' + y + '" stroke="#666" stroke-width="1"/>';
    }
    music += '</svg>';

    // Tens frame: 2 rows × 5 columns of empty squares (early math counting aid)
    var tens = '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200" viewBox="0 0 500 200">';
    tens += '<g fill="none" stroke="#666" stroke-width="2">';
    for (i = 0; i <= 5; i++) tens += '<line x1="' + (i * 100) + '" y1="0" x2="' + (i * 100) + '" y2="200"/>';
    for (i = 0; i <= 2; i++) tens += '<line x1="0" y1="' + (i * 100) + '" x2="500" y2="' + (i * 100) + '"/>';
    tens += '</g></svg>';

    // Number line 0..10 with arrows on both ends
    var nl = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="120" viewBox="0 0 1000 120">';
    nl += '<line x1="40" y1="60" x2="960" y2="60" stroke="#888" stroke-width="2"/>';
    nl += '<polygon points="40,60 60,52 60,68" fill="#888"/>';
    nl += '<polygon points="960,60 940,52 940,68" fill="#888"/>';
    nl += '<g font-family="sans-serif" font-size="22" fill="#555" text-anchor="middle">';
    for (i = 0; i <= 10; i++) {
        x = 80 + i * 84;
        nl += '<line x1="' + x + '" y1="50" x2="' + x + '" y2="70" stroke="#888" stroke-width="2"/>';
        nl += '<text x="' + x + '" y="95">' + i + '</text>';
    }
    nl += '</g></svg>';

    // Protractor: semicircle 0-180° with tick marks every 10° and number
    // labels every 30°. Anchored to the bottom of the canvas.
    var protractor = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320">';
    protractor += '<path d="M 50 300 A 250 250 0 0 1 550 300" fill="none" stroke="#888" stroke-width="2"/>';
    protractor += '<line x1="50" y1="300" x2="550" y2="300" stroke="#888" stroke-width="2"/>';
    protractor += '<g stroke="#888" stroke-width="1">';
    for (i = 0; i <= 180; i += 10) {
        var rad = (180 - i) * Math.PI / 180;
        var inner = (i % 30 === 0) ? 225 : 235;
        var px1 = (300 + 250 * Math.cos(rad)).toFixed(0);
        var py1 = (300 - 250 * Math.sin(rad)).toFixed(0);
        var px2 = (300 + inner * Math.cos(rad)).toFixed(0);
        var py2 = (300 - inner * Math.sin(rad)).toFixed(0);
        protractor += '<line x1="' + px1 + '" y1="' + py1 + '" x2="' + px2 + '" y2="' + py2 + '"/>';
    }
    protractor += '</g>';
    protractor += '<g font-family="sans-serif" font-size="14" fill="#555" text-anchor="middle">';
    for (i = 0; i <= 180; i += 30) {
        var rr = (180 - i) * Math.PI / 180;
        var lx = (300 + 210 * Math.cos(rr)).toFixed(0);
        var ly = (305 - 210 * Math.sin(rr)).toFixed(0);
        protractor += '<text x="' + lx + '" y="' + ly + '">' + i + '</text>';
    }
    protractor += '</g><circle cx="300" cy="300" r="4" fill="#555"/></svg>';

    // Ruler: 0..20 cm with major cm ticks, half-cm, and mm subdivisions
    var ruler = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="80" viewBox="0 0 1000 80">';
    ruler += '<rect x="40" y="20" width="920" height="40" fill="none" stroke="#888" stroke-width="2"/>';
    ruler += '<g stroke="#888" stroke-width="1">';
    for (i = 0; i <= 200; i++) {
        var rx = (40 + i * 4.6).toFixed(2);
        var len;
        if      (i % 10 === 0) len = 25;
        else if (i % 5  === 0) len = 15;
        else                   len = 7;
        ruler += '<line x1="' + rx + '" y1="20" x2="' + rx + '" y2="' + (20 + len) + '"/>';
    }
    ruler += '</g>';
    ruler += '<g font-family="sans-serif" font-size="12" fill="#555" text-anchor="middle">';
    for (i = 0; i <= 20; i++) {
        var cx = 40 + i * 46;
        ruler += '<text x="' + cx + '" y="72">' + i + '</text>';
    }
    ruler += '</g></svg>';

    // Each entry specifies image + how to position it. Repeating patterns
    // tile from top-left; centered objects use contain+center; measurement
    // tools (protractor/ruler) anchor at the bottom of the canvas.
    return {
        blank:      { image: 'none' },
        lined:      { image: svgUrl(lined),      repeat: 'repeat',    size: 'auto',    position: 'top left' },
        grid:       { image: svgUrl(grid),       repeat: 'repeat',    size: 'auto',    position: 'top left' },
        coord:      { image: svgUrl(coord),      repeat: 'no-repeat', size: 'contain', position: 'center' },
        music:      { image: svgUrl(music),      repeat: 'repeat',    size: 'auto',    position: 'top left' },
        tens:       { image: svgUrl(tens),       repeat: 'no-repeat', size: 'contain', position: 'center' },
        numberline: { image: svgUrl(nl),         repeat: 'no-repeat', size: 'contain', position: 'center' },
        protractor: { image: svgUrl(protractor), repeat: 'no-repeat', size: 'contain', position: 'bottom center' },
        ruler:      { image: svgUrl(ruler),      repeat: 'no-repeat', size: 'contain', position: 'bottom center' },
        // Uses the shipped map image directly rather than an inline SVG,
        // so any accuracy work happens by swapping out the .jpg file.
        nepal:      { image: 'url("images/map_outline_nepal.jpg")', repeat: 'no-repeat', size: 'contain', position: 'center' }
    };
})();

function setBackground(name) {
    if (!BACKGROUNDS.hasOwnProperty(name)) name = 'blank';
    var bg = BACKGROUNDS[name];
    canvas.style.backgroundImage    = bg.image;
    canvas.style.backgroundRepeat   = bg.repeat   || 'no-repeat';
    canvas.style.backgroundSize     = bg.size     || 'auto';
    canvas.style.backgroundPosition = bg.position || 'center';
    localStorage.setItem(BACKGROUND_KEY, name);
}

function openPaint(fileID) {
    /*
    Actually open a file by name/id.
    Before loading it, clear everything.
    If the file doesn't exist, it clears the project but doesn't load anything.
    */
    paper.project.clear();
    historyStack = [];
    openfile('fileiD', paint_collection, 'paint', paper.project.exportSVG({asString: true}), "false");
    
    paper.project.importSVG(localStorage.getItem(fileName));
    paper.view.draw();
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
    isDirty = false;
}

function deleteFile(fileName) {
    /*
    Remove a file from localStorage.
    Not used, but included to offer a full "API".
    */
    localStorage.removeItem(fileName);
}

$(document).ready(function() {
    toolbar_button_activate("paint");
});