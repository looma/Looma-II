/*
Name: Vikram
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 08
Revision: Looma 2.0.0

filename: looma-calculator.js
Description:
 */

'use strict';

var display = document.getElementById('display');
var readout = "0";  //current value [string] being displayed
var Accumulate = 0;
var FlagNewNum = true;
var PendingOp = "";
var convert = {"0":"०", "1":"१", "2":"२", "3":"३", "4":"४",
               "5":"५", "6":"६", "7":"७", "8":"८", "9":"९",
               "-":"-", ".":"."};

function show(str) { //param is a string
    if (LOOMA.readStore('language', 'local') == 'english')
    {    display.value = str; }
    else  //translate before displaying
    {   var trans = "";
        for (var i=0; i < str.length; i++) trans = trans + convert[str.charAt(i)];
        display.value = trans;
    };
    readout = str;
};  //end SHOW()

function NumPressed (digit) {
    if (FlagNewNum) {
        show(digit);
        FlagNewNum = false;
       }
    else {
        if (readout == "0") {show(digit);}
        else {show( readout + digit);};
      };
};  // end NumPressed()

function calculate(acc, num, op) {  //ACC is a number, NUM is a string, OP is in {'+', '-', '*', '/', '='}
                                    // returns a number = acc OP num
         if (op == '+') {return (acc + Number(num));}
    else if (op == '-') {return (acc - Number(num));}
    else if (op == '*') {return (acc * Number(num));}
    else if (op == '/') {return (acc / Number(num));}
    else return (Number(num)); //if op == ""
};  //end CALCULATE()

function Operation (Op) {
    if (Op == '=') {
        if (PendingOp != "") {Accumulate = calculate (Accumulate, readout, PendingOp);}
        else                   Accumulate = readout;
        show(Accumulate.toString());                //set Accumulate to ZERO???
        PendingOp = "";
        FlagNewNum = true;
    }
    else if (FlagNewNum && PendingOp != "") {
        PendingOp = Op;
    } else {
        if (PendingOp != "") {
             Accumulate = calculate (Accumulate, readout, PendingOp);}
        else Accumulate = Number(readout);
        show(Accumulate.toString());
        PendingOp = Op;
        FlagNewNum= true;
    };
};  // end OPERATION()

function Decimal () {
    var curReadOut = readout.toString();
    if (FlagNewNum) {
        curReadOut = "0.";
        FlagNewNum = false;
       }
    else {
        if (curReadOut.indexOf(".") == -1)
        curReadOut += ".";
    };
    show(curReadOut);
}; //end DECIMAL()

function ClearEntry () {
    show("");
    readout = "0";
    FlagNewNum = true;
};

function Clear () {
    Accumulate = 0;
    PendingOp = "";
    ClearEntry();
};

function Neg () {
    var decimal = ((readout.indexOf(".") == readout.length - 1) ? "." : "");
    var temp = Number(readout) * -1;
    show(temp.toString() + decimal);
};

function Percent () {
    var temp =  100 * Number(readout);
    show(temp.toString());
};
