var prompts = [];
var responses = [];
var scoring = "rocket";
var teamNum = 1;
var theId = null;
function runMCList()
{
    console.log("in mc");
    var classButtons = document.getElementsByClassName("classbuttons");
    for (var i = 0; i < classButtons.length; i++)
    {
        classButtons[i].addEventListener('click', function() {sendClass(event)});
    }

    var subjectButtons = document.getElementsByClassName("subjectbuttons");
    for (var i = 0; i < subjectButtons.length; i++)
    {
        subjectButtons[i].addEventListener('click', function() {sendSubject(event)});
    }

    var gameButtons = document.getElementsByClassName("mc-buttons");
    for (var i = 0; i < gameButtons.length; i++)
    {
        gameButtons[i].addEventListener('click', function() {addGame(event)});
    }

    var scoreButtons = document.getElementsByClassName("scoreButtons");
    for (var i = 0; i < scoreButtons.length; i++)
    {
        scoreButtons[i].addEventListener('click', function() {chooseScore(event)});
    }

    var teamButtons = document.getElementsByClassName("teamButtons");
    for (var i = 0; i < teamButtons.length; i++)
    {
        teamButtons[i].addEventListener('click', function() {chooseTeams(event)});
    }

    var playButton = document.getElementById("play");
    if (playButton != null)
    {
        playButton.addEventListener('click', sendMCGame);
    }
}
function addGame(ev)
{
    addToUrl("&id=" + ev.target.getAttribute("data-id"));
}

function sendMCGame(ev)
{
    var theInd = window.location.href.indexOf("id=") + 3;
    var theId = window.location.href.substring(theInd);
    window.location.href = "looma-game.php?id=" + theId + "&scoring=" + scoring + "&teams=" + teamNum;
}

function sendMapGame(ev)
{
    var theInd = window.location.href.indexOf("id=") + 3;
    var theId = window.location.href.substring(theInd);
    window.location.href = "looma-game.php?id=" + theId + "&teams=" + teamNum;
}

function sendClass(ev)
{
    addToUrl("&class=" + ev.target.id[5]);
}

function sendSubject(ev)
{
    addToUrl("&subject=" + ev.target.id);
}

function chooseGame(ev)
{
    theId = ev.target.getAttribute("data-id");
    var theGameButtons = document.getElementsByClassName("mc-buttons");
    for (var i = 0; i < theGameButtons.length; i++)
    {
        if (theGameButtons[i].style.color == "green")
        {
            theGameButtons[i].style.color = "black";
        }
    }
    ev.target.style.color = "green";
}

function chooseScore(ev)
{
    scoring = ev.target.id;
    var theScoreButtons = document.getElementsByClassName("scoreButtons");
    for (var i = 0; i < theScoreButtons.length; i++)
    {
        if (theScoreButtons[i].style.color == "green")
        {
            theScoreButtons[i].style.color = "black";
        }
    }
    ev.target.style.color = "green";
}

function chooseTeams(ev)
{
    teamNum = parseInt(ev.target.innerHTML);
    var theTeamButtons = document.getElementsByClassName("teamButtons");
    for (var i = 0; i < theTeamButtons.length; i++)
    {
        if (theTeamButtons[i].style.color == "green")
        {
            theTeamButtons[i].style.color = "black";
        }
    }
    ev.target.style.color = "green";
}

function sendGame(ev)
{
    console.log(ev);
    window.location.href = "looma-game.php?id=" + ev.target.getAttribute("data-id");
}


function runMatchingList()
{
    var vocabOrPremade = document.getElementsByClassName("origins");
    for (var i = 0; i < vocabOrPremade.length; i ++)
    {
        vocabOrPremade[i].addEventListener('click', function() {getOrigin(event)});
    }

    var vocabClassButtons = document.getElementsByClassName("vocabclass");
    for (var i = 0; i < vocabClassButtons.length; i++)
    {
        vocabClassButtons[i].addEventListener('click', function() {assignVocabClass(event); return false;});
    }

    var matchingGameButtons = document.getElementsByClassName("matching-buttons");
    if (matchingGameButtons.length != 0)
    {
        for (var i = 0; i < matchingGameButtons.length; i++)
        {
            matchingGameButtons[i].addEventListener('click', function() {sendMatchingGame(event)});
        }
    }
}
function sendMatchingGame(ev)
{
    window.location.href = "looma-game.php?id=" + ev.target.getAttribute("data-id");
}
function getOrigin(ev)
{
    if (ev.target.id == "vocab")
    {
        addToUrl("&origin=vocab");
    }
    else // ev.target.id == "premade"
    {
        addToUrl("&origin=premade");
    }
}
function assignVocabClass(ev)
{
    var chosenClass = ev.target.id.substring(5);
    //console.log(chosenClass);
    //addToUrl("&class=" + chosenClass);
    generateVocabGame(ev.target.id, chosenClass);
    return false;
}
function generateVocabGame(className, chosenClass)
{
    console.log("generate vocab game");
    LOOMA.wordlist(className, "", "", 5, true, function(r){console.log("word list succed"); getDef(r,chosenClass)}, function(){console.log("wordlist failed")});
    // var listWithDef = {"one": ["hello", "greeting"], "two": ["pencil", "writing utensil"], "three": ["clock", "time keeping device"]};
    // prompts.push(listWithDef.one[0]);
    // responses.push(listWithDef.one[1]);
    // prompts.push(listWithDef.two[0]);
    // responses.push(listWithDef.two[1]);
    // prompts.push(listWithDef.three[0]);
    // responses.push(listWithDef.three[1]);
    // console.log(prompts);
    // console.log(responses);
    return false;
}
    function getDef(list, chosenClass)
    {
        //console.log("GET DEF", list)
        LOOMA.define(list[counter],
            function(r)
            {
                //console.log("getDEF response: ", r);
                responses.push(r['def']);
                counter++;
                if (counter < list.length)
                {
                    getDef(list,chosenClass);
                }
                else
                {
                    counter = 0;
                    var classButtons = document.getElementsByClassName("vocabclass");
                    for (var i = 0; i < classButtons.length; i++)
                    {
                        classButtons[i].style.visibility = "hidden";
                    }
                   // console.log("SHOULD BE ALL DEFINITIONS", responses);
                    var info = {"title":"Randomly Generated Vocab Game", "presentation_type":"matching", "ch_id":chosenClass, "ft":"game", "timeLimit":100, "TTS":"no", "prompts":list, "responses":responses};
                    function s(r) {console.log("successful post");}
                    function f(r) {console.log("failed post");}

                    $.ajax({
                        url: "looma-game.php",
                        type: "POST",
                        data: info,
                        success: s,
                        error: f
                    });
                    // addToUrl("&class=" + chosenClass);
                }
            },
            function(r)
            {
                console.log("AJAX FAIL");
            }
        )
    }
function fail(jqXHR, textStatus, errorThrown) {
    //alert("enter function fail");
    console.log("fail");
    console.log(jqXHR);
    console.log('VOCAB: AJAX call to dictionary-utilities.php FAILed, jqXHR is ' + jqXHR.status);
    window.alert('failed with textStatus = ' + textStatus + ', and errorThrown = ' + errorThrown);
}

function addToUrl(stuff)
{
    window.location.href += stuff;
}
function runTimelineList()
{
    var timeButtons = document.getElementsByClassName("timeline-buttons");
    for (var i = 0; i < timeButtons.length; i++)
    {
        timeButtons[i].addEventListener('click', function() {sendGame(event)});
    }
}
function runConcentrationList()
{
    var vocabOrPremade = document.getElementsByClassName("origins");
    for (var i = 0; i < vocabOrPremade.length; i ++)
    {
        vocabOrPremade[i].addEventListener('click', function() {getOrigin(event)});
    }

    var concentrationButtons = document.getElementsByClassName("conc-buttons");
    for (var i = 0; i < concentrationButtons.length; i++)
    {
        concentrationButtons[i].addEventListener('click', function() {sendGame(event)});
    }
}
function runMapList()
{
    var mapButtons = document.getElementsByClassName("map-buttons");
    for (var i = 0; i < mapButtons.length; i++)
    {
        mapButtons[i].addEventListener('click', function() {addGame(event)});
    }

    var teamButtons = document.getElementsByClassName("teamButtons");
    for (var i = 0; i < teamButtons.length; i++)
    {
        teamButtons[i].addEventListener('click', function() {chooseTeams(event)});
    }

    var playButton = document.getElementById("play");
    if (playButton != null)
    {
        playButton.addEventListener('click', sendMapGame);
    }
}

window.onload = function()
{
    var href = window.location.href;
    var startIndex = href.indexOf("type");
    var type = href.substring(startIndex + 5);
    var endIndex = type.indexOf("&");
    if (endIndex > -1)
    {
        type = type.substring(0, endIndex);
    }
    console.log(type);
    if (type == "mc")
    {
        runMCList();
    }
    else if (type == "matching")
    {
        runMatchingList();
    }
    else if (type == "timeline")
    {
        runTimelineList();
    }
    else if (type == "concentration")
    {
        runConcentrationList();
    }
    else if (type == "map")
    {
        runMapList();
    }
};
