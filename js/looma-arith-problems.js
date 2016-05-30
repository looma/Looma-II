/*
 * Name: Joe Farnham
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Summer 2015
Revision: Looma 2.0.0

filename: looma-arithmetic.js
Description:
 */
'use strict';

var prevOp = "";
var prevClicked = "";
var num1 = 0;
var op, oper;
var problemCount = 0;
var arithClass, arithSubject;
var enterKey = 13;

function init(){

    arithSubject = LOOMA.readStore('arith-subject', 'local');
    arithClass = LOOMA.readStore('arith-grade', 'local');
    // DEBUG    console.log ('ARITH: arith-grade is ' + arithClass);

    arithClass = arithClass.substr(0, arithClass.length - 1) + ' ' + arithClass.substr(arithClass.length-1);
    document.getElementById('gradeValue').innerHTML = LOOMA.capitalize(arithClass);

    var enterButton = document.getElementById('enter');
    enterButton.addEventListener('click', checkAnswer,false);

    var resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', resetAnswer,false);

    var answerField = document.getElementById('answer');
    answerField.addEventListener('keyup',    function(e) {if (arithSubject != 'div') LOOMA.rtl(this);}, false);
    answerField.addEventListener('keypress', function(e) {if(e.keyCode == enterKey) {checkAnswer();}},false);

/*CALCULATOR initially hidden */
    document.getElementById('calculator').style.visibility = 'hidden';
    var helpButton = document.getElementById('help');
    helpButton.addEventListener('click', calculator,false);

    //calculator buttons
    var button1 = document.getElementById('1');
    button1.addEventListener('click', addToDisp,false);

    var button2 = document.getElementById('2');
    button2.addEventListener('click', addToDisp,false);

    var button3 = document.getElementById('3');
    button3.addEventListener('click', addToDisp,false);

    var button4 = document.getElementById('4');
    button4.addEventListener('click', addToDisp,false);

    var button5 = document.getElementById('5');
    button5.addEventListener('click', addToDisp,false);

    var button6 = document.getElementById('6');
    button6.addEventListener('click', addToDisp,false);

    var button7 = document.getElementById('7');
    button7.addEventListener('click', addToDisp,false);

    var button8 = document.getElementById('8');
    button8.addEventListener('click', addToDisp,false);

    var button9 = document.getElementById('9');
    button9.addEventListener('click', addToDisp,false);

    var button0 = document.getElementById('0');
    button0.addEventListener('click', addToDisp,false);

    var buttonDot = document.getElementById('.');
    buttonDot.addEventListener('click', addToDisp,false);

    var buttonC = document.getElementById('clr');
    buttonC.addEventListener('click', clearDisp,false);

    var buttonPM = document.getElementById('+-');
    buttonPM.addEventListener('click', addPM,false);

    var buttonPlus = document.getElementById('+');
    buttonPlus.addEventListener('click', opNums,false);

    var buttonMinus = document.getElementById('-');
    buttonMinus.addEventListener('click', opNums,false);

    var buttonTimes = document.getElementById('*');
    buttonTimes.addEventListener('click', opNums,false);

    var buttonDivide = document.getElementById('/');
    buttonDivide.addEventListener('click', opNums,false);

    var buttonEquals = document.getElementById('=');
    buttonEquals.addEventListener('click', equals,false);
//end calculator buttons

    var subjectName;
    switch (arithSubject) {
        case 'sub': subjectName = "subtraction"; break;
        case 'add': subjectName = "addition"; break;
        case 'mult': subjectName = "multiplication"; break;
        case 'div': subjectName = "division"; break;
    };

    document.getElementById('topicValue').innerHTML = LOOMA.capitalize(subjectName);
    document.getElementById('countValue').innerHTML = problemCount;

    if(arithSubject == 'div'){
        document.getElementById('division-symbol').style.visibility = 'visible';
        document.getElementById('answerLine').style.visibility = 'hidden';
        document.getElementById('operation').style.visibility = 'hidden';
        document.getElementById('num1').className = 'div';
        document.getElementById('num2').className = 'div';

    }
    else{
        document.getElementById('division-symbol').style.visibility = 'hidden';
        document.getElementById('answerLine').style.visibility = 'visible';
        op = document.getElementById('operation');
        if(arithSubject == 'add'){
            op.innerHTML = '+';
        }
        else if(arithSubject == 'sub'){
            op.innerHTML = '-';
        }
        else{
            op.innerHTML = '*';
        }
    }

    nextGenProb();
}; //end INIT()

function nextGenProb(){
    var num;
    var count = document.getElementById('countValue');
    var randNum1, randNum2;

    if(document.getElementById('message-correct').style.visibility == 'visible'){
        problemCount += 1;
        count.innerHTML = problemCount;
    }
    document.getElementById('message-correct').style.visibility = 'hidden';
    document.getElementById('message-wrong').style.visibility = 'hidden';

    document.getElementById('calculator').style.visibility = 'hidden';

    var num1 = document.getElementById('num1');
    var num2 = document.getElementById('num2');

    var subject = arithSubject;

    if(arithClass == 'class1'){
        if(subject != 'mult'){
            randNum1 = (Math.floor(19 * Math.random()) + 1);
            randNum2 = (Math.floor(19 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(5 * Math.random()) + 1);
            randNum2 = (Math.floor(5 * Math.random()) + 1);
        }
    } //end of CLASS 1
    else if(arithClass == 'class2'){
        if(subject == 'add' || subject == 'sub'){
            randNum1 = (Math.floor(999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(11 * Math.random()) + 1);
            randNum2 = (Math.floor(11 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(8 * Math.random()) + 2);
            randNum2 = randNum1 * (Math.floor(9 * Math.random()) + 1);
        }
    } //end of CLASS 2

    else if(arithClass == 'class3'){
        if(subject == 'add' || subject == 'sub'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(9999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(999 * Math.random()) + 1);
            randNum2 = (Math.floor(99 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(99 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(10 * Math.random()) + 1);
        }
    } //end of CLASS 3

    else if(arithClass == 'class4'){
        if(subject == 'add' || subject == 'sub'){
            randNum1 = (Math.floor(99999 * Math.random()) + 1);
            randNum2 = (Math.floor(99999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(99 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(9 * Math.random()) + 1);
        }
    } //end of CLASS 4

    else if(arithClass == 'class5'){
        if(subject == 'add' || subject == 'sub'){
            randNum1 = (Math.floor(99999 * Math.random()) + 1);
            randNum2 = (Math.floor(99999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(99 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(99 * Math.random()) + 1);
        }
    } //end of CLASS 5

    else if(arithClass == 'class6'){
        if(subject == 'add' || subject == 'sub'){
            randNum1 = (Math.floor(99999 * Math.random()) + 1);
            randNum2 = (Math.floor(99999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(999 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(99 * Math.random()) + 1);
        }
    } //end of CLASS 6

    else{  //CLASS 7 or higher
        if(subject == 'add' || subject == 'sub'){
            randNum1 = (Math.floor(99999 * Math.random()) + 1);
            randNum2 = (Math.floor(99999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(999 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(99 * Math.random()) + 1);
        }
    } //end of CLASS 7 or higher

    oper = document.getElementById('operation').innerHTML;
    if(oper == "+" || oper == "-" || oper == "*")
    {
        if(randNum1 < randNum2)
        {
            num = randNum2;
            randNum2 = randNum1;
            randNum1 = num;
        }
    };

    num1.innerHTML = randNum1;
    num2.innerHTML = randNum2;

    resetAnswer();
}; //end nextGenProb()

function resetAnswer(){
    var answer = document.getElementById('answer');
    answer.value = '';
    answer.focus();
};

function checkAnswer(){
    var correct, wrong;
    var num1 = Number(document.getElementById('num1').innerHTML);
    var num2 = Number(document.getElementById('num2').innerHTML);
    var answer = document.getElementById('answer').value;
    op = document.getElementById('operation').innerHTML;
    if(op == '+'){
        correct = num1 + num2;
    }
    else if(op == '-'){
        correct = num1 - num2;
    }
    else if(op == '*'){
        correct = num1 * num2;
    }
    else{
        correct = num2 / num1;
    }


    if(answer == correct){
        document.getElementById('message-wrong').style.visibility = 'hidden';
        document.getElementById('message-correct').style.visibility = 'visible';
    }
    else{  //wrong answer given
        document.getElementById('message-wrong').style.visibility = 'visible';
        document.getElementById('message-correct').style.visibility = 'hidden';
        document.getElementById('answer').value = '';
        document.getElementById('answer').focus();
    }
}


// CALCULATOR for HELP button in arithmetic problems -- need to combine this with the Looma calculator
function calculator(e){
    var calc = document.getElementById('calculator');
    if(calc.style.visibility == 'hidden'){
        calc.style.visibility = 'visible';
        document.getElementById('help').innerHTML = 'Hide';
    }
    else{
        calc.style.visibility = 'hidden';
        document.getElementById('help').innerHTML = 'Help';
    }
}

function addPM(e){
    var dVal = document.getElementById('calcDisplay').value;
    var dLen = dVal.length;
    if(dVal[0] === '-'){
        dVal = dVal.substring(1,dLen);
        document.getElementById('calcDisplay').value = dVal;
    }
    else{
        document.getElementById('calcDisplay').value = '-' + dVal;
    }
}

function equals(e){
    var answer = 0;
    var num2 = Number(document.getElementById('calcDisplay').value);
    if(prevOp.length != 0){
        if(prevOp == '+'){
            answer = num1 + num2;
        }
        else if(prevOp == '-'){
            answer = num1 - num2;
        }
        else if(prevOp == '*'){
            answer = num1 * num2;
        }
        else{
            answer = num1 / num2;
        }
        document.getElementById('calcDisplay').value = answer;
        num1 = answer;
    }
    //meaning they pressed equals consecutive times
    else{
        clearDisp();
    }

    prevOp = "";
    prevClicked = "=";
}

function opNums(e){
    var answer = 0;
    if(prevOp.length == 0){
        if(e.target.innerHTML == '+'){
            prevOp = "+";
            prevClicked = "+";
        }
        else if(e.target.innerHTML == '-'){
            prevOp = "-";
            prevClicked = "-";
        }
        else if(e.target.innerHTML == '*'){
            prevOp = "*";
            prevClicked = "*";
        }
        else{
            prevOp = "÷";
            prevClicked = "÷";
        }
        num1 = Number(document.getElementById('calcDisplay').value);
    }
    else{
        num2 = Number(document.getElementById('calcDisplay').value);
        if(prevOp == "+"){
            answer = num1 + num2;
        }
        else if(prevOp == "-"){
            answer = num1 - num2;
        }
        else if(prevOp == "*"){
            answer = num1 * num2;
        }
        else{
            answer = num1 / num2;
        }
        document.getElementById('calcDisplay').value = answer;
        num1 = answer;
        prevOp = e.target.innerHTML;
        prevClicked = e.target.innerHTML;
    }
}

function clearDisp(e){
    document.getElementById('calcDisplay').value = "";
    prevOp = "";
    prevClicked = "";
    num1 = 0;
}

function addToDisp(e){
    if(e.target.innerHTML.indexOf('.') > -1){
        var calcDisp = document.getElementById('calcDisplay').value;
        if(calcDisp.indexOf('.') >= 0){
            ;
        }
        else{
            //clear everything if previous button clicked was an operation
            if(prevClicked == '+' || prevClicked == '-' || prevClicked == '*' || prevClicked == '÷' || prevClicked == '='){
                document.getElementById('calcDisplay').value = e.target.innerHTML;
            }
            else{
                document.getElementById('calcDisplay').value = document.getElementById('calcDisplay').value + e.target.innerHTML;
            }
        }
    }
    else{
        //clear everything if previous button clicked was an operation
        if(prevClicked == '+' || prevClicked == '-' || prevClicked == '*' || prevClicked == '÷' || prevClicked == '='){
            document.getElementById('calcDisplay').value = e.target.innerHTML;
        }
        else{
            document.getElementById('calcDisplay').value = document.getElementById('calcDisplay').value + e.target.innerHTML;
        }
    }
    prevClicked = e.target.innerHTML;
}
//end of CALCULATOR

window.onload = init;