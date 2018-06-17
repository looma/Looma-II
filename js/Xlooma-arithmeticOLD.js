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
var op, oper, topic;

function init(){
    //flashcard buttons
    var enterButton = document.getElementById('enter');
    enterButton.addEventListener('click', checkAnswer,false);

    var helpButton = document.getElementById('help');
    document.getElementById('calculator').style.visibility = 'hidden';
    helpButton.addEventListener('click', calculator,false);

    var answerField = document.getElementById('answer');
    answerField.addEventListener('keypress', function(e) {if(e.keyCode == 13) {checkAnswer();}},false);

    //calculator buttons
    var button1 = document.getElementById('button1');
    button1.addEventListener('click', addToDisp,false);

    var button2 = document.getElementById('button2');
    button2.addEventListener('click', addToDisp,false);

    var button3 = document.getElementById('button3');
    button3.addEventListener('click', addToDisp,false);

    var button4 = document.getElementById('button4');
    button4.addEventListener('click', addToDisp,false);

    var button5 = document.getElementById('button5');
    button5.addEventListener('click', addToDisp,false);

    var button6 = document.getElementById('button6');
    button6.addEventListener('click', addToDisp,false);

    var button7 = document.getElementById('button7');
    button7.addEventListener('click', addToDisp,false);

    var button8 = document.getElementById('button8');
    button8.addEventListener('click', addToDisp,false);

    var button9 = document.getElementById('button9');
    button9.addEventListener('click', addToDisp,false);

    var button0 = document.getElementById('button0');
    button0.addEventListener('click', addToDisp,false);

    var buttonDot = document.getElementById('buttonDot');
    buttonDot.addEventListener('click', addToDisp,false);

    var buttonC = document.getElementById('buttonC');
    buttonC.addEventListener('click', clearDisp,false);

    var buttonPM = document.getElementById('buttonPM');
    buttonPM.addEventListener('click', addPM,false);

    var buttonPlus = document.getElementById('buttonPlus');
    buttonPlus.addEventListener('click', opNums,false);

    var buttonMinus = document.getElementById('buttonMinus');
    buttonMinus.addEventListener('click', opNums,false);

    var buttonTimes = document.getElementById('buttonTimes');
    buttonTimes.addEventListener('click', opNums,false);

    var buttonDivide = document.getElementById('buttonDivide');
    buttonDivide.addEventListener('click', opNums,false);

    var buttonEquals = document.getElementById('buttonEquals');
    buttonEquals.addEventListener('click', equals,false);

    if(LOOMA.readCookie('topicArith') == 'div'){
        document.getElementById('topicTR').innerHTML = 'Topic : Division';
        document.getElementById('operation').style.visibility = 'hidden';
        document.getElementById('answerLine').style.visibility = 'hidden';
        document.getElementById('num1').className = 'firstNumDiv';
        document.getElementById('num2').className = 'secondNumDiv';
    }
    else{
        document.getElementById('vertLineDiv').style.visibility = 'hidden';
        document.getElementById('horzLineDiv').style.visibility = 'hidden';
        op = document.getElementById('operation');
        topic = LOOMA.readCookie('topicArith');
        if(topic == 'add'){
            document.getElementById('topicTR').innerHTML = 'Topic : Addition';
            op.innerHTML = '+';
        }
        else if(topic == 'sub'){
            document.getElementById('topicTR').innerHTML = 'Topic : Subtraction';
            op.innerHTMML = '-';
        }
        else{
            document.getElementById('topicTR').innerHTML = 'Topic : Multiplication';
            op.innerHTML = '*';
        }
    }

    nextGenProb();
}

function nextGenProb(){
    var num;
    var count = document.getElementById('count');
    if(document.getElementById('rightAnswer').style.visibility == 'visible'){
        count.innerHTML = Number(count.innerHTML) + 1;
    }
    document.getElementById('rightAnswer').style.visibility = 'hidden';
    document.getElementById('wrongAnswer').style.visibility = 'hidden';

    document.getElementById('calculator').style.visibility = 'hidden';
    var num1 = document.getElementById('num1');
    var num2 = document.getElementById('num2');

    if(LOOMA.readCookie('gradeArith') == '1'){
        document.getElementById('gradeTL').innerHTML = 'Grade : 1';
        if(LOOMA.readCookie('topicArith') != 'mult'){
            var randNum1 = (Math.floor(19 * Math.random()) + 1);
            var randNum2 = (Math.floor(19 * Math.random()) + 1);
        }
        else{
            var randNum1 = (Math.floor(5 * Math.random()) + 1);
            var randNum2 = (Math.floor(5 * Math.random()) + 1);
        }
    }
    else if(LOOMA.readCookie('gradeArith') == '2'){
        document.getElementById('gradeTL').innerHTML = 'Grade : 2';
        if(LOOMA.readCookie('topicArith') == 'add' || LOOMA.readCookie('topicArith') == 'sub'){
            var randNum1 = (Math.floor(999 * Math.random()) + 1);
            var randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else if(LOOMA.readCookie('topicArith') == 'mult'){
            var randNum1 = (Math.floor(10 * Math.random()) + 10);
            var randNum2 = (Math.floor(9 * Math.random()) + 1);
        }
        else{
            var randNum1 = (Math.floor(8 * Math.random()) + 2);
            var randNum2 = randNum1 * (Math.floor(9 * Math.random()) + 1);
        }
    }

    else if(LOOMA.readCookie('gradeArith') == '3'){
        document.getElementById('gradeTL').innerHTML = 'Grade : 3';
        if(LOOMA.readCookie('topicArith') == 'add' || LOOMA.readCookie('topicArith') == 'sub'){
            var randNum1 = (Math.floor(9999 * Math.random()) + 1);
            var randNum2 = (Math.floor(9999 * Math.random()) + 1);
        }
        else if(LOOMA.readCookie('topicArith') == 'mult'){
            var randNum1 = (Math.floor(999 * Math.random()) + 1);
            var randNum2 = (Math.floor(99 * Math.random()) + 1);
        }
        else{
            var randNum1 = (Math.floor(99 * Math.random()) + 1);
            var randNum2 = randNum1 * (Math.floor(10 * Math.random()) + 1);
        }
    }

    else{
        document.getElementById('gradeTL').innerHTML = 'Grade : 4';
        if(LOOMA.readCookie('topicArith') == 'sub'){
            var randNum1 = (Math.floor(99999 * Math.random()) + 1);
            var randNum2 = (Math.floor(99999 * Math.random()) + 1);
        }
        else if(LOOMA.readCookie('topicArith') == 'mult'){
            var randNum1 = (Math.floor(9999 * Math.random()) + 1);
            var randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else{
            var randNum1 = (Math.floor(999 * Math.random()) + 1);
            var randNum2 = randNum1 * (Math.floor(99 * Math.random()) + 1);
        }
    }

    op = document.getElementById('operation');
    topic = LOOMA.readCookie('topicArith');
    if(topic == 'add'){
        op.innerHTML = '+';
    }
    else if(topic == 'sub'){
        op.innerHTML = '-';
    }
    else if(topic == 'mult'){
        op.innerHTML = '*';
    }
    else{
        op.innerHTML = '÷';
    }

    num1.innerHTML = randNum1;
    num2.innerHTML = randNum2;

    //styling based on operation and grade level
    oper = document.getElementById('operation').innerHTML;
    if(oper == "+" || oper == "-" || oper == "*")
    {
        if(randNum1 < randNum2)
        {
            num = randNum2;
            randNum2 = randNum1;
            randNum1 = num;
        }
        num1.innerHTML = randNum1;
        num2.innerHTML = randNum2;

        if(Math.floor(randNum1/10000) >= 1){
            document.getElementById('num1').style.left = "610px";
            document.getElementById('operation').style.left = "580px";
            if(Math.floor(randNum2/10000) >= 1){
                document.getElementById('num2').style.left = "610px";
            }
            else if(Math.floor(randNum2/1000) >= 1){
                document.getElementById('num2').style.left = "633px";
            }
            else if(Math.floor(randNum2/100) >= 1){
                document.getElementById('num2').style.left = "656px";
            }
            else if(Math.floor(randNm2/10) >= 1){
                document.getElementById('num2').style.left = "679px";
            }
            else{
                document.getElementById('num2').style.left = "702px";
            }
        }
        else if(Math.floor(randNum1/1000) >= 1){
            document.getElementById('num1').style.left = "630px";
            document.getElementById('operation').style.left = "580px";
            if(Math.floor(randNum2/1000) >= 1){
                document.getElementById('num2').style.left = "630px";
            }
            else if(Math.floor(randNum2/100) >= 1){
                document.getElementById('num2').style.left = "653px";
            }
            else if(Math.floor(randNum2/10) >= 1){
                document.getElementById('num2').style.left = "676px";
            }
            else{
                document.getElementById('num2').style.left = "699px";
            }
        }
        else if(Math.floor(randNum1/100) >= 1){
            document.getElementById('num1').style.left = "640px";
            if(Math.floor(randNum2/100) >= 1){
                document.getElementById('num2').style.left = "640px";
            }
            else if(Math.floor(randNum2/10) >= 1){
                document.getElementById('num2').style.left = "663px";
            }
            else{
                document.getElementById('num2').style.left = "686px";
            }
        }
        else if(Math.floor(randNum1/10) >= 1){
            document.getElementById('num1').style.left = "650px";
            if(Math.floor(randNum2/10 >= 1)){
                document.getElementById('num2').style.left = "650px";
            }
            else{
                document.getElementById('num2').style.left = "673px";
            }
        }
        else{
            document.getElementById('num1').style.left = "650px";
            document.getElementById('num2').style.left = "650px";
        }
    }
    else{
        if(Math.floor(randNum1/100) >= 1){
            document.getElementById('num1').style.left = "566px";
        }
        else if(Math.floor(randNum1/10) >= 1){
            document.getElementById('num1').style.left = "583px";
        }
        else{
            document.getElementById('num1').style.left = "610px";
        }
    }

    var answer = document.getElementById('answer');
    answer.value = '';
    answer.focus();
}

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


    wrong = document.getElementById('wrongAnswer').style.visibility;
    if(answer == correct){
        if(wrong == 'visible'){
            document.getElementById('wrongAnswer').style.visibility = 'hidden';
        }
        document.getElementById('rightAnswer').style.visibility = 'visible';
    }
    else{
        document.getElementById('wrongAnswer').style.visibility = 'visible';
        document.getElementById('answer').value = '';
        document.getElementById('answer').focus();
    }
}

function calculator(e){
    var calc = document.getElementById('calculator');
    if(calc.style.visibility == 'hidden'){
        calc.style.visibility = 'visible';
    }
    else{
        calc.style.visibility = 'hidden';
    }
}

function addPM(e){
    var dVal = document.getElementById('calcDisplay').value;
    dLen = dVal.length;
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
    num2 = Number(document.getElementById('calcDisplay').value);
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
        calcDisp = document.getElementById('calcDisplay').value;
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

window.onload = init;