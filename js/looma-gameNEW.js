var game_data = {};
var curr_question;
var game_id;
var score_method;
var num_teams;
var curr_team = 1;
var scores;
var time_limit;
var selected_pair;
var matches_made = 0;
var visible_text_id_1;
var visible_text_id_2;

/////////////////////////////
// /////// timesUp  /////////
// //////////////////////////
function timesUp(){
    switch (game_data['presentation_type']) {
        case 'multiple choice':
            $(".right").off("click");
            $(".wrong").off("click");
            stopTimer();
            var correct = game_data['prompts'][curr_question]['correctAns'];
            increaseProgress();
            LOOMA.alert("Time's Up! The right answer is: " + correct,1000,false,function(){
                clearScreen();
                if (curr_team < num_teams) {
                    curr_team++;
                } else {
                    curr_team = 1;
                }
                curr_question++;
                $('#timer').html(time_limit.toString());
                showQuestion(); 
            });
            break;
        case 'matching':
            stopTimer();
            $('#prompts').hide();
            $('#responses').hide();
            gameOver();
            break;
        default:
            break;
    }
}

/////////////////////////////
// /////// clearScreen  /////////
// //////////////////////////
function clearScreen() {
    $("#question-number").empty();
    $("#question").empty();
    $("#answers").empty();
}

/////////////////////////////
// /////// updateScores  /////////
// //////////////////////////
function updateScores() {
    for (var i = 1; i <= num_teams; i++) {
        var id = 'teamscore-' + i.toString();
        $('#' + id).html('Team ' + i + ': ' + scores[i-1]);
    }
}

/////////////////////////////
// /////// increaseProgress  /////////
// //////////////////////////
function increaseProgress() {
    var num_questions = game_data['prompts'].length;
    console.log(num_questions)

    switch (game_data['presentation_type']) {
        case 'multiple choice':
            var percentage = ((curr_question+1)/num_questions)*100;
            $('#progress-bar').width(percentage + '%');
            break;
        case 'matching':
            var percentage = ((matches_made)/num_questions)*100;
            console.log(percentage)
            $('#progress-bar').width(percentage + '%');
            break;
        default:
            break;
    }
}

/////////////////////////////
// /////// handleCorrectAnswer  /////////
// //////////////////////////
function handleCorrectAnswer() {
    $(".right").off("click");
    $(".wrong").off("click");
    stopTimer();
    var correct = game_data['prompts'][curr_question]['correctAns'];
    scores[curr_team-1]++;
    updateScores();
    increaseProgress();
    LOOMA.alert("Correct! The right answer is: " + correct,1000,false,function(){
        clearScreen();
        if (curr_team < num_teams) {
            curr_team++;
        } else {
            curr_team = 1;
        }
        curr_question++;
        $('#timer').html(time_limit.toString());
        showQuestion();
    });
}

/////////////////////////////
// /////// handleWrongAnswer  /////////
// //////////////////////////
function handleWrongAnswer() {
    $(".right").off("click");
    $(".wrong").off("click");
    stopTimer();
    var correct = game_data['prompts'][curr_question]['correctAns'];
    increaseProgress();
    LOOMA.alert("Incorrect. The right answer is: " + correct,1000,false,function(){
        clearScreen();
        if (curr_team < num_teams) {
            curr_team++;
        } else {
            curr_team = 1;
        }
        curr_question++;
        $('#timer').html(time_limit.toString());
        showQuestion();
    });
}

/////////////////////////////
// /////// concCorrect  /////////
// //////////////////////////
function concCorrect() {
    $('.concButton').off('click');

    $("#"+visible_text_id_1).css('color','green');
    $("#"+visible_text_id_2).css('color','green');

    setTimeout(function() {
        if (visible_text_id_2[0] === "r") {
            var pair = visible_text_id_2.substring(9);
        } else {
            var pair = visible_text_id_2.substring(7);
        }
        console.log("correct match")
        $('.' + pair).css("visibility","hidden");
        $('.concButton').click(handleConcFirstClick);
    },3000);

    if (curr_team < num_teams) {
        curr_team++;
    } else {
        curr_team = 1;
    }
}

/////////////////////////////
// /////// concIncorrect  /////////
// //////////////////////////
function concIncorrect() {
    $('.concButton').off('click');

    $("#"+visible_text_id_1).css('color','red');
    $("#"+visible_text_id_2).css('color','red');

    setTimeout(function() {
        $("#"+visible_text_id_1).css('color','black');
        $("#"+visible_text_id_1).hide().parent().toggleClass('flipped');
        $("#"+visible_text_id_2).css('color','black');
        $("#"+visible_text_id_2).hide().parent().toggleClass('flipped');
        
        
        $('.concButton').click(handleConcFirstClick);
    },3000);

    if (curr_team < num_teams) {
        curr_team++;
    } else {
        curr_team = 1;
    }
}

/////////////////////////////
// /////// gameOver  /////////
// //////////////////////////
function gameOver() {
    $('#gameOverFrame').show();
    clearScreen();
    stopTimer();
    $("#message").html("Game Over!");
    for (var i = 1; i <= num_teams; i++) {
        var results = $('<h5>Team '+i.toString()+': '+(scores[i-1]).toString()+' correct!</h5>');
        $("#scoreList").append(results);
    }   
    
    var replayButton = $('<a href="looma-gameNEW.php?id='+ game_id +'"><button> Replay Game </button></a>');
    var gamesHomeButton = $('<a href="looma-gamesNEW.php"><button> Games Home Page </button></a>');

    $("#scoreList").append(replayButton);
    $("#scoreList").append("<br/><br/>")
    $("#scoreList").append(gamesHomeButton);
}

/////////////////////////////
// /////// runMC  /////////
// //////////////////////////
function runMC() {
    var questionNumber = curr_question;
    var prompts = game_data['prompts'];
    if (questionNumber < prompts.length) {
        if (num_teams > 1) {
            $("#current-team").html('Team ' + curr_team.toString());
        }
        $("#question-number").html("Question "+(questionNumber+1)+":");
        var questionData = prompts[questionNumber];
        var question = questionData['question'];
        $("#question").html(question);
        
        var answers = [];
        answers.push(questionData['correctAns']);
        (questionData['wrongAns']).forEach(function(wrong){
            answers.push(wrong);
        })

        //https://www.w3schools.com/js/js_array_sort.asp
        answers.sort(function(a, b){return 0.5 - Math.random()});

        answers.forEach(function(ans){
            if (ans === questionData['correctAns']) {
                var button = $('<button>' + ans + '</button>');
                button.addClass("right");
                button.click(handleCorrectAnswer);
                $("#answers").append(button);
                $("#answers").append("<br/><br/>");
            } else {
                var button = $('<button>' + ans + '</button>');
                button.addClass("wrong");
                button.click(handleWrongAnswer);
                $("#answers").append(button);
                $("#answers").append("<br/><br/>");
            }
        });
    } else {
        gameOver();
    }
}

/////////////////////////////
// /////// concFlipCard  /////////
// //////////////////////////
function concFlipCard(card, textId) {
    card.toggleClass('flipped');
    $('#'+textId).show();
}

/////////////////////////////
// /////// handleConcFirstClick  /////////
// //////////////////////////
function handleConcFirstClick(event) {
    var pair = event.target.classList[1];
    var num = pair.substring(5);
    selected_pair = num;
    var id = event.target.id;
    
    var textId = $("#"+id).find('span')[0].id;
    concFlipCard($("#"+id), textId);
    visible_text_id_1 = textId;
    
    $('.concButton').off('click');
    $('.concButton').click(handleSecondClick);
}

/////////////////////////////
// /////// handleSecondClick  /////////
// //////////////////////////
function handleSecondClick(event) {
    // console.log("SECOND CLICK")
    var pair = event.target.classList[1];  //NOTE: very fragile code - should be getting a "data-" property here
    var num = pair.substring(5);
    var id = event.target.id;
    var textId = $("#"+id).find('span')[0].id;
    concFlipCard($("#"+id), textId);
    //$('#'+textId).show();
    visible_text_id_2 = textId;
    if (num === selected_pair) {
        concCorrect();
    } else {
        concIncorrect();
    }
}

/////////////////////////////
// /////// handlePromptClick  /////////
// //////////////////////////
function handlePromptClick(event) {
    $('.prompt').css('color','black');
    selected_pair = event.target.className.split(' ')[1];
    $('.prompt.'+selected_pair).css('color','blue');
    var num_pairs = game_data['prompts'].length;
    for (var i = 0; i < num_pairs; i++) {
        $('#response-'+i.toString()).click(handleResponseClick);
    }
}

/////////////////////////////
// /////// handleResponseClick  /////////
// //////////////////////////
function handleResponseClick(event) {
    $('.response').css('color','black');
    var selected_resp = event.target.className.split(' ')[1];
    $('.response.'+selected_resp).css('color','blue');

    if (selected_pair === selected_resp) {
        //correct!
        matches_made++;
        scores[curr_team-1]++;
        updateScores();
        increaseProgress();
        $('.'+selected_resp).css('color','green');
        setTimeout(function() {
            $('.'+selected_resp).hide();
            if (num_teams > 1) {
                $("#current-team").html('Team ' + curr_team.toString());
            }
            if (matches_made === num_pairs) {
                gameOver();
            }
        }, 1000);

        if (curr_team < num_teams) {
            curr_team++;
        } else {
            curr_team = 1;
        }

    } else {
        //incorrect!
        $('.response.'+selected_resp).css('color','red');
        $('.prompt.'+selected_pair).css('color','red');

        //remove prompt onclick
        $('.prompt').off('click');

        setTimeout(function() {
            $('.response.'+selected_resp).css('color','black');
            $('.prompt.'+selected_pair).css('color','black');

            if (num_teams > 1) {
                $("#current-team").html('Team ' + curr_team.toString());
                stopTimer();
                LOOMA.alert("Incorrect! Team " + curr_team +"'s turn!",5,false,function(){
                    //re-add prompt onclick
                    $('.prompt').click(handlePromptClick);
                    runTimer();
                });
            }
        },1000);

        if (curr_team < num_teams) {
            curr_team++;
        } else {
            curr_team = 1;
        }
    }
    var num_pairs = game_data['prompts'].length;
    for (var i = 0; i < num_pairs; i++) {
        $('#response-'+i.toString()).off("click");
    }
}

/////////////////////////////
// /////// runMatch  /////////
// //////////////////////////
function runMatch() {
    if (num_teams > 1) {
        $("#current-team").html('Team ' + curr_team.toString());
    }
    var prompts = game_data['prompts'];
    var responses = game_data['responses'];
    console.log(prompts)
    console.log(responses)
    var promptButtons = [];
    var responseButtons = [];
    prompts.forEach(function(prompt, i){
        var button = $('<button class="prompt pair-'+i.toString()+'" id="prompt-'+i.toString()+'">' + prompt + '</button>');
        button.click(handlePromptClick);
        promptButtons.push(button);
    });
    responses.forEach(function(response,i){
        var button = $('<button class="response pair-'+i.toString()+'" id="response-'+i.toString()+'">' + response + '</button>');
        responseButtons.push(button);
    });

    //https://www.w3schools.com/js/js_array_sort.asp
    promptButtons.sort(function(a, b){return 0.5 - Math.random()});
    responseButtons.sort(function(a, b){return 0.5 - Math.random()});

    promptButtons.forEach(function(promptButton){
        $('#prompts').append(promptButton);
        $('#prompts').append('<br/>');
    });
    responseButtons.forEach(function(responseButton){
        $('#responses').append(responseButton);
        $('#responses').append('<br/>');
    });
}

/////////////////////////////
// /////// runConc  /////////
// //////////////////////////
function runConc() {
    if (num_teams > 1) {
        $("#current-team").html('Team ' + curr_team.toString());
    }
    var prompts =   game_data['prompts'];
    var responses = game_data['responses'];

    var allButtons = [];
    prompts.forEach(function(prompt, i){
        var button = $('<button class="concButton  pair-' + i.toString() +
                       '" id="prompt-' + i.toString() +
                       '"><span class="concText" id="prompt-pair-' + i.toString() +
                       '">' + prompt + '</span></button>');
        button.click(handleConcFirstClick);
        allButtons.push(button);
    });
    responses.forEach(function(response,i){
        var button = $('<button class="concButton  pair-'+i.toString() +
                       '" id="response-'+i.toString() +
                       '"><span class="concText" id="response-pair-' + i.toString() +
                       '">' + response + '</span></button>');
        button.click(handleConcFirstClick);
        allButtons.push(button);
    });

    //https://www.w3schools.com/js/js_array_sort.asp
    allButtons.sort(function(a, b){return 0.5 - Math.random()});
    allButtons.forEach(function(button){
        $('#buttons').append(button);
        console.log(button[0]['children'][0])
    });
    //$('.concText').hide();


}

/////////////////////////////
// /////// showQuestion  /////////
// //////////////////////////
function showQuestion() {
    runTimer();
    $("#optionsframe").hide()
    $("#gameframe").show();
    switch (game_data['presentation_type']) {
        case 'multiple choice':
            $('#game').append('<h2 class="question" id="question-number"></h2>');
            $('#game').append('<h2 class="question" id="question"></h2>');
            $('#game').append('<div id="answers"></div>');
            runMC();
            break;
        case 'matching':
            $('#game').append('<h4 class="question" id="question-number">Match the prompts on the left to the corresponding responses on the right.</h4>');
            $('#game').append('<div id="prompts"></div>');
            $('#game').append('<div id="responses"></div>');
            runMatch();
            break;
        case 'concentration':
            $('#game').append('<div id="buttons"></div>');
            runConc();
            break;
        default:
            break;
    }

}

/////////////////////////////
// /////// handleTeamOption  /////////
// //////////////////////////
function handleTeamOption(event) {
    $(".teamoption").css('color', 'black');
    $('#' + event.target.id).css('color', 'blue');
    var num_teams_str = event.target.id; 
    num_teams = parseInt((num_teams_str).substr(5));
    if (num_teams_str && score_method) {
        $('#submitoptions').show();
    }
}

/////////////////////////////
// /////// handleScoreMethod  /////////
// //////////////////////////
function handleScoreMethod(event) {
    $(".scoremethod").css('color', 'black');
    $('#' + event.target.id).css('color', 'blue');
    score_method = event.target.id;
    if (num_teams && score_method) {
        $('#submitoptions').show();
    }
}

/////////////////////////////
// /////// submitOptions  /////////
// //////////////////////////
function submitOptions() {
    scores = new Array(num_teams).fill(0);
    for (var i = 1; i <= num_teams; i++) {
        var id = 'teamscore-' + i.toString();
        $('#' + id).html('Team ' + i + ': ' + scores[i-1]);
        $('#' + id).show();
    }
    showQuestion();
}

/////////////////////////////
// /////// showOptions  /////////
// //////////////////////////
function showOptions() {
    $("#optionsframe").show()
    $("#gameframe").hide()
    $('#submitoptions').hide();

    var teams = (game_data["possible-teams"]) ? game_data['possible-teams'] : [1];
    if (!teams || (teams.length === 1 && teams[0] === 1)) {
        $("#numTeamsHeader").hide();
    };
    teams.forEach(function(num){
        var button = $('<button class="teamoption" id="team-' + num + '">' +num+ '</button>');
        button.click(handleTeamOption);
        $("#teamoptions").append(button);
        // $("#teamoptions").append("<br/><br/>");
    });

    var carButton = $('<button class="scoremethod" id="carmethod">Car</button>');
    var rocketButton = $('<button class="scoremethod" id="rocketmethod">Rocket</button>');
    var horseButton = $('<button class="scoremethod" id="horsemethod">Horse</button>');
    carButton.click(handleScoreMethod);
    rocketButton.click(handleScoreMethod);
    horseButton.click(handleScoreMethod);

    $("#scoremethods").append(carButton);
    $("#scoremethods").append(rocketButton);
    $("#scoremethods").append(horseButton);

    $("#submitoptions").click(submitOptions);
}

/////////////////////////////
// /////// fail  /////////
// //////////////////////////
function fail(r) {
    console.log("fail!");
}

/////////////////////////////
// /////// succeed  /////////
// //////////////////////////
function succeed(r) {
    game_data = r;
    console.log(r)
    curr_question = 0;
    time_limit = ( game_data['timeLimit']) ? game_data['timeLimit'] : 30;
    $("#timer").html(time_limit.toString());
    $("#gameTitle").html("Game: " + game_data['title']);
    showOptions();
}

/////////////////////////////
// /////// DOCUMENT READY  //
// //////////////////////////
$(document).ready (function() {
    game_id = $('#thegameframe').data('gameid');


    if (game_id) {
        $.ajax(
        "looma-database-utilities.php",
        {
            type: 'GET',
            dataType: "json",
            data: "collection=games&cmd=getGame&gameId=" + game_id,
            error: fail,
            success: succeed
        });
    } else {
        // RANDOM MATCHING
        var gameType = $('#thegameframe').data('gametype');
        var randClass = $('#thegameframe').data('randclass');
        var randSubj = $('#thegameframe').data('randsubj');
        
        // settings
        var num_words = 5;
        var my_time_limit = 30;

        game_data = {'name':'Random Class '+randClass+' '+randSubj,
                     'prompts':[], 
                     'responses': [],
                     'possible-teams': [1,2,3,4],
                     'presentation_type': 'matching'};
        curr_question = 0;
        time_limit = 30;
        $("#timer").html(time_limit.toString());
        $("#gameTitle").html("Game: " + game_data['name']);
        showOptions();

        function s(words) {
            // console.log("success",words)
            words.forEach(function(word){
                function found(res) {
                    game_data['prompts'].push(word);
                    game_data['responses'].push(res);
                }
                function fail(r) {
                    console.log("fail",r);
                }
                LOOMA.sienna_define(word, found, fail);
            });

        }
        function f(r) {
            console.log("fail",r)
        }
        LOOMA.wordlist("class"+randClass.toString(), randSubj.toLowerCase(), "", num_words, "true", s, f);
    }
}); 
