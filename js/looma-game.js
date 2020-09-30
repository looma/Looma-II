'use strict';

var $timer;
var $scoreboard;

var game_data = {};
var time_limit;
var score_method;
var game_type;
var game_id;
var game_class;
var game_subject;
var num_teams;
var curr_team = 1;

var index;

var num_questions;
var curr_question = 1;
var promptButtons, responseButtons;

var scores;
var clickedEventID;

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
    $('#game').append('<span id="question-number">');
    $('#game').append('<span id="question">');
    $('#game').append('<div id="answers">');

    num_questions = game_data['prompts'].length;
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
    
    if ($(event.currentTarget).data()['word']) LOOMA.speak($(event.currentTarget).data()['word']);

    if (previousClick === 'response') {checkMatch();
    } else {
        previousClick = 'prompt'
    }
    //var num_pairs = game_data['prompts'].length;
    //for (var i = 0; i < num_pairs; i++) {
        //$('#response-'+i.toString()).click(matchResponseClick);}
}  // end matchPromptClick()

/////////////////////////////
// /////// matchResponseClick  /////////
// //////////////////////////
function matchResponseClick(event) {
    //$('.response').css('color','black');
    //var selected_resp = event.target.className.split(' ')[1];
    //$('.response.'+selected_resp).css('color','blue');
    
    
    $('.response.not-done').removeClass('clicked');
    selected_resp = $(event.currentTarget).data()['pair'];
    $('.response.not-done[data-pair=' + selected_resp + ']').addClass('clicked');
    
    if (previousClick === 'prompt') {checkMatch();
    } else {
        previousClick = 'response'
    }
} //end matchResponse()

// * Caroline 2020 09 * //
/* BUG FIXED: Matching game sometimes eliminating non-matching pairs
 * CHANGES: (1) Added variables r, p at the top to store the matching pair
 * indices and replace selected_resp and selected_prompt in the setTimeout()
 * functions. (2) Set selected_resp, selected_prompt, and previousClick to
 * null outside of the setTimeout() functions.
*/

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
  
        selected_resp = null;
        selected_prompt = null;
        previousClick = null;
   
        setTimeout(function() {
            //$('.'+selected_resp).hide();
            $('.response[data-pair=' + r + ']').removeClass('matched not-done clicked').addClass('done').off('click');
            $('.prompt[data-pair=' + p + ']').removeClass('matched not-done clicked').addClass('done').off('click');
            
            correctAnswer();
            //showTeam();
            //if (matches_made === game_data['prompts'].length) gameOver();
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
}  // end matchResponseClick()

//////////////////////////////
///////// runMatch  /////////
//////////////////////////////  NOTE: runs a 'matching' game using 'prompts[]' and 'responses[]'
/////////////////////////////
function runMatch() {
    showTeam();
    matches_made = 0;
    num_questions = 5;
    
    //$('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');
    
    $('#question').html('Click left and right items to find a match');
    
    var prompts =   game_data['prompts'];
    var responses = game_data['responses'];
    //console.log(prompts)
    //console.log(responses)
     promptButtons = [];
     responseButtons = [];
    prompts.forEach(function(prompt, i){
        var button = $('<button class="prompt not-done"  data-word="' + prompt +  '" data-pair="' + i.toString() + '" id="prompt-'+i.toString()+'">' + prompt + '</button>');
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
} // end runMatch()


//////////////////////////////
///////// runPicture  /////////
//////////////////////////////

function getPictureWords(grade, subj, id, count, random){
    LOOMA.picturewordlist(grade, subj, id, count, random, pictureListSucceed, pictureListFail);
}

function pictureListSucceed(words){
    //console.log('Success, found ${result.length} words: ${result}');
    promptButtons = [];
    responseButtons = [];
    
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

function runPicture(grade, subject) {
    showTeam();
    matches_made = 0;
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');
    $('#question').html('Click left and right items to find a match.');

    num_questions = 5;
    var random = true;
    
    LOOMA.picturewordlist(grade, subject    , null, num_questions, random, pictureListSucceed, pictureListFail);
    //getPictureWords(grade, subject, null, num_questions, random);
    time_limit = 45;
    startTimer(time_limit);
    
}  // END runPicture() //


//////////////////////////////
///////// runSpeak  /////////
//////////////////////////////

function getSpeakWords(grade, subj, id, count, random){
    LOOMA.wordlist(grade, subj, id, count, random, speakListSucceed, speakListFail);
}

function speakListSucceed(result){
    console.log('Success, found ${result.length} words: ${result}');
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

function runSpeak(grade, subject) {
    showTeam();
    matches_made = 0;
    $('#game').append('<div id="prompts"></div>');
    $('#game').append('<div id="responses"></div>');
    $('#question').html('Click left and right items to find a match.');
    
    num_questions = 5;
    var random = true;
    time_limit = 15;
    
    getSpeakWords(grade, subject, null, num_questions, random);
}  // END runSpeak() //


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
    
    getTranslateWords(grade, subject, null, num_questions, random);
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
    game_data = {
        'name': 'Word Review Class ' + randClass + ' ' + randSubj,
        'prompts': [],
        'responses': [],
        'possible-teams': [1, 2, 3, 4],
        'presentation_type': 'vocabulary'
    };
    
    $("#gameTitle").html("Game: " + game_data['name']);
    
    function get_wordlist_succeed(words) {
        // console.log("success",words)
        $(words).each(function (index, word) {
            game_data['prompts'].push(word['en']);
        });
    
        // get definitions of the words in 'prompts[]' from Looma dictionary
        var wordcount = 0;
    
        function word_define_succeed(res) {
            game_data['responses'].push(res);
            wordcount++;
            if (wordcount < game_data['prompts'].length)
                LOOMA.sienna_define(game_data['prompts'][wordcount], word_define_succeed, word_define_fail);
            else runMatch();
        }
        
        function word_define_fail(r) {console.log("word define fail", r);}
    
        LOOMA.sienna_define(game_data['prompts'][wordcount], word_define_succeed, word_define_fail);
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
    var prompts =   game_data['prompts'];
    var responses = game_data['responses'];

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
    //visible_text_id_1 = textId;
    
    $('.concButton').off('click').click(handleConcSecondClick);
}

/////////////////////////////
///////// handleConcSecondClick  /////////
////////////////////////////

function handleConcSecondClick(event) {
    // console.log("SECOND CLICK")
    $concSecondClicked = $(event.currentTarget);
    
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

var alreadyRight = false;
var rightAnswer;
var clickedWrong = false;
var map, baseLayer, mapJSON;

function runMap() {
    num_questions = game_data['prompts'].length;
    curr_question = 1;
    
    var map_json_file = game_data['geojson'];
    var map_info = game_data['key'];
    var map_lat =  game_data['startLat'];
    var map_long = game_data['startLong'];
    var map_zoom = game_data['startZoom'];
    $('#game').append('<span id="map-data" ' +
                            '  data-json="' + map_json_file  +
                            '" data-info="' + map_info +
                            '" data-lat="'  + map_lat  +
                            '" data-long="' + map_long +
                            '" data-zoom="' + map_zoom +'" >');
    
    game_data['prompts'].sort(function(a, b){return 0.5 - Math.random()});
    
    $('#question-number').text('Question ' + curr_question);
    $('#question').text('Click on: ' + game_data['prompts'][curr_question-1]);
    $('#game').append('<div id="map">');
    $('#next').text("Next Question").show();
    //$('#next').click(getNewMapQuestion);
    $('#next').click(function () {
            curr_question++;
            nextTeam();
            nextQuestion();
    });
    
            //var lat = game_data['startLat'];
            //var long = game_data['startLong'];
            //var zoom = game_data['startZoom'];
            
            map = L.map('map').setView([map_lat, map_long], map_zoom);
            map.options.minZoom = 1;
            map.options.maxZoom = 5;
            
            var el = document.getElementsByClassName('leaflet-container');
            for (var i = 0; i < el.length; i++)
                { el[i].style.backgroundColor = '#b8dfe6'; }  //light-blue background
            
            //Sets boundaries for the distance the user can span in pixels
            var southWest = L.latLng(-85.0511, -180);
            var northEast = L.latLng(85.0511, 180);
            var bounds = L.latLngBounds(southWest, northEast);
            map.setMaxBounds(bounds);
            map.on('drag', function () {map.panInsideBounds(bounds, {animate: false});});
            
            var link = '../maps2018/json/' + map_json_file;
            $.getJSON(link, function (result) {
                mapJSON = result;
                redrawMap(mapJSON);
            });
            
         startTimer(time_limit);
}  //end runMap()

function mapClick(e)
{
    pauseTimer();
    var layer = e.target;
    //var currentQuestion = document.getElementById("question");
    //if(!alreadyRight) { //prevents it from going red after you have gotten it right
        rightAnswer = game_data['prompts'][curr_question-1];
    //}
    
    //var infoKey = document.getElementById("question").getAttribute("data-info");
    var infoKey = $('#map-data').data('info');
    var clickedAnswer = layer.feature.properties[infoKey];
    //var clickedAnswer = game_data['key'];
    if(rightAnswer == clickedAnswer) //they got it right
    {   layer.setStyle({fillColor: 'green'});
        document.getElementById("question").innerHTML = "Correct! That is " + rightAnswer;
        if(!alreadyRight) //&& !clickedWrong)
            { alreadyRight = true;
              LOOMA.alert("Correct! That is " + rightAnswer,4,false,correctAnswer);
            }
    }
    else
    {   clickedWrong = true;
        layer.setStyle({fillColor: 'red'});
    }
} //end mapClick()

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
////////////////////////////
function runYesNo() {
    // settings
    num_questions = 10;
    time_limit = 8;
    
    $('#game').append('<button id="yes_button" class="yesno">YES</button>');
    $('#game').append('<button id="no_button"  class="yesno">NO</button>');
    
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
    if (num_teams > 1) { $("#current-team").html('Team ' + curr_team.toString()); }
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
        $('#progress-' + i + ' .sienna-progress').width(0);
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
    $('#progress-' + team + ' .sienna-progress').width(percentage + '%');
}

//////////////////////////////////
///////// nextQuestion  /////////
/////////////////////////////////
function nextQuestion() {
    
    if (curr_question > num_questions) gameOver();
    else {
        startTimer(time_limit);
        
        switch (game_data['presentation_type']) {
            case 'multiple choice':
                //var prompts = game_data['prompts'];
                if (curr_question <= game_data['prompts'].length) {
                    showTeam();
                    $("#question-number").html("Question "+(curr_question)+":  ");
                    mcTries = 1;
                    var questionData = game_data['prompts'][curr_question-1];
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
                $(game_data['prompts']).each(function (index, word) {
                    function word_define_succeed(res) {
                        game_data['responses'].push(res);
                        wordcount++;
                        //if (wordcount > game_data['prompts'].length) runMatch();
                    }
                    
                    function word_define_fail(r) {
                        console.log("fail", r);
                    }
                    
                    LOOMA.sienna_define(word, word_define_succeed, word_define_fail);
                });
                break;
            case 'matching':
                //$('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');
                $('#game').append('<div id="prompts"></div>');
                $('#game').append('<div id="responses"></div>');
                //runMatch();
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
            case 'map':
                $('#question-number').text('Question ' + curr_question);
                $('#question').text('Click on: ' + game_data['prompts'][curr_question-1]);
                baseLayer.clearLayers();
                redrawMap(mapJSON);
                alreadyRight = false;
                //runMap();
                break;
            case 'yesno':
                //setTimer(time_limit);
                //runYesNo();
                break;
            case 'timeline':
                //runTimeline();
                break;
            default:
                break;
        }
    }
}

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
    if (game_data['presentation_type'] != 'matching' &&
        game_data['presentation_type'] != 'vocabulary') nextQuestion();
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
    if (game_data['presentation_type'] != 'matching' &&
        //game_data['presentation_type'] != 'multiple choice'       &&
        game_data['presentation_type'] != 'vocabulary') nextQuestion();
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
    for (var i = 1; i <= num_teams; i++) {
        var results = $('<h5>Team '+i.toString()+': '+(scores[i-1]).toString()+' correct</h5>');
        if (scores[i-1] > 0 && scores[i-1] == Math.max(...scores)) results.append('<span class="red"> WINNER</span>');
        $("#scoreList").append(results);
    }
    var replayButton = $('<a href="looma-game.php' +
                        '?id='+ game_id +
                        '&class='+ game_class +
                        '&subject='+ game_subject +
                        '&type='+ game_type +
                        '"><button> Replay Game </button></a>');
    
    var gamesHomeButton = $('<a href="looma-games.php"><button> Games Home Page </button></a>');
    
    $("#scoreList").append(replayButton);
    $("#scoreList").append("<br/><br/>");
    $("#scoreList").append(gamesHomeButton);
}

    /////////////////////////////
    ///////// fail  /////////
    ////////////////////////////
        function get_game_fail(r) {
            LOOMA.alert("Game not found");
            console.log("failed to find game"); }
        
    /////////////////////////////
    ///////// succeed  /////////
    ////////////////////////////
        function get_game_succeed(result) {
            game_data = result;
            
            time_limit = ( game_data['timeLimit']) ? game_data['timeLimit'] : 30;
            setTimer(time_limit);
            $("#gameTitle").html("Game: " + game_data['title']);
            
            //nextQuestion();
            
            switch (game_data['presentation_type']) {
                case 'concentration':
                    runConc();
                    break;
                case 'matching':
                    runMatch();
                    break;
                case 'picture':
                    runPicture(game_class, game_subject);
                    break;
                case 'speak':
                    runSpeak(game_class, game_subject);
                    break;
                case 'translate':
                    runTranslate(game_class, game_subject);
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

/////////////////////////////
///////// runGame  /////////  NOTE: gets a game from Mongo by "id" and runs it
////////////////////////////

function runGame (id) {
    $.ajax(
        "looma-database-utilities.php",
        {
            type: 'GET',
            dataType: "json",
            data: "collection=games&cmd=getGame&gameId=" + id,
            error: get_game_fail,
            success: get_game_succeed
        });
} //  end runGame()

///////////////////////////////////////
///////// DOCUMENT READY  ////////////
//////////////////////////////////////

$(document).ready (function() {
    
    $timer = $('#timer-count');
    $scoreboard = $('#scoreboard');
    
    //first visible screen asks user to choose the number of teams that will be playing
    $('.teamnumber').click(function () {
    
        game_type =    $('#thegameframe').data('gametype');
        game_id =      $('#thegameframe').data('gameid');
        game_class =   $('#thegameframe').data('class');
        game_subject = $('#thegameframe').data('subject');

        num_teams = $(this).data('team');
        initScores(num_teams);
        
        curr_team = 1;
        showTeam();
        curr_question = 1;
        
        $("#optionsframe").hide();
        $("#thegameframe").show();
        $('#timer').show();
        $scoreboard.show();
        
        if      (game_type == 'yesno')      runYesNo();
        else if (game_type == 'random')     runRandom();
        //else if (game_type == 'timeline') runtimeline(game_id); //add Catie's new code here
        else if (game_type == 'vocab')      runVocab(game_class, game_subject);
        else if (game_type == 'arith')      runArith(game_class, game_subject);
        else if (game_type == 'picture')    runPicture(game_class, game_subject);
        else if (game_type == 'speak')      runSpeak(game_class, game_subject);
        else if (game_type == 'translate')  runTranslate(game_class, game_subject);
        else                                runGame(game_id);
        
    })
});
