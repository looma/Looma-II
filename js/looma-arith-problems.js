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

    arithSubject = LOOMA.readStore('arith-subject', 'session');
    arithClass = LOOMA.readStore('arith-grade', 'session');
    // DEBUG    console.log ('ARITH: arith-grade is ' + arithClass);

    //arithClass = arithClass.substr(0, arithClass.length - 1) + ' ' + arithClass.substr(arithClass.length-1);
    document.getElementById('gradeValue').innerHTML = LOOMA.capitalize(arithClass);

    var enterButton = document.getElementById('enter');
    enterButton.addEventListener('click', checkAnswer,false);

    var resetButton = document.getElementById('clear');
    resetButton.addEventListener('click', resetAnswer,false);

    var answerField = document.getElementById('answer');
   
    answerField.addEventListener('keyup',
        function(e) {if (arithSubject != 'div') LOOMA.rtl(this);});
   
    answerField.addEventListener('keypress',
        function(e) {if(e.keyCode == enterKey) checkAnswer();});
    
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
        //document.getElementById('division-symbol').style.visibility = 'visible';
        $('#division-symbol').show();
        $('#answerLine').hide();
        $('#operation').hide();
        $('#num1, #num2, #answer, .button-group').addClass('div');
        //document.getElementById('operation').style.visibility = 'hidden';
        //document.getElementById('num1').className = 'div';
        //document.getElementById('num2').className = 'div';
    }
    else{
      //  document.getElementById('division-symbol').style.visibility = 'hidden';
        $('#division-symbol').hide();
        $('#answerLine').show();
        //document.getElementById('answerLine').style.visibility = 'visible';
        op = document.getElementById('operation');
        if(arithSubject === 'add'){
            op.innerHTML = '+';
        }
        else if(arithSubject === 'sub'){
            op.innerHTML = '-';
        }
        else{
            op.innerHTML = '*';
        }
    }

    nextGenProb();
}; //end INIT()

function randomPlusMinus() {return 2 * Math.random() - 1;};

function nextGenProb(){
    var num;
    var count = document.getElementById('countValue');
    var randNum1, randNum2;

    if(document.getElementById('message').style.visibility == 'visible'){
        problemCount += 1;
        count.innerHTML = problemCount;
    }
    $('#message').text();
   // document.getElementById('message-correct').style.visibility = 'hidden';
   // document.getElementById('message-wrong').style.visibility = 'hidden';

    //document.getElementById('calculator').style.visibility = 'hidden';

    var num1 = document.getElementById('num1');
    var num2 = document.getElementById('num2');

    var subject = arithSubject;

    /* difficulty by grade:
        class   add     sub     mult    div
        1       1,1     -       -       -
        2       2,2     1,1     -       -
        3       3,3     2,2     2,1     -
        4       4,4     3,3     3,2     -
        5       5,5     4,4     4,3     1,3
        6       5,5     4,4     5,3     2,4
        7       6,6     5,5     6,4     3,5
        8       6,6     5,5     6,4     3,5
     */
    
    if(arithClass == 'class1'){
        if(subject !== 'add'){
            randNum1 = (Math.floor(9 * Math.random()) + 1);
            randNum2 = (Math.floor(9 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(5 * Math.random()) + 1);
            randNum2 = (Math.floor(5 * Math.random()) + 1);
        }
    } //end of CLASS 1
    else if(arithClass === 'class2'){
        if(subject == 'add'){
            randNum1 = (Math.floor(99 * Math.random()) + 1);
            randNum2 = (Math.floor(99 * Math.random()) + 1);
        }
        else if(subject == 'sub'){
            randNum1 = (Math.floor(9 * Math.random()) + 1);
            randNum2 = (Math.floor(9 * Math.random()) + 1);
        }
        else{
            randNum1 = (Math.floor(8 * Math.random()) + 2);
            randNum2 = randNum1 * (Math.floor(9 * Math.random()) + 1);
        }
    } //end of CLASS 2

    else if(arithClass == 'class3'){
        if(subject == 'add'){
            randNum1 = (Math.floor(999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else if(subject == 'sub'){
            randNum1 = (Math.floor(99 * Math.random()) + 1);
            randNum2 = (Math.floor(99 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(9 * Math.random()) + 1);
            randNum2 = (Math.floor(9 * Math.random()) + 1);
        }
        else{  //subject === 'div'
            randNum1 = (Math.floor(99 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(10 * Math.random()) + 1);
        }
    } //end of CLASS 3

    else if(arithClass == 'class4'){
        if(subject == 'add'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(9999 * Math.random()) + 1);
        }
        else if(subject == 'sub'){
            randNum1 = (Math.floor(999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(999 * Math.random()) + 1);
            randNum2 = (Math.floor(99 * Math.random()) + 1);
        }
        else{  //subject === 'div'
            randNum1 = (Math.floor(99 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(9 * Math.random()) + 1);
        }
    } //end of CLASS 4

    else if(arithClass == 'class5'){
        if(subject == 'add' ){
            randNum1 = (Math.floor(99999 * Math.random()) + 1);
            randNum2 = (Math.floor(99999 * Math.random()) + 1);
        }
        else if(subject == 'sub'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(9999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else{  //subject === 'div'
            randNum1 = (Math.floor(9 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(99 * Math.random()) + 1);
        }
    } //end of CLASS 5

    else if(arithClass == 'class6'){
        if(subject == 'add'){
            randNum1 = (Math.floor(99999 * Math.random()) + 1);
            randNum2 = (Math.floor(99999 * Math.random()) + 1);
        }
        else if(subject == 'sub'){
            randNum1 = (Math.floor(9999 * Math.random()) + 1);
            randNum2 = (Math.floor(9999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(99999 * Math.random()) + 1);
            randNum2 = (Math.floor(999 * Math.random()) + 1);
        }
        else{  //subject === 'div'
            randNum1 = (Math.floor(99 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(99 * Math.random()) + 1);
        }
    } //end of CLASS 6

    else{  //CLASS 7 or higher
        if(subject == 'add' || subject == 'sub'){
            randNum1 = (Math.floor(999999 * Math.random()) + 1);
            randNum2 = (Math.floor(999999 * Math.random()) + 1);
        }
        else if(subject == 'mult'){
            randNum1 = (Math.floor(99999 * Math.random()) + 1);
            randNum2 = (Math.floor(9999 * Math.random()) + 1);
        }
        else{  //subject === 'div'
            randNum1 = (Math.floor(999 * Math.random()) + 1);
            randNum2 = randNum1 * (Math.floor(9999 * Math.random()) + 1);
        }
    } //end of CLASS 7 or higher

    if (subject == 'sub' & randNum2 > randNum1) {var x=randNum1;randNum1=randNum2;randNum2=x;};
    // TEMP fix until NUMPAD includes a '-' key
    
    if((arithClass === 'class1' || arithClass === 'class2' || arithClass === 'class3' || arithClass === 'class4') &&
        (oper === "+" || oper === "-" || oper === "*"))
        {
            if(randNum1 < randNum2)
            {
                num = randNum2;
                randNum2 = randNum1;
                randNum1 = num;
            }
        };
 
    oper = document.getElementById('operation').innerHTML;
    num1.innerHTML = randNum1;
    num2.innerHTML = randNum2;

    resetAnswer();
}; //end nextGenProb()

function resetAnswer() {
    var answer = document.getElementById('answer');
    answer.value = '';
    answer.focus();
    $('#message').text();
    //document.getElementById('message-wrong').style.visibility = 'hidden';
    //document.getElementById('message-correct').style.visibility = 'hidden';};
};

function checkAnswer(){
    var correct, wrong;
    var num1 = Number(document.getElementById('num1').innerHTML);
    var num2 = Number(document.getElementById('num2').innerHTML);
    var answer = document.getElementById('answer').value;
    op = document.getElementById('operation').innerHTML;
    if     (op === '+'){ correct = num1 + num2;}
    else if(op === '-'){ correct = num1 - num2;}
    else if(op === '*'){ correct = num1 * num2; }
    else              { correct = num2 / num1;}
    
    if(parseInt(answer) === correct){
        $('#message').text('Correct. Try another problem').css('color','green').show();
        //document.getElementById('message-wrong').style.visibility = 'hidden';
        //document.getElementById('message-correct').style.visibility = 'visible';
    }
    else{  //wrong answer given
        $('#message').text('Incorrect: Try again').css('color','red').show();
        //document.getElementById('message-wrong').style.visibility = 'visible';
        //document.getElementById('message-correct').style.visibility = 'hidden';
        //document.getElementById('answer').value = '';
        document.getElementById('answer').focus();
    }
}

window.onload = init;
