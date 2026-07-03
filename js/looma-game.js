'use strict';

var $timer;

var game;
var time_limit;
var score_method;
var type, grade, subject, ch_id;
var game_id;

var num_teams;
var curr_team = 1;

var index;

var num_questions;
var curr_question = 1;
var promptButtons, responseButtons;

var prompts, responses;

var matchResponses;
var activeMatchPrompts;
var activeMatchResponses;

var scores;
var clickedEventID;

var speechbubble = '<img src="images/speech1.png"/>';

/////////////////////////////////////////////////////////////
////////  TIMELINE GAME   ///////////////////////////
/////////////////////////////////////////////////////////////

var currentEventID;
var numMatched;

//allows user to drag timeline events
function timelineDrag(ev)
{
    ev.dataTransfer.setData("Text", ev.target.id);
    if (clickedEventID != undefined) {
        var oldEvent = document.getElementById(clickedEventID);
        oldEvent.removeAttribute("style");
    }
    currentEventID = ev.target.id;
}

/*executes rightDraggingOutput or wrongDraggingOutput
based on where the user drops the event*/
function timelineDrop(ev) {
    numGuesses++;
    var dateID = ev.target.id;
    var eventID = currentEventID;
    if ($("#" + eventID).data("index") == $("#" + dateID).data("index"))
    {
        rightDraggingOutput($("#" + eventID).data("index"));
    }
    else
    {
        wrongDraggingOutput($("#" + eventID).data("index"), $("#" + dateID).data("index"));
    }
    ev.preventDefault();
}

//finds the date that's clicked
function timelineFindDate(ev) {
    numGuesses++;
    if (clickedEventID != undefined) {
        var oldEvent = document.getElementById(clickedEventID);
        oldEvent.removeAttribute("style");
    }
    clickedEventID = ev.target.id;
    this.style.color = "blue";

    var dateButtons = document.getElementsByClassName("date");
    for (i = 0; i < dateButtons.length; i++)
    {
        dateButtons[i].addEventListener('click', checkTimelineMatch);
    }
}

// checks to see if the user matched the event to the correct date by clicking
function checkTimelineMatch(ev) {
    var dateID = ev.target.id;

    var dateButtons = document.getElementsByClassName("date");
    for (i = 0; i < dateButtons.length; i++)
    {
        dateButtons[i].removeEventListener('click', checkTimelineMatch);
    }

    if ($("#" + dateID).data("index") == $("#" +clickedEventID).data("index"))
    {
        rightDraggingOutput($("#" +clickedEventID).data("index"));
    }
    else
    {
        wrongDraggingOutput($("#" +clickedEventID).data("index"), $("#" +dateID).data("index"));
    }
}

// responds appropriately when user correctly matches an event to a date
function rightDraggingOutput(eventID) {
    //must rest to undefined otherwise when we remove style attribute we remove visibility:hidden
    clickedEventID = undefined;

    var goal = getNumQuestions();
    increaseScore();
    numMatched++;
    var eventButtons = document.getElementsByClassName("event");
    var emptyEventButtons = document.getElementsByClassName("emptyEvent");
    var dateButtons = document.getElementsByClassName("date");

    //makes the selected event button and date button green
    for (i = 0; i < eventButtons.length; i++)
    {
        if ($(eventButtons[i]).data("index") == eventID)
        {
            eventButtons[i].style.color = "#0bd871";
        }
    }
    for (i = 0; i < dateButtons.length; i++)
    {
        if ($(dateButtons[i]).data("index") == eventID)
        {
            dateButtons[i].style.color = "#0bd871";
        }
    }

    /*performs the following after 1 second:
    hides the event button in the "events" div
    resets the style of the date button
    makes the event button in the timeline div visible*/
    setTimeout(function()
    {
        for (i = 0; i < eventButtons.length; i++) {
            if ($(eventButtons[i]).data("index") == eventID)
                eventButtons[i].style.visibility = "hidden";
        }

        for (i = 0; i < dateButtons.length; i++) {
            if ($(dateButtons[i]).data("index") == eventID)
            { dateButtons[i].removeAttribute("style");
              dateButtons[i].disabled = true;
            }
        }

        var timelineEventButtons = document.getElementsByClassName("timelineEvent");
        for (i = 0; i < timelineEventButtons.length; i++) {
            if (i == eventID)
                timelineEventButtons[i].style.visibility = "visible";
        }
    }, 4000);
    correctAnswer();
}

// responds appropriately when user incorrectly matches an event to a date
function wrongDraggingOutput(eventID, dateID)
{
    clickedEventID = undefined;
    var eventButtons = document.getElementsByClassName("event");
    var dateButtons = document.getElementsByClassName("date");

    //makes the selected event button and date button red
    for (i = 0; i < eventButtons.length; i++)
    {
        if ($(eventButtons[i]).data("index") == eventID)
        {
            eventButtons[i].style.color = "#f70426";
        }
    }
    for (i = 0; i < dateButtons.length; i++)
    {
        if ($(dateButtons[i]).data("index") == dateID)
        {
            dateButtons[i].style.color = "#f70426";
        }
    }

    //resets the style of the selected event and date buttons
    setTimeout(function(){
        for (i = 0; i < eventButtons.length; i++)
        {
            if ($(eventButtons[i]).data("index") == eventID)
                eventButtons[i].removeAttribute("style");
        };
        for (i = 0; i < dateButtons.length; i++)
        {
            if ($(dateButtons[i]).data("index") == dateID)
                dateButtons[i].removeAttribute("style");
        }
    }, 4000);
    wrongAnswer();
}

function runTimeline(){

} //end runTimeline()

// wrapper function for timeline game -- analogous to runMCGame()
function runTimelineOLD()
{
    $('<div class="timeline"><ol>').appendTo($('#game'));

    numMatched = 0;
    curr_question = 1;
    startTimer(time_limit);

    //document.getElementById("progress-bar").style.width = ourWidth;

    var eventButtons = document.getElementsByClassName("event");
    var dateButtons = document.getElementsByClassName("date");

    if ( numMatched == eventButtons.length )
    {
        //document.getElementById("endMessage").innerHTML = "Good job! You matched all " + numMatched + " events to their dates in " + numGuesses + " guesses.";
        gameOver();

        for (var i = 0; i < dateButtons.length; i++) {dateButtons[i].disabled = true;}
    }
    else
    {
        for (var $i = 0; $i < eventButtons.length ; $i++)
        {
            eventButtons[$i].addEventListener('click', timelineFindDate);
            eventButtons[$i].addEventListener('drag', timelineDrag);
            dateButtons[$i].addEventListener('drop', timelineDrop);
            dateButtons[$i].addEventListener('dragover', allowDrop);
            dateButtons[$i].addEventListener('dragleave', resetStyle);
        }
    }

}; //end runTimelineOLD()


/////////////////////////////////////////////////////////////
////////  MULTIPLE CHOICE GAME   ///////////////////////////
/////////////////////////////////////////////////////////////

var mcTries;

/////////////////////////////////////
// /////// mcCorrectAnswer  /////////
// //////////////////////////////////
function mcCorrectAnswer(event) {
    $('.correct').toggleClass('good');

    setTimeout(function() {
        $('.correct').toggleClass('good');
        correctAnswer();
    },2000);
}
///////////////////////////////////
// /////// mcWrongAnswer  /////////
// ////////////////////////////////
function mcWrongAnswer(event) {
    $(event.currentTarget).toggleClass('bad');

    setTimeout(function() {
        $(event.currentTarget).toggleClass('bad');
        mcTries++;

        if (mcTries > 3) {
            //if (curr_question >= num_questions) gameOver();
            //else
                {
                nextTeam();
                curr_question++;
                nextQuestion();
            }
        } else {
            nextTeam();
            //setTimer(time_limit);
            startTimer(time_limit);
        }
    },2000);

    //});
}

///////////////////////////////////////////////////////
// /////// runMC  multiple-choice questions ///////////
// ////////////////////////////////////////////////////

function runMC() {
    //var questionNumber = curr_question;
    $('#game').empty();
  //  $('#game').append('<span id="question-number">');
  //  $('#game').append('<span id="question">');
    $('#game').append('<div id="answers">');

    num_questions = game['prompts'].length;
    curr_question = 1;
    nextQuestion();
} //end runMC()

/////////////////////////////////////////////////////
////////  MATCHING GAME   ///////////////////////////
/////////////////////////////////////////////////////

    var previousClick;
    var selected_pair;
    var selected_prompt, selected_resp;
    var matches_made = 0;

/////////////////////////////////////
///////// matchPromptClick  /////////
/////////////////////////////////////

function matchPromptClick(event) {
    $('.prompt.not-done').removeClass('clicked');
    //selected_pair = event.target.className.split(' ')[1];
    selected_prompt = $(event.currentTarget).data()['pair'];
    $('.prompt.not-done[data-pair=' + selected_prompt + ']').addClass('clicked');

    if ($(event.currentTarget).data()['word'] && game.presentation_type !== 'picture matching') LOOMA.speak($(event.currentTarget).data()['word']);

    if (previousClick === 'response') {checkMatch();
    } else {
        previousClick = 'prompt'
    }
    //var num_pairs = game['prompts'].length;
    //for (var i = 0; i < num_pairs; i++) {
        //$('#response-'+i.toString()).click(matchResponseClick);}
}  // end matchPromptClick()

/////////////////////////////
// /////// matchResponseClick  /////////
// //////////////////////////
function matchResponseClick(event) {

    $('.response.not-done').removeClass('clicked');
    selected_resp = $(event.currentTarget).data()['pair'];
    $('.response.not-done[data-pair=' + selected_resp + ']').addClass('clicked');

    if (previousClick === 'prompt') {checkMatch();
    } else {
        previousClick = 'response'
    }
} //end matchResponse()

function checkMatch() {
    var r = selected_resp;
    var p = selected_prompt;

    if (selected_resp === selected_prompt) {  //correct!
        matches_made++;
        //scores[curr_team-1]++;
        // updateScores();
        //updateProgress(curr_team, scores[curr_team-1], num_questions);
        //$('.'+selected_resp).css('color','green');
        $('.response[data-pair=' + selected_resp + ']').addClass('matched');
        $('.prompt[data-pair=' + selected_prompt + ']').addClass('matched');

        // selected_prompt = null;
        // selected_resp = null;
        previousClick = null;

        setTimeout(function() {
            //$('.'+selected_resp).hide();
            $('.response[data-pair=' + r + ']').removeClass('matched not-done clicked').addClass('done').off('click');
            $('.prompt[data-pair=' + p + ']').removeClass('matched not-done clicked').addClass('done').off('click');

            // remove this P/R pair from activeMatch arrays
            if (['matching','spoken matching','spoken to picture', 'picture matching'].includes(game.presentation_type))
            {
                activeMatchPrompts.splice(p,1);
                activeMatchResponses.splice(r,1);
            }

            correctAnswer();
            //showTeam();
            //if (matches_made === game['prompts'].length) gameOver();
            if (matches_made === num_questions) gameOver();
        }, 1000);

    } else {  //incorrect!
        //$('.response.'+selected_resp).css('color','red');
        //$('.prompt.'+selected_resp).css('color','red');
        $('.response[data-pair=' + selected_resp + ']').removeClass('clicked').addClass('mismatched');
        $('.prompt[data-pair=' + selected_prompt + ']').removeClass('clicked').addClass('mismatched');

        //remove prompt onclick
        //$('.prompt').off('click');
        selected_resp = null;
        selected_prompt = null;
        previousClick = null;

        setTimeout(function() {
            //$('.response.'+selected_resp).css('color','black');
            //$('.prompt.'+selected_resp).css('color','black');
            $('.response[data-pair=' + r + ']').removeClass('mismatched');
            $('.prompt[data-pair=' + p + ']').removeClass('mismatched');

            wrongAnswer();
        },1000);
    }
}  // end checkMatch()

function matchPromptButton(type,i,prompt) {
    if (type === 'matching')
        return $('<button class="prompt not-done"  data-word="' + prompt +  '" data-pair="' + i.toString() + '" id="prompt-'+i.toString()+'">' + prompt + '</button>');
    if (type === 'spoken matching')
        return $('<button class="prompt not-done"  data-word="' + prompt +  '" data-pair="' + i.toString() + '" id="prompt-'+i.toString()+'">' + speechbubble + '</button>');
    if (type === 'picture matching')
        return $('<button class="response not-done picture" data-word=' + prompt +
            ' data-pair="' + i.toString() +
            '" id="response-' + i.toString() + '">' +
            '<img src="../content/dictionary images/' + prompt + '.jpg" ></button>');
    if (type === 'spoken to picture')
        return $('<button class="prompt not-done"  data-word="' + prompt +  '" data-pair="' + i.toString() + '" id="prompt-'+i.toString()+'">' + speechbubble + '</button>');
}

function matchResponseButton(type,i,response) {
    if (type === 'matching')
        return $('<button class="response not-done" data-pair="' + i.toString() + '" id="response-'+i.toString()+'">' + response + '</button>');
    if (type === 'spoken matching')
        return $('<button class="response not-done" data-pair="' + i.toString() + '" id="response-'+i.toString()+'">' + response + '</button>');
    if (type === 'picture matching')
        return $('<button class="response not-done" data-pair="' + i.toString() + '" id="response-'+i.toString()+'">' + response + '</button>');
    if (type === 'spoken to picture')
        return $('<button class="response not-done picture" data-word=' + response +
            ' data-pair="' + i.toString() +
            '" id="response-' + i.toString() + '">' +
            '<img src="../content/dictionary images/' + response + '.jpg" ></button>');
}

//////////////////////////////
///////// runMatch  /////////
//////////////////////////////  NOTE: runs a 'matching' game using 'prompts[]' and 'responses[]'

function runMatch(type) { //called to start the game or when a question is answered correctly

    var button;
    var showQuestions = 5;
    showTeam();
  //  matches_made = 0;

    //$('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');


    $('#question').html(' Click left and right items to find a match ');

    // game prompts and responses are in             game['prompts'] and      game['responses']
    // currently active prompts and responses are in activeMatchPrompts[] and activeMatchResponses[]


    while (activeMatchPrompts.length < showQuestions && prompts.length > 0) {
        var rnd = Math.floor(Math.random() * (prompts.length));

        activeMatchPrompts.push(prompts.splice(rnd, 1)); //removes the "rnd" element from prompts[] and adds it to activeMatchPrompts[]
        activeMatchResponses.push(responses.splice(rnd, 1));
    }
    promptButtons = [];
    responseButtons = [];
    $('#prompts').empty();
    $('#responses').empty();

    activeMatchPrompts.forEach(function(prompt, i){
        //button = $('<button class="prompt not-done"  data-word="' + prompt +  '" data-pair="' + i.toString() + '" id="prompt-'+i.toString()+'">' + prompt + '</button>');
        button = matchPromptButton(type,i,prompt);
        button.click(matchPromptClick);
        promptButtons.push(button);
    });
    activeMatchResponses.forEach(function(response,i){
        //button = $('<button class="response not-done" data-pair="' + i.toString() + '" id="response-'+i.toString()+'">' + response + '</button>');
        button = matchResponseButton(type,i,response);
        button.click(matchResponseClick);
        responseButtons.push(button);
    });

    //https://www.w3schools.com/js/js_array_sort.asp
    promptButtons.sort  (function(a, b){return 0.5 - Math.random()});
    responseButtons.sort(function(a, b){return 0.5 - Math.random()});

    promptButtons.forEach(function(promptButton){
        $('#prompts').append(promptButton);
        $('#prompts').append('<br/>');
    });
    responseButtons.forEach(function(responseButton){
        $('#responses').append(responseButton);
        $('#responses').append('<br/>');
    });
    startTimer(time_limit);
} // end runMatch()


/*
//////////////////////////////
///////// runMatchSpeak  /////////
//////////////////////////////  NOTE: runs a 'matching' game using 'prompts[]' and 'responses[]'

function runMatchSpeak() {
    showTeam();
    matches_made = 0;
    num_questions = 5;

    //$('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');

    $('#question').html('Click left and right items to find a match');

    var prompts =   game['prompts']; prompts.length = num_questions;
    var responses = game['responses'];  responses.length = num_questions;
    //console.log(prompts)
    //console.log(responses)
     promptButtons = [];
     responseButtons = [];
    prompts.forEach(function(prompt, i){

        var button = $('<button class="prompt not-done"  data-word="' + prompt +  '" data-pair="' + i.toString() + '" id="prompt-'+i.toString()+'">' + speechbubble + '</button>');
        button.click(matchPromptClick);
        promptButtons.push(button);
    });
    responses.forEach(function(response,i){
        var button = $('<button class="response not-done" data-pair="' + i.toString() + '" id="response-'+i.toString()+'">' + response + '</button>');
        button.click(matchResponseClick);
        responseButtons.push(button);
    });

    //https://www.w3schools.com/js/js_array_sort.asp
    promptButtons.sort  (function(a, b){return 0.5 - Math.random()});
    responseButtons.sort(function(a, b){return 0.5 - Math.random()});

    promptButtons.forEach(function(promptButton){
        $('#prompts').append(promptButton);
        $('#prompts').append('<br/>');
    });
    responseButtons.forEach(function(responseButton){
        $('#responses').append(responseButton);
        $('#responses').append('<br/>');
    });
    startTimer(time_limit);
} // end runMatchSpeak()

//////////////////////////////
///////// runMatchSpeakToPicture  /////////
//////////////////////////////  NOTE: runs a 'matching' game using 'prompts[]' and 'responses[]'

function runMatchSpeakToPicture() {
    showTeam();
    matches_made = 0;
    num_questions = 5;

    //$('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');

    $('#question').html('Click left and right items to find a match');

    var prompts =   game['prompts'];
    var responses = game['responses'];
    //console.log(prompts)
    //console.log(responses)
    promptButtons = [];
    responseButtons = [];
    prompts.forEach(function(prompt, i){

        var button = $('<button class="prompt not-done"  data-word="' + prompt +  '" data-pair="' + i.toString() + '" id="prompt-'+i.toString()+'">' + speechbubble + '</button>');
        button.click(matchPromptClick);
        promptButtons.push(button);
    });
    responses.forEach(function(response,i){
        var button = $('<button class="response not-done picture" data-word=' + response +
            ' data-pair="' + i.toString() +
            '" id="response-' + i.toString() + '">' +
            '<img src="../content/dictionary images/' + response + '.jpg" ></button>');
        button.click(matchResponseClick);
        responseButtons.push(button);
    });

    //https://www.w3schools.com/js/js_array_sort.asp
    promptButtons.sort  (function(a, b){return 0.5 - Math.random()});
    responseButtons.sort(function(a, b){return 0.5 - Math.random()});

    promptButtons.forEach(function(promptButton){
        $('#prompts').append(promptButton);
        $('#prompts').append('<br/>');
    });
    responseButtons.forEach(function(responseButton){
        $('#responses').append(responseButton);
        $('#responses').append('<br/>');
    });
    startTimer(time_limit);
} // end runMatchSpeakToPicture()
*/

//////////////////////////////
///////// runPicture  /////////
//////////////////////////////

function pictureListSucceed(words){
    //console.log('Success, found ${result.length} words: ${result}');
    promptButtons = [];
    responseButtons = [];

    if (words.length === 0) {
        LOOMA.alert("No words found for this chapter",null,true);
        return;
    }
    words.forEach(function(word, i){
        var buttonPicture =
            $('<button class="prompt not-done picture" data-word=' + word['en'] +
                ' data-pair="' + i.toString() +
                '" id="prompt-' + i.toString() + '">' +
                '<img src="../content/dictionary images/' + word['en'] + '.jpg" ></button>');
        var buttonWord =
            $('<button class="response not-done picture" ' +
                'data-pair="' + i.toString() + '" id="response-' + i.toString() + '">' + word['en'] + '</button>');
        buttonPicture.click(matchPromptClick);
        buttonWord.click(matchResponseClick);
        promptButtons.push(buttonPicture);
        responseButtons.push(buttonWord);
    });

    //https://www.w3schools.com/js/js_array_sort.asp
    promptButtons.sort  (function(a, b){return 0.5 - Math.random()});
    responseButtons.sort(function(a, b){return 0.5 - Math.random()});

    promptButtons.forEach(function(promptButton){
        $('#prompts').append(promptButton);
        $('#prompts').append('<br/>');
    });
    responseButtons.forEach(function(responseButton){
        $('#responses').append(responseButton);
        $('#responses').append('<br/>');
    });
    startTimer(time_limit);}

function pictureListFail(jqXHR, textStatus, errorThrown){
    console.log('PICTURE: AJAX call to dictionary-utilities.php FAILed, jqXHR is ' + jqXHR.status);
    LOOMA.alert("Game not found");
}

function runPicture(grade, subject, ch_id) {
    showTeam();
    matches_made = 0;
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');
    $('#question').html('Click left and right items to find a match.');

    num_questions = 5;
    var random = true;
    time_limit = 45;
    startTimer(time_limit);
    LOOMA.picturewordlist(grade, subject    , ch_id, num_questions, random, pictureListSucceed, pictureListFail);
}  // END runPicture() //


/*
//////////////////////////////
///////// runMatchPicture  /////////
//////////////////////////////  NOTE: runs a 'matching' game using 'prompts[]' and 'responses[]'

function runMatchPicture() {
    showTeam();
    matches_made = 0;
    num_questions = 5;

    //$('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');

    $('#question').html('Click left and right items to find a match');

    var prompts =   game['prompts'];
    var responses = game['responses'];
    //console.log(prompts)
    //console.log(responses)
    promptButtons = [];
    responseButtons = [];
    prompts.forEach(function(prompt, i){
        var speechbubble = '<img src="images/speech1.png"/>';
        var button = $('<button class="prompt not-done"  data-word="' + prompt +  '" data-pair="' + i.toString() + '" id="prompt-'+i.toString()+'">' +
            '<img src="../content/dictionary images/' + prompt + '.jpg"/>' + '</button>');
        button.click(matchPromptClick);
        promptButtons.push(button);
    });
    responses.forEach(function(response,i){
        var button = $('<button class="response not-done" data-pair="' + i.toString() + '" id="response-'+i.toString()+'">' +
            response + '</button>');
        button.click(matchResponseClick);
        responseButtons.push(button);
    });

    //https://www.w3schools.com/js/js_array_sort.asp
    promptButtons.sort  (function(a, b){return 0.5 - Math.random()});
    responseButtons.sort(function(a, b){return 0.5 - Math.random()});

    promptButtons.forEach(function(promptButton){
        $('#prompts').append(promptButton);
        $('#prompts').append('<br/>');
    });
    responseButtons.forEach(function(responseButton){
        $('#responses').append(responseButton);
        $('#responses').append('<br/>');
    });
    startTimer(time_limit);
} // end runMatchPicture()
*/

//////////////////////////////
///////// runRandomSpeak  /////////
//////////////////////////////

function getSpeakWords(grade, subj, id, count, random){
    LOOMA.wordlist(grade, subj, ch_id, count, random, speakListSucceed, speakListFail);
}

function speakListSucceed(result){
    console.log('Success, found ${result.length} words: ${result}');
    if (result.length === 0) {
        LOOMA.alert("No words found for this chapter", null, true);
        return;
    };
    runSpeakHelper(result)
}

function speakListFail(jqXHR, textStatus, errorThrown){
    console.log('SPREAK: AJAX call to dictionary-utilities.php FAILed, jqXHR is ' + jqXHR.status);
    LOOMA.alert("Game not found");
}

function runSpeakHelper(words){
     promptButtons = [];
     responseButtons = [];

    words.forEach(function(word, i){
        var buttonPicture = $('<button class="prompt not-done picture" ' +
            'data-word=' + word['en'] + ' data-pair="' + i.toString() + '" id="prompt-' + i.toString() + '">' +
            '<img src="images/speech1.png" /></button>');
        //var buttonWord = $('<button class="response not-done picture" data-pair="${i.toString()}" id="response-${i.toString()}">${word['en']}</button>');

        var buttonWord =
            $('<button class="response not-done picture" ' +
                'data-pair="' + i.toString() +
                '" id="response-"' + i.toString() + '">' + word['en']  + '</button>');

        promptButtons.push(buttonPicture);
        responseButtons.push(buttonWord);
    });

    promptButtons.sort  (function(a, b){return 0.5 - Math.random()});
    responseButtons.sort(function(a, b){return 0.5 - Math.random()});

    promptButtons.forEach(function(promptButton){
        $('#prompts').append(promptButton);
        $('#prompts').append('<br/>');
    });
    responseButtons.forEach(function(responseButton){
        $('#responses').append(responseButton);
        $('#responses').append('<br/>');
    });
    $('.prompt').click(matchPromptClick);
    $('.response').click(matchResponseClick);
    startTimer(time_limit);
}

function runRandomSpeak(grade, subject) {
    showTeam();
    matches_made = 0;
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');
    $('#question').html('Click left and right items to find a match.');

    num_questions = 5;
    var random = true;
    time_limit = 15;

    getSpeakWords(grade, subject, null, num_questions, random);
}  // END runRandomSpeak() //


//////////////////////////////
///////// runtranslate  //////
//////////////////////////////

function getTranslateWords(grade, subj, id, count, random){
    LOOMA.wordlist(grade, subj, id, count, random, translateListSucceed, translateFail);
}

function translateFail(jqXHR, textStatus, errorThrown){
    //console.log('TRANSLATE: AJAX call to dictionary-utilities.php FAILed, jqXHR is ' + jqXHR.status);
    LOOMA.alert("No words found");
}

function translateListSucceed(words){
    //console.log('Success, found ${words.length} words: ${words}');
    if (words.length === 0) {
        LOOMA.alert("No words found for this chapter",null,true);
        return;
    }
    words.forEach(function(word, i){
        var english = word['en'];
        var buttonWord =
            $('<button class="prompt not-done picture" data-word="' + english +
                '" data-pair="' + i.toString() +
                '" id="prompt-' + i.toString() + '">' + english + '</button>');
        promptButtons.push(buttonWord);

        var nepali = word['np'];
        var buttonResponse =
            $('<button class="response not-done picture" ' +
                'data-pair="' + i.toString() +
                '" id="response-"' + i.toString() + '">' + nepali  + '</button>');
        responseButtons.push(buttonResponse); });

    promptButtons.sort  (function(a, b){return 0.5 - Math.random()});
    responseButtons.sort(function(a, b){return 0.5 - Math.random()});

    promptButtons.forEach(function(promptButton){
        $('#prompts').append(promptButton);
        $('#prompts').append('<br/>');
    });
    responseButtons.forEach(function(responseButton){
        $('#responses').append(responseButton);
        $('#responses').append('<br/>');
    });
    $('.prompt').click(matchPromptClick);
    $('.response').click(matchResponseClick);
    startTimer(time_limit);
};

function runTranslate(grade, subject) {
    showTeam();
    matches_made = 0;
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');
    promptButtons = [];
    responseButtons = [];
    $('#question').html('Click left and right items to find a match.');

    num_questions = 5;
    var random = true;
    time_limit = 45;

    getTranslateWords(grade, subject, ch_id, num_questions, random);
}  // END runtranslate() //

//////////////////////////////
///////// runVocab  /////////
//////////////////////////////
function runVocab() {
    //console.log('starting vocab drill');
}; //end runVocab()


//////////////////////////////
///////// runArith  /////////
//////////////////////////////
function runArith() {
    //console.log('starting arithmetic drill');
}; //end runArith()


///////// runRandom  /////////
//////////////////////////////    NOTE: 'random' game generates a randomly selected set of words from a textbook chapter
//////////////////////////////           and presents a 'matching' game to match words with their definitions
//////////////////////////////
function runRandom () {
    // RANDOM chapter/subject WORD MATCHING GAME
    //var gameType = $('#thegameframe').data('gametype');
    var randClass = $('#thegameframe').data('randclass');
    var randSubj =  $('#thegameframe').data('randsubj');

    num_questions = 5;
    time_limit = 15;
    setTimer(time_limit);
    game = {
        'name': 'Word Review Class ' + randClass + ' ' + randSubj,
        'prompts': [],
        'responses': [],
        'possible-teams': [1, 2, 3, 4],
        'presentation_type': 'vocabulary'
    };

    $("#gameTitle span").html(game['name']);

    function get_wordlist_succeed(words) {
        // console.log("success",words)
        if (words.length === 0) {
            LOOMA.alert("No words found for this chapter",null,true);
            return;
        }
        $(words).each(function (index, word) {
            game['prompts'].push(word['en']);
        });

        // get definitions of the words in 'prompts[]' from Looma dictionary
        var wordcount = 0;

        function word_define_succeed(res) {
            game['responses'].push(res);
            wordcount++;
            if (wordcount < game['prompts'].length)
                LOOMA.define(game['prompts'][wordcount], word_define_succeed, word_define_fail);
            else runMatch(type);
        }

        function word_define_fail(r) {console.log("word define fail", r);}

        LOOMA.define(game['prompts'][wordcount], word_define_succeed, word_define_fail);
    }

    function get_wordlist_fail(r) {console.log("get wordlist failed: ", r);}

    LOOMA.wordlist("class" + randClass.toString(),
        randSubj.toLowerCase(),
        "",
        num_questions,
        "true",
        get_wordlist_succeed,
        get_wordlist_fail);
} //end runRandom()

//////////////////////////////////
////////  CONCENTRATION GAME   ///
//////////////////////////////////

var visible_text_id_1;
var visible_text_id_2;
var $concFirstClicked;
var $concSecondClicked;

/////////////////////////////
// /////// runConc  /////////
// //////////////////////////
function runConc() {
    //showTeam();
    var prompts =   game['prompts'];
    var responses = game['responses'];

    if (prompts.length   > 8) prompts.length = 8;
    if (responses.length > 8) responses.length = 8;

    $('#question').html('Click two cards to find a match');

    curr_question = 1;
    num_questions = prompts.length;

    var allButtons = [];
    prompts.forEach(function(prompt, i){
        var button = $('<button class="concButton"  data-pair="' + i.toString() +
                       '" id="prompt-' + i.toString() +
                       '"><span class="concText" id="prompt-pair-' + i.toString() +
                       '">' + prompt + '</span></button>');
        button.click(handleConcFirstClick);
        allButtons.push(button);
    });
    responses.forEach(function(response,i){
        var button = $('<button class="concButton"  data-pair="'+i.toString() +
                       '" id="response-'+i.toString() +
                       '"><span class="concText" id="response-pair-' + i.toString() +
                       '">' + response + '</span></button>');
        button.click(handleConcFirstClick);
        allButtons.push(button);
    });

    //https://www.w3schools.com/js/js_array_sort.asp
    allButtons.sort(function(a, b){return 0.5 - Math.random()});
    allButtons.forEach(function(button){
        $('#game').append(button);
        //console.log(button[0]['children'][0])
    });

    startTimer(time_limit)

    //$('.concText').hide();
} // end runConc()



/////////////////////////////
// /////// runConcType  /////////
// for 'concentration', 'spoken concentration', 'picture concentration', 'spoken picture concentration':
// //////////////////////////
function runConcType(type) {
    var prompts =   game['prompts'];
    var responses = game['responses'];

    if (prompts.length   > 8) prompts.length = 8;
    if (responses.length > 8) responses.length = 8;

    $('#question').html('Click two cards to find a match');

    curr_question = 1;
    num_questions = prompts.length;

    var allButtons = [];

    // set up 'prompts'
    prompts.forEach(function(prompt, i){

        switch (type) {
            case 'concentration':
                var button = $('<button class="concButton"  data-word="' + prompt + '" data-pair="' + i.toString() +
                    '" id="prompt-' + i.toString() +
                    '"><span class="concText" id="prompt-pair-' + i.toString() +
                    '">' + prompt + '</span></button>');
                break;
            case 'spoken concentration':
                var button = $('<button class="concButton spoken"  data-word="' + prompt + '" data-pair="' + i.toString() +
                    '" id="prompt-' + i.toString() +
                    '"><span class="concText" id="prompt-pair-' + i.toString() +
                    '">' + speechbubble + '</span></button>');
                break;
            case'picture concentration':
                var button = $('<button class="concButton spoken"  data-word="' + prompt + '" data-pair="' + i.toString() +
                    '" id="prompt-' + i.toString() +
                    '"><span class="concText" id="prompt-pair-' + i.toString() +
                    '">' + prompt + '</span></button>');
                break;
            case 'spoken picture concentration':
                var button = $('<button class="concButton spoken"  data-word="' + prompt + '" data-pair="' + i.toString() +
                    '" id="prompt-' + i.toString() +
                    '"><span class="concText" id="prompt-pair-' + i.toString() +
                    '">' + speechbubble + '</span></button>');
                break;
        }

        button.click(handleConcFirstClick);
        allButtons.push(button);
    });

    // set up 'responses'
    responses.forEach(function(response,i){

        switch (type) {
            case 'concentration':
                var button = $('<button class="concButton"  data-pair="'+i.toString() +
                    '" id="response-'+i.toString() +
                    '"><span class="concText" id="response-pair-' + i.toString() +
                    '">' + response + '</span></button>');
                break;
            case 'spoken concentration':
                var button = $('<button class="concButton"  data-pair="'+i.toString() +
                    '" id="response-'+i.toString() +
                    '"><span class="concText" id="response-pair-' + i.toString() +
                    '">' + response + '</span></button>');
                break;
            case'picture concentration':
                var button = $('<button class="concButton"  data-pair="'+i.toString() +
                    '" id="response-'+i.toString() +
                    '"><span class="concText" id="response-pair-' + i.toString() + '">' +
                    '<img src="../content/dictionary images/' + response + '.jpg"' +
                    '</span></button>');
                break;
            case 'spoken picture concentration':
                var button = $('<button class="concButton"  data-pair="'+i.toString() +
                    '" id="response-'+i.toString() +
                    '"><span class="concText" id="response-pair-' + i.toString() + '">' +
                    '<img src="../content/dictionary images/' + response + '.jpg"' +
                    '</span></button>');
                break;
        }



        button.click(handleConcFirstClick);
        allButtons.push(button);
    });

    allButtons.sort(function(a, b){return 0.5 - Math.random()});
    allButtons.forEach(function(button){
        $('#game').append(button);
    });

    startTimer(time_limit)
} // end runConcType()


///////////////////////////////////////
// /////// concCorrectAnswer  /////////
// ///////////////////////////////////
function concCorrectAnswer() {
    $('.concButton').off('click');
    scores[curr_team-1]++;
    updateScores();

    $concFirstClicked.toggleClass ('correct');
    $concSecondClicked.toggleClass('correct');

    setTimeout(function() {
       $concFirstClicked.css( "visibility","hidden");
       $concSecondClicked.css("visibility","hidden");
        //$('.' + pair).css("visibility","hidden");
        $('.concButton').click(handleConcFirstClick);
        nextTeam();
        curr_question++;
        if (curr_question > num_questions) gameOver();
    },2000);

    nextQuestion();
}

/////////////////////////////
// /////// concWrongAnswer  /////////
// //////////////////////////
function concWrongAnswer() {
    $('.concButton').off('click');

    $concFirstClicked.toggleClass ('wrong');
    $concSecondClicked.toggleClass('wrong');

    setTimeout(function() {
        $concFirstClicked.toggleClass ('wrong').toggleClass('flipped');
        $concSecondClicked.toggleClass('wrong').toggleClass('flipped');

        $('.concButton').click(handleConcFirstClick);
        nextTeam();
    },2000);
    nextQuestion();
}
/////////////////////////////
// /////// concFlipCard  /////////
// //////////////////////////
function concFlipCard(card) {
    card.toggleClass('flipped');
    //$('#'+textId).show();
}

/////////////////////////////
///////// handleConcFirstClick  /////////
////////////////////////////

function handleConcFirstClick(event) {
    //var pair = event.target.classList[1];
    //selected_pair = $(event.target).data['pair'];
    //var num = pair.substring(5);
    //selected_pair = num;
    $concFirstClicked = $(event.currentTarget);
    //selected_pair = $concFirstClicked.data['pair'];

    //var textId = $("#"+id).find('span')[0].id;
    concFlipCard($concFirstClicked);

    if ($(this).hasClass('spoken')) {LOOMA.speak($(this).data('word'))};

    //visible_text_id_1 = textId;

    $('.concButton').off('click').click(handleConcSecondClick);
}

/////////////////////////////
///////// handleConcSecondClick  /////////
////////////////////////////

function handleConcSecondClick(event) {
    // console.log("SECOND CLICK")
    $concSecondClicked = $(event.currentTarget);

    if ($(this).hasClass('spoken')) {LOOMA.speak($(this).data('word'))};

    if ($concSecondClicked.attr('id') == $concFirstClicked.attr('id')) {
        //concFlipCard($concFirstClicked);
        $concFirstClicked = $(event.currentTarget);
        $('.concButton').off('click').click(handleConcSecondClick);
    }
    else {
        concFlipCard($concSecondClicked);
        //var pair = event.target.classList[1];  //NOTE: very fragile code - should be getting a "data-" property here
        //var num = pair.substring(5);
        //var id = event.target.id;
        //var textId = $("#"+id).find('span')[0].id;
        //$('#'+textId).show();
        //visible_text_id_2 = textId;


        $('.concButton').off('click').click(handleConcFirstClick);

        if ($concFirstClicked.data('pair') === $concSecondClicked.data('pair'))
            concCorrectAnswer();
        else concWrongAnswer();
    }
}

/////////////////////////////////////////////////////
////////  MAP GAME   ////////////////////////////////
/////////////////////////////////////////////////////

//var alreadyRight = false;
var rightAnswer;
var clickedWrong = false;
var map, baseLayer, mapJSON;

function runMap() {
    num_questions = game['prompts'].length;
    curr_question = 1;

    var map_json_file = game['geojson'];
    var map_info = game['key'];
    var map_lat =  game['startLat'];
    var map_long = game['startLong'];
    var map_zoom = game['startZoom'];
    $('#game').append('<span id="map-data" ' +
                            '  data-json="' + map_json_file  +
                            '" data-info="' + map_info +
                            '" data-lat="'  + map_lat  +
                            '" data-long="' + map_long +
                            '" data-zoom="' + map_zoom +'" >');

    game['prompts'].sort(function(a, b){return 0.5 - Math.random()});

    $('#question-number').html(LOOMA.translatableSpans('Question','प्रश्न') + ' ' + curr_question);
    $('#question').text('Click on: ' + game['prompts'][curr_question-1]);
    $('#game').append('<div id="map">');
    $('#next').text("Next Question").show();
    //$('#next').click(getNewMapQuestion);
    $('#next').click(function () {
        curr_question++;
        if (curr_question > num_questions) gameOver();
        else
        {
            nextTeam();
            nextQuestion();
        }
    });

            //var lat = game['startLat'];
            //var long = game['startLong'];
            //var zoom = game['startZoom'];

            map = L.map('map').setView([map_lat, map_long], map_zoom);
            map.options.minZoom = 1;
            map.options.maxZoom = 5;
            map.options.zoomSnap = 0.25;
            map.options.zoomDelta = 0.5;
            map.options.wheelPxPerZoomLevel = 120;

            // Raw-DOM click on the map container (capture phase) — Leaflet 0.7.2's
            // per-feature click handler is unreliable on complex MultiPolygons
            // (India, China, etc.), and map.on('click') doesn't catch those either.
            // The DOM listener fires for ANY click within the map area regardless.
            // Listen on document (capture phase) — fires first in the DOM chain.
            document.addEventListener('click', function (e) {
                var t = e.target;
                var tagName = t.tagName || '?';
                var className = (t.className && t.className.baseVal !== undefined) ? t.className.baseVal : (t.className || '');
                var mapEl = document.getElementById('map');
                var insideMap = mapEl && mapEl.contains(t);
                console.log("[doc-click] target:", tagName, "class:", className, "insideMap:", insideMap);
                if (!insideMap) return;
                handleMapClick(e);
            }, true);

            var el = document.getElementsByClassName('leaflet-container');
            for (var i = 0; i < el.length; i++)
                { el[i].style.backgroundColor = '#b8dfe6'; }  //light-blue background

            //Sets boundaries for the distance the user can span in pixels
            var southWest = L.latLng(-85.0511, -180);
            var northEast = L.latLng(85.0511, 180);
            var bounds = L.latLngBounds(southWest, northEast);
            map.setMaxBounds(bounds);
            map.on('drag', function () {map.panInsideBounds(bounds, {animate: false});});

            var link = '../content/maps/json/' + map_json_file;
            $.getJSON(link, function (result) {
                mapJSON = result;
                redrawMap(mapJSON);
            });

         startTimer(time_limit);
}  //end runMap()

var mapAdvancing = false;       // guard so a single click can't double-advance
var mapClickHandled = false;    // set when per-feature mapClick fires; the DOM-level
                                // fallback (handleMapClick) checks this to skip dupes.

// Drop a temporary marker on the click that shows the resolved country name.
// Survives even when Leaflet 0.7.2 fails to render the underlying polygon path,
// so the player always sees their click was processed.
function showMapClickFeedback(latlng, name, correct) {
    if (!map || !latlng) return;
    var bg = correct ? '#1ea54a' : '#c83232';
    var marker = L.marker(latlng, {
        icon: L.divIcon({
            html: '<span style="background:' + bg + ';color:white;padding:3px 8px;'
                + 'font-size:13px;font-family:sans-serif;font-weight:bold;white-space:nowrap;'
                + 'pointer-events:none;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.4);">'
                + (correct ? '✓ ' : '✗ ') + name + '</span>',
            iconSize: [1, 1],
            iconAnchor: [0, 0],
            className: ''
        }),
        clickable: false,
        keyboard: false
    }).addTo(map);
    setTimeout(function () { try { map.removeLayer(marker); } catch (e) {} }, 1100);
}
function mapClick(e)
{
    if (mapAdvancing) return;
    // KEY FIX: Leaflet 0.7.2's L.FeatureGroup._propagateEvent has a broken
    // extend() argument order, so for MultiPolygon features (China, India,
    // Russia, etc.) `e.target` ends up as an inner sub-polygon WITHOUT a
    // `feature` property — accessing layer.feature.properties throws.
    // `this` is the layer the handler was actually attached to (the parent
    // FeatureGroup) and DOES have `feature`.
    var layer = (this && this.feature) ? this : e.target;
    if (!layer || !layer.feature) return;
    mapClickHandled = true;
    setTimeout(function () { mapClickHandled = false; }, 50);

    rightAnswer = game['prompts'][curr_question-1];
    var infoKey = $('#map-data').data('info');
    var clickedAnswer = layer.feature.properties[infoKey];
    console.log("[map] clicked=" + clickedAnswer + " expected=" + rightAnswer);

    if(rightAnswer == clickedAnswer) //they got it right
    {   pauseTimer();

        scores[curr_team-1]++;
        updateScores();

        layer.setStyle({fillColor: 'green'});
        document.getElementById("question").innerHTML = "Correct! That is " + rightAnswer;
        showMapClickFeedback(e.latlng, rightAnswer, true);
        // Auto-advance: trigger the Next-button handler after a brief pause.
        mapAdvancing = true;
        setTimeout(function () {
            try { $('#next').click(); } finally { mapAdvancing = false; }
        }, 900);
    }
    else
    {   clickedWrong = true;
        layer.setStyle({fillColor: 'red'});
        document.getElementById("question").innerHTML =
            "Click on: " + rightAnswer + "  (You clicked " + clickedAnswer + ")";
        showMapClickFeedback(e.latlng, clickedAnswer, false);
    }
} //end mapClick()

// Ray-casting point-in-polygon. ring = [[lng, lat], ...].
function pointInRing(x, y, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0], yi = ring[i][1];
        var xj = ring[j][0], yj = ring[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

function pointInFeature(lng, lat, feature) {
    var g = feature.geometry;
    if (g.type === 'Polygon') {
        if (!pointInRing(lng, lat, g.coordinates[0])) return false;
        for (var i = 1; i < g.coordinates.length; i++) {
            if (pointInRing(lng, lat, g.coordinates[i])) return false;  // in a hole
        }
        return true;
    }
    if (g.type === 'MultiPolygon') {
        for (var p = 0; p < g.coordinates.length; p++) {
            var poly = g.coordinates[p];
            if (pointInRing(lng, lat, poly[0])) {
                var inHole = false;
                for (var h = 1; h < poly.length; h++) {
                    if (pointInRing(lng, lat, poly[h])) { inHole = true; break; }
                }
                if (!inHole) return true;
            }
        }
    }
    return false;
}

// Squared distance from (px, py) to line segment (x1, y1)-(x2, y2).
function distSqToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    if (dx === 0 && dy === 0) {
        var ex = px - x1, ey = py - y1;
        return ex * ex + ey * ey;
    }
    var t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var fx = x1 + t * dx - px;
    var fy = y1 + t * dy - py;
    return fx * fx + fy * fy;
}

// Squared minimum distance from a point to a feature's polygon edges.
// Cheap fallback for clicks landing in water adjacent to a country.
function distSqToFeature(lng, lat, feature) {
    var g = feature.geometry;
    var polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    var minSq = Infinity;
    for (var p = 0; p < polys.length; p++) {
        var ring = polys[p][0];
        for (var i = 0, len = ring.length - 1; i < len; i++) {
            var d = distSqToSegment(lng, lat,
                ring[i][0], ring[i][1],
                ring[i + 1][0], ring[i + 1][1]);
            if (d < minSq) minSq = d;
        }
    }
    return minSq;
}

// Manual, generous bboxes for countries whose polygon-derived bbox feels too
// tight for game UX. Tune these freely — they only affect the "click missed
// the polygon" snap fallback, not exact polygon hits.
// Format: {minX (lng), minY (lat), maxX (lng), maxY (lat)}.
var MANUAL_BBOXES = {
    "China":        {minX: 68,  minY: 18,  maxX: 145, maxY: 60},
    "India":        {minX: 55,  minY: 0,   maxX: 100, maxY: 42},
    "Indonesia":    {minX: 88,  minY: -20, maxX: 148, maxY: 10},
    "Russia":       {minX: 20,  minY: 35,  maxX: 180, maxY: 85},
    "Saudi Arabia": {minX: 30,  minY: 12,  maxX: 58,  maxY: 36},
    "Yemen":        {minX: 38,  minY: 5,   maxX: 58,  maxY: 22},
    "Oman":         {minX: 48,  minY: 14,  maxX: 70,  maxY: 30},
    "Iran":         {minX: 40,  minY: 22,  maxX: 67,  maxY: 42},
    "Pakistan":     {minX: 56,  minY: 18,  maxX: 80,  maxY: 38},
    "Afghanistan":  {minX: 58,  minY: 28,  maxX: 77,  maxY: 40},
    "Kazakhstan":   {minX: 45,  minY: 40,  maxX: 90,  maxY: 57},
    "Mongolia":     {minX: 86,  minY: 40,  maxX: 124, maxY: 54},
    "Uzbekistan":   {minX: 53,  minY: 36,  maxX: 76,  maxY: 47},
    "Turkmenistan": {minX: 50,  minY: 34,  maxX: 70,  maxY: 44},
    "Tajikistan":   {minX: 67,  minY: 36,  maxX: 76,  maxY: 42},
    "Kyrgyzstan":   {minX: 68,  minY: 39,  maxX: 81,  maxY: 44},
    "Laos":         {minX: 99,  minY: 13,  maxX: 108, maxY: 23},
    "Nepal":        {minX: 79,  minY: 26,  maxX: 89,  maxY: 31},
    "Bhutan":       {minX: 88,  minY: 26,  maxX: 93,  maxY: 29},
    "Japan":        {minX: 120, minY: 22,  maxX: 160, maxY: 52},
    "Philippines":  {minX: 113, minY: 3,   maxX: 136, maxY: 24},
    "Turkey":       {minX: 23,  minY: 33,  maxX: 47,  maxY: 45},
    "Bangladesh":   {minX: 84,  minY: 12,  maxX: 96,  maxY: 28},
    "Thailand":     {minX: 92,  minY: 0,   maxX: 108, maxY: 22},
    "Vietnam":      {minX: 100, minY: 5,   maxX: 120, maxY: 25},
    "Myanmar":      {minX: 88,  minY: 5,   maxX: 105, maxY: 30},
    "Cambodia":     {minX: 100, minY: 7,   maxX: 110, maxY: 17},
    "Malaysia":     {minX: 96,  minY: -3,  maxX: 122, maxY: 10},
    "Iraq":         {minX: 36,  minY: 28,  maxX: 50,  maxY: 38},
    "Syria":        {minX: 34,  minY: 32,  maxX: 43,  maxY: 38},
    "Korea":        {minX: 120, minY: 30,  maxX: 134, maxY: 40},
    "Dem. Rep. Korea": {minX: 122, minY: 36, maxX: 133, maxY: 44},
    "Sri Lanka":    {minX: 75,  minY: 0,   maxX: 86,  maxY: 12},
    "Taiwan":       {minX: 117, minY: 19,  maxX: 125, maxY: 27},
};

// Returns true if a manual bbox is defined for this country and contains the click.
function pointInManualBbox(lng, lat, name) {
    var b = MANUAL_BBOXES[name];
    if (!b) return false;
    return lng >= b.minX && lng <= b.maxX && lat >= b.minY && lat <= b.maxY;
}

// Prefer the larger country when enclaves overlap (e.g. Hong Kong inside China).
function featureBboxArea(feature) {
    if (feature._bboxArea !== undefined) return feature._bboxArea;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var polys = feature.geometry.type === 'Polygon'
                ? [feature.geometry.coordinates]
                : feature.geometry.coordinates;
    for (var p = 0; p < polys.length; p++) {
        var ring = polys[p][0];
        for (var pt = 0; pt < ring.length; pt++) {
            var x = ring[pt][0], y = ring[pt][1];
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
    }
    feature._bboxArea = (maxX - minX) * (maxY - minY);
    return feature._bboxArea;
}

// DOM click fallback. Wired up in runMap as a capture-phase listener on #map,
// so this fires for ANY click in the map area regardless of what Leaflet does
// internally with path event propagation.
function handleMapClick(domEvent) {
    console.log("[dom] click event received, target:", domEvent.target.tagName, domEvent.target.className);
    if (mapAdvancing) { console.log("[dom] blocked: mapAdvancing"); return; }
    if (domEvent.target && domEvent.target.closest &&
        domEvent.target.closest('.leaflet-control-container')) {
        console.log("[dom] blocked: leaflet control"); return;
    }
    // Defer briefly so per-feature mapClick (if it fires) sets the dedupe flag first.
    setTimeout(function () {
        if (mapClickHandled) { console.log("[dom] skipped: per-feature already handled"); return; }
        if (!baseLayer || !map) { console.log("[dom] skipped: baseLayer/map missing"); return; }

        var rect = document.getElementById('map').getBoundingClientRect();
        var containerPoint = L.point(
            domEvent.clientX - rect.left,
            domEvent.clientY - rect.top
        );
        var latlng = map.containerPointToLatLng(containerPoint);
        var lng = latlng.lng, lat = latlng.lat;
        console.log("[dom] click latlng: (" + lat.toFixed(2) + ", " + lng.toFixed(2) + ")");

        // Build the set of country names the player can actually answer with —
        // anything not in the prompt list (Indian Ocean Ter., Siachen Glacier,
        // Hong Kong, Macao, N. Cyprus) is ineligible to be the clicked country.
        var validNames = {};
        if (game && game['prompts']) {
            for (var pi = 0; pi < game['prompts'].length; pi++) validNames[game['prompts'][pi]] = true;
        }

        var matched = [], best = null, bestArea = -1, layerCount = 0;
        // Single-tier snap. Each country has ONE effective bbox (manual if
        // defined, else polygon-derived). Click in any of these bboxes -> that
        // country is a candidate. Tiebreaker: closest to the bbox center
        // (so the middle of a country's bbox always wins for that country,
        // and overlap is decided naturally by proximity to each center).
        var snapBest = null, snapCenterDsq = Infinity, snapName = null;
        var anywhereBest = null, anywhereDsq = Infinity, anywhereName = null;
        baseLayer.eachLayer(function (layer) {
            layerCount++;
            if (!layer.feature) return;
            var name = layer.feature.properties.name;
            if (!validNames[name]) return;  // skip non-prompt features

            // Determine this country's effective bbox: manual if defined,
            // otherwise computed from the polygon.
            var eff = MANUAL_BBOXES[name];
            if (!eff) {
                var g = layer.feature.geometry;
                var pminX = Infinity, pminY = Infinity, pmaxX = -Infinity, pmaxY = -Infinity;
                var polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
                for (var p = 0; p < polys.length; p++) {
                    var ring = polys[p][0];
                    for (var pt = 0; pt < ring.length; pt++) {
                        var x = ring[pt][0], y = ring[pt][1];
                        if (x < pminX) pminX = x; if (x > pmaxX) pmaxX = x;
                        if (y < pminY) pminY = y; if (y > pmaxY) pmaxY = y;
                    }
                }
                eff = {minX: pminX, minY: pminY, maxX: pmaxX, maxY: pmaxY};
            }

            if (pointInFeature(lng, lat, layer.feature)) {
                matched.push(name);
                var area = featureBboxArea(layer.feature);
                if (area > bestArea) { bestArea = area; best = layer; }
            }

            // Bbox snap candidate: click inside effective bbox, tiebreaker by
            // distance to bbox center.
            var bboxHit = (lng >= eff.minX && lng <= eff.maxX && lat >= eff.minY && lat <= eff.maxY);
            if (bboxHit) {
                var cx = (eff.minX + eff.maxX) / 2;
                var cy = (eff.minY + eff.maxY) / 2;
                var dsq = (lng - cx) * (lng - cx) + (lat - cy) * (lat - cy);
                if (dsq < snapCenterDsq) {
                    snapCenterDsq = dsq; snapBest = layer; snapName = name;
                }
            }

            // Absolute-nearest fallback for clicks outside ALL bboxes.
            var dCoast = distSqToFeature(lng, lat, layer.feature);
            if (dCoast < anywhereDsq) {
                anywhereDsq = dCoast; anywhereBest = layer; anywhereName = name;
            }
        });
        console.log("[dom] checked " + layerCount + " layers, matched: " + JSON.stringify(matched));

        if (!best) {
            if (snapBest) {
                console.log("[dom] snap (in bbox, closest-center): " + snapName);
                best = snapBest;
            } else {
                console.log("[dom] snap (no bbox hit, absolute nearest): " + anywhereName + " (sq-dist=" + anywhereDsq.toFixed(2) + ")");
                best = anywhereBest;
            }
        }
        if (!best) { console.log("[dom] no country at all"); return; }

        rightAnswer = game['prompts'][curr_question - 1];
        var infoKey = $('#map-data').data('info');
        var clickedAnswer = best.feature.properties[infoKey];
        console.log("[map-fallback] clicked=" + clickedAnswer + " expected=" + rightAnswer);

        if (rightAnswer == clickedAnswer) {
            pauseTimer();
            scores[curr_team - 1]++;
            updateScores();
            best.setStyle({fillColor: 'green'});
            document.getElementById("question").innerHTML = "Correct! That is " + rightAnswer;
            showMapClickFeedback(latlng, rightAnswer, true);
            mapAdvancing = true;
            setTimeout(function () {
                try { $('#next').click(); } finally { mapAdvancing = false; }
            }, 900);
        } else {
            clickedWrong = true;
            best.setStyle({fillColor: 'red'});
            document.getElementById("question").innerHTML =
                "Click on: " + rightAnswer + "  (You clicked " + clickedAnswer + ")";
            showMapClickFeedback(latlng, clickedAnswer, false);
        }
    }, 20);
}

// Highlights the area that the mouse is hovering over in gray
function highlightMapFeature(e)
{
    var layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#666',
        fillOpacity: 0.7
    });
    layer.bringToFront();
}   //End of highlight function

// Makes sure that once the country is deselected the gray is gone
function resetMapHighlight(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 1,
        color: 'black'
    });
}

function mapStyle(feature)  {
    return {
        fillColor: 'white',
        weight: 1,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.8
    }
}

function mapOnEachFeature(feature, layer) {
    layer.on({
    mouseover: highlightMapFeature,
    mouseout: resetMapHighlight,
    click: mapClick
    });
}

function redrawMap(mapJson) {
    baseLayer = L.geoJson(mapJson, {
        style: mapStyle,
        onEachFeature: mapOnEachFeature
    });
    baseLayer.addTo(map);
    drawDebugBboxes();
}

// Visualize every country's EFFECTIVE bbox (the one the snap actually uses).
// Manual bboxes drawn red, auto-derived polygon bboxes drawn blue. Toggle by
// adding ?bboxes=1 to the URL.
var debugBboxLayer = null;
function drawDebugBboxes() {
    if (!/[?&]bboxes/.test(window.location.search)) return;
    if (!map || !baseLayer) return;
    if (debugBboxLayer) { map.removeLayer(debugBboxLayer); }
    debugBboxLayer = L.layerGroup();

    // Collect set of game-valid country names.
    var validNames = {};
    if (game && game['prompts']) {
        for (var pi = 0; pi < game['prompts'].length; pi++) validNames[game['prompts'][pi]] = true;
    }

    function addRect(name, b, color) {
        L.rectangle(
            [[b.minY, b.minX], [b.maxY, b.maxX]],
            {color: color, weight: 2, opacity: 0.7, fill: false, fillOpacity: 0, clickable: false}
        ).addTo(debugBboxLayer);
        L.marker([b.maxY, b.minX], {
            icon: L.divIcon({
                html: '<span style="background:' + color + ';color:white;padding:1px 4px;'
                    + 'font-size:10px;font-family:sans-serif;white-space:nowrap;pointer-events:none;'
                    + 'border-radius:2px;opacity:0.85;">' + name + '</span>',
                iconSize: [1, 1],
                iconAnchor: [0, 0],
                className: ''
            }),
            clickable: false,
            keyboard: false
        }).addTo(debugBboxLayer);
    }

    // Iterate every feature and draw its effective bbox.
    baseLayer.eachLayer(function (layer) {
        if (!layer.feature) return;
        var name = layer.feature.properties.name;
        if (!validNames[name]) return;
        if (MANUAL_BBOXES[name]) {
            addRect(name, MANUAL_BBOXES[name], 'rgba(220,0,0,0.85)');
        } else {
            // Polygon-derived bbox.
            var g = layer.feature.geometry;
            var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            var polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
            for (var p = 0; p < polys.length; p++) {
                var ring = polys[p][0];
                for (var pt = 0; pt < ring.length; pt++) {
                    var x = ring[pt][0], y = ring[pt][1];
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
            }
            addRect(name, {minX: minX, minY: minY, maxX: maxX, maxY: maxY}, 'rgba(0,0,200,0.85)');
        }
    });

    debugBboxLayer.addTo(map);

    // Belt-and-suspenders: Leaflet 0.7.2's `clickable: false` only removes the
    // cursor class — the SVG paths and marker icons still catch clicks where
    // they're rendered. Force pointer-events: none on every element so the
    // overlay is purely visual and clicks pass through to the actual map.
    // Also inject a CSS rule as a backstop for elements added later (next
    // question redraws the bbox layer).
    if (!document.getElementById('bbox-debug-css')) {
        var s = document.createElement('style');
        s.id = 'bbox-debug-css';
        s.textContent =
            '.bbox-debug-rect, .bbox-debug-label, .bbox-debug-label * { pointer-events: none !important; }';
        document.head.appendChild(s);
    }
    setTimeout(function () {
        var nPath = 0, nIcon = 0;
        debugBboxLayer.eachLayer(function (l) {
            if (l._path) {
                l._path.style.pointerEvents = 'none';
                l._path.setAttribute('class', (l._path.getAttribute('class') || '') + ' bbox-debug-rect');
                nPath++;
            }
            if (l._icon) {
                l._icon.style.pointerEvents = 'none';
                l._icon.setAttribute('class', (l._icon.getAttribute('class') || '') + ' bbox-debug-label');
                nIcon++;
            }
        });
        console.log('[bbox-overlay] disabled pointer-events on', nPath, 'paths and', nIcon, 'icons');
    }, 0);
}

    //gets the new map question
    function getNewMapQuestion() {
        curr_question++;
        nextTeam();
        nextQuestion();
}

/////////////////////////////
///////// runYesNo  /////////
////////////////////////////  NOTE: 'yesno' is a trivial game, included here as a template for how to code a new game type

function runYesNo() {
    $('#thegameframe').show();
    $('#timer').show();
    $('#scoreboard').show();
    num_questions = 10;
    time_limit = 8;

    $('#game').append('<button id="yes_button" class="yesno">CORRECT</button>');
    $('#game').append('<button id="no_button"  class="yesno">WRONG</button>');

    $('#yes_button').click(correctAnswer);
    $('#no_button').click( wrongAnswer);

    startTimer(time_limit);
} //end runYesNo()

// /////// nextTeam  /////////
function nextTeam() {
    if (curr_team < num_teams) curr_team++;
    else curr_team = 1;
    showTeam();
}

function showTeam() {
    if (num_teams > 1) { $("#current-team").html(LOOMA.translatableSpans('Team ','टीम') + ' ' + curr_team.toString() + '&nbsp'); }
}

/////////////////////////////
///////// clearScreen  /////////
////////////////////////////
function clearScreen() {
    $("#question-number").empty();
    $("#question").empty();
    $("#answers").empty();
}

/////////////////////////////
///////// initScores  ///////
/////////////////////////////

// for all teams that will be playing, show team score [=0] and progress bar
function initScores(num_teams) {
    scores = new Array(num_teams).fill(0);
    for (var i = 1; i <= num_teams; i++) {
        var id = 'teamscore-' + i.toString();
        $('#' + id + ' span.teamscore').html(scores[i-1]);
        $('#' + id).show();
        $('#progress-' + i + ' .inner-progress').width(0);
        $('#progress-' + i).show();
    }
}

/////////////////////////////
///////// updateScores  /////
/////////////////////////////
function updateScores() {
    for (var i = 1; i <= num_teams; i++) {
        var id = 'teamscore-' + i.toString();
        $('#' + id + ' span.teamscore').html(scores[i-1]);
        updateProgress (i, scores[i-1], num_questions);
    }
}

/////////////////////////////
///////// updateProgress  /////////
////////////////////////////
function updateProgress(team, score, maxScore) {
    var percentage = ((score/maxScore)*100);
    $('#progress-' + team + ' .inner-progress').width(percentage + '%');
}

//////////////////////////////////
///////// nextQuestion  /////////
/////////////////////////////////
function nextQuestion() {

    if (curr_question > num_questions) gameOver();
    else {
        startTimer(time_limit);

        switch (game['presentation_type']) {
            case 'multiple choice':
                //var prompts = game['prompts'];
                if (curr_question <= game['prompts'].length) {
                    showTeam();
                    $("#question-number").html(LOOMA.translatableSpans('Question','प्रश्न') + " "+(curr_question));
                    mcTries = 1;
                    var questionData = game['prompts'][curr_question-1];
                    var question = questionData['question'];
                    $("#question").html(question);

                    var answers = [];
                    answers.push(questionData['correctAns']);
                    questionData['wrongAns'].forEach( function(wrong){ answers.push(wrong); });

                    answers.sort(function(a, b){return 0.5 - Math.random()});

                    $('#answers').empty();

                    answers.forEach(function(ans){
                        if (ans === questionData['correctAns']) {
                            var button = $('<button class="answer correct">' + ans + '</button>');
                            button.click(mcCorrectAnswer);
                            $("#answers").append(button);
                            //$("#answers").append("<br/><br/>");
                        } else {
                            var button = $('<button class="answer wrong">' + ans + '</button>');
                            button.click(mcWrongAnswer);
                            $("#answers").append(button);
                            //$("#answers").append("<br/><br/>");
                        }
                    });
                } else {
                    gameOver();
                }
                break;
            case 'vocabulary':
                //$('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');
                $('#game').append('<div id="prompts"></div>');
                $('#game').append('<div id="responses"></div>');

                // get definitions of the words in 'prompts[]' from Looma dictionary
                var wordcount = 1;
                $(game['prompts']).each(function (index, word) {
                    function word_define_succeed(res) {
                        game['responses'].push(res);
                        wordcount++;
                        //if (wordcount > game['prompts'].length) runMatch(type);
                    }

                    function word_define_fail(r) {
                        console.log("fail", r);
                    }

                    LOOMA.define(word, word_define_succeed, word_define_fail);
                });
                break;
            case 'matching':
                //$('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');
                $('#game').append('<div id="prompts"></div>');
                $('#game').append('<div id="responses"></div>');
                //runMatch(type);
                break;
            // * CP NEW (3)) * //
            case 'picture':
                $('#game').append('<div id="prompts"></div>');
                $('#game').append('<div id="responses"></div>');
                // * END CP NEW (3) * //
            case 'concentration':
                //$('#game').append('<div id="buttons"></div>');
                //runConc();
                break;
            case 'spoken concentration':
                break;
            case 'map':
                $('#question-number').text(' Question ' + curr_question);
                $('#question').text('Click on: ' + game['prompts'][curr_question-1]);
                baseLayer.clearLayers();
                redrawMap(mapJSON);
                //alreadyRight = false;
                //runMap();
                break;
            case 'yesno':
                break;
            case 'timeline':
                //runTimeline();
                break;
            default:
                break;
        }
    }
}  //  end nextQuestion()

/////////////////////////////
//////// correctAnswer  /////
/////////////////////////////
function correctAnswer () {
    pauseTimer();
    clearScreen();

    scores[curr_team-1]++;
    updateScores();

    nextTeam();
    curr_question++;
    setTimer(time_limit);

    if (game['presentation_type'] === 'matching'||
             game['presentation_type'] === 'spoken matching' ||
             game['presentation_type'] === 'spoken to picture' ||
             game['presentation_type'] === 'picture matching')
            {
                // remove P/R pair from activeMatch arrays
                //nextQuestion();
                runMatch(type);
            }
    else if (game['presentation_type'] != 'vocabulary') nextQuestion();
    else startTimer();
}

/////////////////////////////
// /////// wrongAnswer  /////////
// //////////////////////////
function wrongAnswer () {
    pauseTimer();
    clearScreen();
    nextTeam();
    curr_question++;
    setTimer(time_limit);
    if (game['presentation_type'] != 'matching' &&
        //game['presentation_type'] != 'multiple choice'       &&
        game['presentation_type'] != 'vocabulary') nextQuestion();
    else startTimer();
}

function timedOut(){
    pauseTimer();
    if (num_teams > 1) LOOMA.alert('Timed out. Team ' + ((curr_team % num_teams)+1).toString() + ' plays', 3, true, wrongAnswer);
}
/////////////////////////////
///////// gameOver  /////////
/////////////////////////////
function gameOver() {
    $('#game').hide();
    $('#next').hide();
    $('#top').hide();

    $('#gameOverFrame').show();
    pauseTimer();
    $timer.html('');
    $("#message").html("Game Over");
    $("#scoreList").empty();
    for (var i = 1; i <= num_teams; i++) {
        var results = $('<h5>Team '+i.toString()+': '+(scores[i-1]).toString()+' correct</h5>');
        if (scores[i-1] > 0 && scores[i-1] == Math.max(...scores)) results.append('<span class="red"> WINNER</span>');
        $("#scoreList").append(results);
    }
    try {
        // Best team's correct-count is the canonical game score; total questions is num_questions.
        var best = Math.max.apply(null, scores);
        var totalQ = (typeof num_questions === 'number' && num_questions > 0)
            ? num_questions
            : (Array.isArray(scores) && scores.length ? best : 0);
        if (window.LOOMA && LOOMA.telemetry) {
            LOOMA.telemetry.score('game', {
                game_id: game_id, game_type: type,
                grade: grade, subject: subject, chapter_id: ch_id,
                correct: best, total: totalQ,
                num_teams: num_teams,
            });
        }
    } catch (e) { /* never let telemetry break game flow */ }
    var replayButton = $('<a href="looma-game.php' +
                        '?id='+ game_id +
                        '&class='+ grade +
                        '&subject='+ subject +
                        '&type='+ type +
                        '&ch_id='+ ch_id +
        '"><button> Replay Game </button></a>');

    var gamesHomeButton = $('<a href="looma-games.php"><button> Games Home Page </button></a>');

    $("#scoreList").append(replayButton);
    $("#scoreList").append("<br/><br/>");
    $("#scoreList").append(gamesHomeButton);
}


/////////////////////////////
///////// runSort  /////////
////////////////////////////
    function runSort() {
        $("#optionsframe").hide();
        $('#thegameframe').hide();
        $('#timer').hide();
        $('#scoreboard').hide();

        $("#sortgame").show();

        function setBins() {
            $('.heading').hide();
            $('.bin').hide();

            for (var i = 0; i < game['bins'].length; i++) {
                $('#heading' + i).text(game['bins'][i]['heading']).show();
                $('#bin' + i).show().droppable({scope:game['bins'][i]['scope']});
            }
        }

        function setWords() {
            var list = [];
            for (var i = 0; i < game['words'].length; i++) {
                list[i] = {'key':game['words'][i]['en'], 'value':game['words'][i]['bin']};
            }
            list.sort(() => Math.random() - 0.5);
            return list.slice();
        };

        function startSortGame() {
            words = setWords();
            $('#words').show();
            nextWord();
            $(".bin").empty();
        }

        function nextWord() {
            if (words.length === 0) {
                $('#words').empty().hide();
                LOOMA.alert('<p>Game over. Good work.</p>Click "Play Again" to play again', 10, true);
                return;
            }

            var $word = $("<p class='word " + words[0].value + "'>" + (words[0].key) + "</p>");
            $word.draggable({revert:'invalid',
                cursor:'move',
                helper:'clone',
                scope:words[0].value,
                start: function( event, ui ) {ui.helper.css('font-size','1em')}}  //.addClass('word')
            );
            $('#words').empty().append($word);
            words = words.slice(1); // removes the first word from 'words'
        };

            $('button.speak').off('click').click(function () {
                var selectedString = document.getSelection().toString();
                var toSpeak = (selectedString ? selectedString : $('#words p.word').text());
                LOOMA.speak(toSpeak);
            }); //end speak button onclick function

            $('button.lookup').off('click').click(function(){
                var toString = window.getSelection().toString();
                var toString = (toString ? toString : $('#words p.word').text());
                LOOMA.popupDefinition(toString.split(' ')[0], 15, 'en');
            });

            $(".bin").droppable({
                accept:".word",
                drop: function(event, ui) {
                    // clone(true) to retain all DATA for the element
                    var $dest = ui.helper.clone(true).addClass('dragging').off();
                    //NOTE: crucial to "off()" event handlers,
                    //or the new element will still be linked to the old
                    $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
                    $dest.removeAttr('style').addClass('dropped');
                    $dest.appendTo(event.target);

                    nextWord();
                }
            });

            $('#next_button').click(startSortGame);

            setBins();
            startSortGame();
    };  // end runSort()

    function showGame() {
        $('#gameOverFrame').hide();
        $('#thegameframe').show();
        $('#timer').show();
        $('#scoreboard').show();
    };

    /////////////////////////////
    ///////// fail  /////////
    ////////////////////////////
        function game_not_found(r) {LOOMA.alert("Game not found",5);};

    /////////////////////////////
    ///////// succeed  /////////
    ////      fetched a game from mongoDB   /////
    ////////////////////////////
        function game_found(result) {
            game = result;
            $("#gameTitle").html(LOOMA.translatableSpans("Game", "खेल") + ": " + game['title']);
            type = game['presentation_type'];
            subject = ('subject' in game) ? game['subject'] : null;
            grade = ('class' in game) ? game['class'] : null;
            ch_id = ('ch_id' in game) ? game['ch_id'] : null;

            if (type === 'sort') runSort(game);

            else {
                $("#optionsframe").show();
                $('.teamnumber').click(function () {
                    $("#optionsframe").hide();
                    showGame();

                    num_teams = $(this).data('team');
                    initScores(num_teams);

                    curr_team = 1;
                    showTeam();
                    curr_question = 1;

                    // some games dont have an entry in mongoDB 'games' collection, instead they are randomly generated
                    // based on grade and subject and [sometimes] chapter
                    if      (type === 'yesno')     runYesNo();
                    else if (type === 'random')    runRandom();
              //      else if (type === 'vocab')     runVocab(grade, subject, ch_id);
              //      else if (type === 'arith')     runArith(grade, subject, ch_id);
               //     else if (type === 'picture')   runPicture(grade, subject, ch_id);
               //     else if (type === 'speak')     runRandomSpeak(grade, subject, ch_id);
               //     else if (type === 'translate') runTranslate(grade, subject, ch_id);

                else {  // regular game

                    time_limit = (game['timeLimit']) ? game['timeLimit'] : 30;
                    setTimer(time_limit);

                    switch (type) {
                        case 'concentration':
                        case 'spoken concentration':
                        case 'picture concentration':
                        case 'spoken picture concentration':
                            runConcType(type);
                            break;
                        case 'matching':
                        case 'spoken matching':
                        case 'spoken to picture':
                        case 'picture matching':

                            matches_made = 0;
                            activeMatchPrompts = [];
                            activeMatchResponses = [];
                            num_questions = game['prompts'].length;

                            prompts =   game['prompts'];
                            responses = game['responses'];
                            $('#game').append('<div id="prompts"></div>');
                            $('#game').append('<div id="responses"></div>');
                            //console.log(prompts)
                            //console.log(responses)
                            runMatch(type);
                            break;

                        case 'picture':
                            runPicture(grade, subject, ch_id);
                            break;
                        case 'speak':
                            runRandomSpeak(grade, subject);
                            break;
                        case 'translate':
                            runTranslate(grade, subject);
                            break;

                        case 'multiple choice':
                            runMC();
                            break;
                        case 'map':
                            runMap();
                            break;
                        case 'timeline':
                            runTimeline();
                            break;
                        default:
                            $("#gameTitle").html("Game type not recognized");
                            break;
                        }
                    }
                });
            }
};   // end game_found()


/////////////////////////////
///////// runGame  /////////  NOTE: gets a game from mongoDB by "id" and runs it
////////////////////////////

function runGame (id) {
    $.ajax(
        "looma-database-utilities.php",
        {   type: 'GET',
            dataType: "json",
            data: "collection=games&cmd=getGame&gameId=" + id,
            error:   game_not_found,
            success: game_found
        });
} //  end runGame()

function buildKeywordGame(keywordgame) {
    // 'keywordgame is JSON of keywords with fields 'en', 'np', 'def' and 'ndef'
    // build 'game[]' array
    var game = []; game['prompts'] = []; game['responses'] = [];
    game['title'] = "Key Vocabulary";
    game['presentation_type'] = 'matching';
    game['ch_id'] = "";
    game['subject'] = "";
    game['class'] = "";
    keywordgame.forEach( function(item, i)
    {
      game['prompts'][i] = item.en;
      game['responses'][i] = item.def;
    });
    game_found(game);
    //runMatch('matching');

};

function runKeyword (ch_id) {
    // get keyword file
    $.ajax(
        "looma-database-utilities.php",
        {   type: 'GET',
            dataType: "json",
            data: "cmd=getKeyVocabulary&ch_id=" + ch_id,
            error:   game_not_found,
            success: buildKeywordGame
        });

};

///////////////////////////////////////
///////// DOCUMENT READY  ////////////
//////////////////////////////////////

$(document).ready (function() {
    var $game = $('#thegameframe');
    $timer =  $('#timer-count');
    game_id = $game.data('gameid');
    if (game_id) runGame(game_id);
    else if ($game.data('type') === 'keywords' && $game.data('ch_id')) {
        runKeyword($game.data('ch_id'));
    }
    else {
        var randomGame = {};
        randomGame['presentation_type'] = $game.data('type');
        randomGame['class'] =             $game.data('class');
        randomGame['subject'] =           $game.data('subject');
        randomGame['ch_id'] =             $game.data('ch_id');
        randomGame['title'] = LOOMA.capitalize($game.data('type')) + ' game for ' + $game.data('class') + ' ' + LOOMA.capitalize($game.data('subject'));
        game_found(randomGame);
    };
    toolbar_button_activate("games");

});