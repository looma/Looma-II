/*
 * Name: Vikram
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 08
Revision: Looma 2.0.0

filename: looma-calculator.js
Description:
 */

'use strict';

var readout = document.getElementById('readout');
var Accumulate = 0;
var FlagNewNum = false;
var PendingOp = "";

function NumPressed (Num) {

    if (FlagNewNum) {
        readout.value  = Num;
        FlagNewNum = false;
       }

    else {
        if
        (readout.value == "0")
        readout.value = Num;
        else
        readout.value += Num;
       }
}

function Operation (Op) {

var Readout = readout.value;
    if (FlagNewNum && PendingOp != "=");
    else{
        FlagNewNum = true;
        if ( '+' == PendingOp )
        Accumulate += parseFloat(Readout);
        else if ( '-' == PendingOp )
        Accumulate -= parseFloat(Readout);
        else if ( '/' == PendingOp )
        Accumulate /= parseFloat(Readout);
        else if ( '*' == PendingOp )
        Accumulate *= parseFloat(Readout);
    else
        Accumulate = parseFloat(Readout);
        readout.value = Accumulate;
        PendingOp = Op;
   }
}

function Decimal () {
    var curReadOut = readout.value;
    if (FlagNewNum) {
        curReadOut = "0.";
        FlagNewNum = false;
       }
    else{
        if (curReadOut.indexOf(".") == -1)
        curReadOut += ".";
       }
readout.value = curReadOut;
}
function ClearEntry () {
readout.value = "0";
FlagNewNum = true;
}
function Clear () {

        Accumulate = 0;
    PendingOp = "";
ClearEntry();
}

function Neg () {

    readout.value = parseFloat(readout.value) * -1;
}
function Percent () {

readout.value = (parseFloat(readout.value) / 100) * parseFloat(Accumulate);
}
