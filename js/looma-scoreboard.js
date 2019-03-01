"use strict";

var theHeights = {};
var theLefts = {};
function increaseBigScore(numToWin, teamNum) // moves big scoreboard marker forward
{
    var scoreType = getScoring();
    if (scoreType.substring(0, 6) == "rocket")
    {
        verticalScore(numToWin, teamNum);
    }
    else
    {
        horizontalScore(numToWin, teamNum);
    }
}

function getScoring()
{
    var theUrl = window.location.href;
    var scoreLoc = theUrl.indexOf("scoring=");
    var scoreTy = theUrl.substring(scoreLoc + 8);
    return scoreTy;
}

function getTheHeights()
{
    return theHeights;
}
function getTheLefts()
{
    return theLefts;
}
function verticalScore(numToWin, teamNum)
{
    var endT = parseFloat(jQuery('#high' + teamNum).css('top'));
    var markerT = parseFloat(jQuery('#vert-marker' + teamNum).css('top'));
    var startT = parseFloat(jQuery('#low' + teamNum).css('top'));
    var distanceH = (startT - endT) / numToWin;
    var newHeight = markerT - distanceH;
    theHeights[teamNum] = newHeight;
    jQuery("#vert-marker" + teamNum).animate({top: newHeight});
}

function horizontalScore(numToWin, teamNum)
{
    var endL = parseFloat(jQuery('#wide-right' + teamNum).css('left'));
    var markerL = parseFloat(jQuery('#hori-marker' + teamNum).css('left'));
    var startL = parseFloat(jQuery('#wide-left' + teamNum).css('left'));
    var distanceW = (endL - startL) / numToWin;
    var newLeft = markerL + distanceW;
    theLefts[teamNum] = newLeft;
    jQuery("#hori-marker" + teamNum).animate({left: newLeft});
}
