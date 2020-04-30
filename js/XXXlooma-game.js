/**************************
Author: Luke Bowsher, Catie Cassani, Sun-Mi Oh, Meg Reinstra, Alexa Thomases (2018)
Filename: looma-game.js
Date: August 2018
Description: Creates a game with a scoreboard, timer, and prompts.
Information accessed through database.
***************************/
    'use strict';

    var delayInMilliseconds = 1000; //1 second
    var currentPrompt;
    var numMatched = 0;
    var numGuesses = 0;
    var checkFunction;
    var ourWidth = "1%";
    var ourHeights = {};
    var ourLefts = {};
    var questionNum = 1;
    var ourScores = new Array(getNumberOfTeams());
    ourScores.fill(0);
    var theTime;

    //concentration variables
    var flipCount = 0;
    var originalId = null;
    var targetId = null;
    var wait = false;

    //timeline game variables
    var clickedEventID;

    //hides intermediate page
    function hideInterm()
    {
        var interm = document.getElementById("intermediate");
        interm.style.display = "none";
    }

    //calls stopTimer function to stop the timer
    function stopTheTimer()
    {
        stopTimer();
    }

    function tooLate()
    {
        stopTheTimer();
        var head = document.getElementById("header");
        if (head.title == "mc")
        {
            var right = document.getElementById("correct");
            var txt = right.textContent || right.innerText;
            outputValue = "<p> Out of Time. The Correct Answer was " + txt + "</p>";
            document.getElementById("interm header").innerHTML = outputValue;
            document.getElementById("interm header").style.fontSize = "40px";

            flipFlop();
        }
        else if (head.title == "matching")
        {
            var prompts = document.getElementsByClassName("prompt");
            var responses = document.getElementsByClassName("response");
            for (i = 0; i < prompts.length; i++)
            {
                prompts[i].style.visibility = "hidden";
                responses[i].style.visibility = "hidden";
            }
            outputValue = "<p> Out of Time. You matched " + numMatched + " out of 5 prompts. </p>";
            document.getElementById("inframe").innerHTML = outputValue;
            document.getElementById("inframe").style.fontSize = "40px";
        }
        else if (head.title == "concentration")
        {
            var prompts = document.getElementsByClassName("prompts");
            var responses = document.getElementsByClassName("responses");
            for (i = 0; i < prompts.length; i++)
            {
                prompts[i].style.visibility = "hidden";
                responses[i].style.visibility = "hidden";
            }
            outputValue = "<h1> Out of Time. You found " + numMatched + " out of 5 matches. </h1>";
            document.getElementById("inframe").innerHTML = outputValue;
        }
        else if (head.title == "timeline")
        {
            var eventButtons = document.getElementsByClassName("event");
            var dateButtons = document.getElementsByClassName("date");
            for (i = 0; i < eventButtons.length; i++)
            {
                eventButtons[i].disabled = true;
                dateButtons[i].disabled = true;
            }
            outputValue = "<p> Out of Time. You matched " + numMatched + " event(s). </p>";
            document.getElementById("endMessage").innerHTML = outputValue;
        }
        else if (head.title == "map")
        {
            document.getElementById("question").innerHTML = "<h4>Out of Time</h4>";
        }
    }

    //removes element passed in the parameter
    function removeElement(elementId)
    {
        var element = document.getElementById(elementId);
        element.parentNode.removeChild(element);
    }

    //flips from the main game page to the intermediate page
    function flipFlop()
    {
        var gam = document.getElementById("gameframe");
        var inter = document.getElementById("intermediate");

        if (gam.style.display === "none")
        {
            inter.style.display = "none";
            gam.style.display = "block";
        }
        else
        {
            gam.style.display = "none";
            inter.style.display = "block";
        }
        if (ourHeights != null && !isEmpty(ourHeights))
        {
            for (i = 1; i <= getNumberOfTeams(); i ++)
            {
                if (ourHeights[i] != null)
                {
                    var temp = "vert-marker" + i;
                    document.getElementById(temp).style.top = ourHeights[i] + "px";
                }
            }
        }
        if (ourLefts != null && !isEmpty(ourLefts))
        {
            for (i = 1; i <= getNumberOfTeams(); i ++)
            {
                if (ourLefts[i] != null)
                {
                    var temp = "hori-marker" + i;
                    document.getElementById(temp).style.left = ourLefts[i] + "px";
                }
            }
        }
    }

    //gets the next question
    function getNewQuestion()
    {
        questionNum ++;
        var newTeam = getNewTeamNum();
        current = window.location.href;
        id = current.substring(37);
        //the_url = "looma-game-utilities.php?" + id;
        the_url = "looma-game-utilities.php" + id;
        jQuery.ajax({
            type: "POST",
            url: the_url,
            data: {question: questionNum, score: ourScores, team: newTeam},
            datatype: 'json',
                    success: function (response) {
                        var game = document.getElementById("thegameframe");
                        game.innerHTML = response;
                        hideInterm();
                        resetTimer();
                        runMCGame();
                 }
        });
    }

    //resets the timer
    function resetTimer()
    {
        document.getElementById("timer").innerHTML = String(theTime);
    }

    //gets total number of questions
    function getNumQuestions()
    {
        var numOfQuests = document.getElementById("header").getAttribute("data-questions");
        return parseInt(numOfQuests);
    }

    //returns new total number of teams
    function getNewTeamNum()
    {
        var currentTeamNum = getCurrentTeamNum();
        currentTeamNum ++;
        if (currentTeamNum > getNumberOfTeams())
        {
            currentTeamNum = 1;
        }
        return currentTeamNum;
    }

    //returns number of teams
    function getNumberOfTeams()
    {
        var top = document.getElementById("top");
        if (top != null)
        {
            return parseInt((top).getAttribute("data-numteams"));
        }
        return 1;
    }

    //returns current number of teams
    function getCurrentTeamNum()
    {
        var team = document.getElementById("top");
        if (team != null)
        {
            var temp = parseInt(team.innerHTML.substring(24));
            if (!isNaN(temp))
            {
                return temp;
            }
        }
        return 1;
    }

    function isEmpty(obj)
    {
        return Object.keys(obj).length === 0;
    }

    //increases the score and the progress bar
    function increaseScore()
    {
        var tempTeam = getCurrentTeamNum();
        ourScores[tempTeam - 1] ++;
        var tempId = "scoreboard" + tempTeam;
        var teamName = document.getElementById(tempId).innerHTML.substring(0, 8);
        if (teamName.length > 1)
        {
            document.getElementById(tempId).innerHTML = teamName + String(ourScores[tempTeam - 1]);
        }
        else
        {
            document.getElementById(tempId).innerHTML = String(ourScores[tempTeam - 1]);
        }

        if (getNumberOfTeams() == 1)
        {
            var widthPercent = 100 / getNumQuestions();
            var bar = document.getElementById("progress-bar");

            if (parseInt(ourWidth) <= 2)
            {
                ourWidth = widthPercent + "%";
            }
            else
            {
                ourWidth = parseInt(ourWidth) + widthPercent + "%";
            }
            bar.style.width = ourWidth;
        }
    }

    /*************** MULTIPLE CHOICE GAME ********************/

    //outputs a messsage, stops the timer, add to the scoreboard if the user gets the question correct
    function rightMCOutput()
    {
        var goal = getNumQuestions();
        increaseScore();
        stopTheTimer();
        if (ourScores[getCurrentTeamNum() - 1] < Math.ceil(goal / getNumberOfTeams()))
        {
            outputValue = "<p> Correct! Good job! </p>";
        }
        else
        {
            if (getNumberOfTeams() <= 1)
            {
                outputValue = "<p> Correct! Congratulations!! </p>";
            }
            else
            {
                outputValue = "<p> Correct! Congratulations!! </p>";
            }
        }
        //calls intermediate page with fun scoreboard
        document.getElementById("interm header").innerHTML = outputValue;
        flipFlop();
        //increase points on scoreboard and progress bar
        var temporary = Math.ceil(goal/getNumberOfTeams());
        increaseBigScore(temporary, getCurrentTeamNum());
        ourHeights = getTheHeights();
        ourLefts = getTheLefts();
    }

    //outputs messages and calls stopTheTimer and waitNSend when a wrong answer is clicked
    function wrongMCOutput()
    {
        stopTheTimer();
        var right = document.getElementById("correct");
        var txt = right.textContent || right.innerText;
        outputValue = "<p> Incorrect. The Correct Answer was " + txt + "</p>";
        document.getElementById("interm header").innerHTML = outputValue;
        flipFlop();
    }

    //runs the multiple choice game
    function runMCGame()
    {
        hideInterm();
        theQuest = document.getElementById("question").innerHTML;
        if (theQuest !== null && theQuest !== '')
        {
            theTime = parseInt(document.getElementById("timer").innerHTML);
            runTimer(theTime);//where n is the number of minutes required.

            if (getNumberOfTeams() == 1)
            {
                document.getElementById("progress-bar").style.width = ourWidth;
            }
            for (i = 1; i <= getNumberOfTeams(); i ++)
            {
                if (i == getCurrentTeamNum())
                {
                    document.getElementById("scoreboard" + i).style.color = "LightSkyBlue";
                }
                else
                {
                    document.getElementById("scoreboard" + i).style.color = "yellow";
                }
            }

            var outputValue;

            var rightButton = document.getElementsByClassName("right");
            rightButton[0].addEventListener('click', rightMCOutput);

            sender = document.getElementById("sender");
            sender.addEventListener('click', getNewQuestion);

            //needs a button or set of buttons that have class="wrong"
            var wrongButton = document.getElementsByClassName("wrong");
            for (var i = 0; i < wrongButton.length; i++)
            {
                wrongButton[i].addEventListener('click', wrongMCOutput);
            }
        }
        else
        {
            document.getElementById("top").innerHTML = "GAME OVER";
        }
    }

    /********************** MATCHING GAME **************************/


    // responds appropriately when user correctly matches prompt and response
    function rightMatchingOutput(matchedNum)
    {
        var goal = getNumQuestions();
        increaseScore();
        numMatched++;
        var promptButtons = document.getElementsByClassName("prompt");
        var responseButtons = document.getElementsByClassName("response");

        var matched = document.getElementsByClassName(matchedNum);
        matched[0].style.color = "#0bd871";
        matched[1].style.color = "#0bd871";

        //makes correctly matched buttons disappear
        setTimeout(function()
        {
            for (i = 0; i < promptButtons.length; i++)
            {
                if (promptButtons[i].classList[1] == matchedNum)
                {
                    promptButtons[i].style.visibility = "hidden";
                }
            }
            for (i = 0; i < responseButtons.length; i++)
            {
                if (responseButtons[i].classList[1] == matchedNum)
                {
                    responseButtons[i].style.visibility = "hidden";
                }
            }
        }, delayInMilliseconds);
        runMatchingGame(numMatched);
    }

    // responds appropriately when user incorrectly matches prompt and response
    function wrongMatchingOutput(promptNum, responseNum)
    {
        var promptButtons = document.getElementsByClassName("prompt");
        var responseButtons = document.getElementsByClassName("response");

        var wrongPrompt = document.getElementsByClassName('prompt ' + promptNum);
        wrongPrompt[0].style.color = "#f70426";
        var wrongResponse = document.getElementsByClassName('response ' + responseNum);
        wrongResponse[0].style.color = "#f70426";

        setTimeout(function()
        {
            wrongPrompt[0].removeAttribute("style");
            wrongResponse[0].removeAttribute("style");
        }, delayInMilliseconds);
        runMatchingGame(numMatched);
    }

    // wrapper function for matching game -- analogous to runMCGame()
    function runMatchingGame(numMatched)
    {
        document.getElementById("inframe").innerHTML = "Match the buttons on the left with their answers on the right.";
        document.getElementById("inframe").style.fontSize = "30px";
        theTime = parseInt(document.getElementById("timer").innerHTML);
        runTimer(theTime);//where n is the number of minutes required.
        document.getElementById("progress-bar").style.width = ourWidth;

        var promptButtons = document.getElementsByClassName("prompt");
        if (numMatched == promptButtons.length) // game is over -- all buttons have been correctly matched
        {
            document.getElementById("inframe").innerHTML = "YOU WIN! Number of guesses: " + numGuesses;
            document.getElementById("inframe").style.fontSize = "50px";
            stopTheTimer();
        }
        else
        {
            for (i = 0; i < promptButtons.length; i++)
            {
                promptButtons[i].addEventListener('click', findResponse);
                promptButtons[i].addEventListener('drag', drag);
            }
        
            var responseButtons = document.getElementsByClassName("response");
            for (i = 0; i < responseButtons.length; i++)
            {
                responseButtons[i].addEventListener('drop', drop);
                responseButtons[i].addEventListener('dragover', allowDrop);
                responseButtons[i].addEventListener('dragleave', resetStyle);
            }
        }
    }

    //allows buttons to drop on prompts
    function allowDrop(ev)
    {
        ev.preventDefault();
        this.style.color = "blue";
    }

    //allows user to drag buttons
    function drag(ev)
    {
        ev.dataTransfer.setData("Text", ev.target.id);
        currentPrompt = this.classList[1];
    }

    /*outputs right output and wrong output based on if
    the user drops the button on the correct or incorrect
    response button*/
    function drop(ev)
    {
        numGuesses++;
        var responseNum = ev.target.classList[1];
        var promptNum = currentPrompt;
        if (promptNum == responseNum)
        {
            rightMatchingOutput(promptNum);
        }
        else
        {
            wrongMatchingOutput(promptNum, responseNum);
        }
        ev.preventDefault();
    }

    //resets style of the event button passed in the parameter
    function resetStyle(ev)
    {
        this.style.color = "black";
    }

    // calls check function once user clicks on a response button
    function findResponse(event)
    {
        var promptNum = event.target.classList[1];
        checkFunction = checkForMatch.bind(null, promptNum);

        var clickedPrompt = document.getElementsByClassName('prompt ' + promptNum);
        clickedPrompt[0].style.color = "blue";

        var promptButtons = document.getElementsByClassName("prompt");
        for (i = 0; i < promptButtons.length; i++)
        {
            promptButtons[i].removeEventListener('click', findResponse);
        }

        var responseButtons = document.getElementsByClassName("response");
        for (i = 0; i < responseButtons.length; i++)
        {
            responseButtons[i].addEventListener('click', checkFunction);
        }

    }

    // checks to see if user matched them correctly
    function checkForMatch(promptNum, event)
    {
        numGuesses++;
        var promptButtons = document.getElementsByClassName("prompt");
        var responseButtons = document.getElementsByClassName("response");

        for (i = 0; i < responseButtons.length; i++)
        {
            responseButtons[i].removeEventListener('click', checkFunction);
        }
        var clickedPrompt = document.getElementsByClassName('prompt ' + promptNum);
        clickedPrompt[0].style.color = "black";

        responseNum = event.target.classList[1];

        if (promptNum == responseNum)
        {
            rightMatchingOutput(promptNum);
        }
        else
        {
            wrongMatchingOutput(promptNum, responseNum);
        }
    }

    /************************** CONCENTRATION GAME ***********************/
    //runs concentration game
    function concentrationGame(numMatched)
    {
        theTime = parseInt(document.getElementById("timer").innerHTML);
        runTimer(theTime);//where n is the number of minutes required.
        document.getElementById("progress-bar").style.width = ourWidth;

        var promptButtons = document.getElementsByClassName("prompts");
        var responseButtons = document.getElementsByClassName("responses");
        
        if (promptButtons.length == numMatched)
        {
            outputValue = "<h1> CONGRATULATIONS! Number of guesses: " + numGuesses + "</h1>";
            setTimeout(function(){ document.getElementById("inframe").innerHTML = outputValue;}, 1200);
            stopTheTimer();
        }
        else
        {
            for (i = 0; i < promptButtons.length; i++)
            {
                promptButtons[i].addEventListener('click', firstClick);
                responseButtons[i].addEventListener('click', firstClick);
            }
        }
    }

    //adds and removes event listeners based on user's second click
    function concentrationGameSecondClick()
    {
        var promptButtons = document.getElementsByClassName("prompts");
        var responseButtons = document.getElementsByClassName("responses");

        for (i = 0; i < promptButtons.length; i++)
        {
            promptButtons[i].removeEventListener('click', firstClick);
            promptButtons[i].addEventListener('click', secondClick);
            responseButtons[i].removeEventListener('click', firstClick);
            responseButtons[i].addEventListener('click', secondClick);
        }
    }

    //resets concentration game
    function concentrationGameReset()
    {
        var promptButtons = document.getElementsByClassName("prompts");
        var responseButtons = document.getElementsByClassName("responses");

        for (i = 0; i < promptButtons.length; i++)
        {
            promptButtons[i].removeEventListener('click', secondClick);
            responseButtons[i].removeEventListener('click', secondClick);
        }
    }

    //executes action with user's first click
    function firstClick(event)
    {
        var flipId = event.target.id;
        var card = event.target.name;

        if (flipId == "")
        {
            flipId = event.target.parentElement.id;
            card = event.target.parentElement.name;
        }

        var cardType = card.substring(0,1); // p if prompt, r if response
        var cardNum = card.substring(1);

        originalId = flipId;

        //finds the pair of the clicked button
        if (cardType == "p")
        {
            //have prompt, need response
            var name = "r" + cardNum;
            var matchCards = document.getElementsByName(name);
            targetId = matchCards[0].id;
            console.log(matchCards[0].id);
        }
        else
        {
            //have response, need prompt
            var name = "p" + cardNum;
            console.log("name = " +name);
            var matchCards = document.getElementsByName(name);
            targetId = matchCards[0].id;
            console.log(matchCards[0].id);
        }
        
        //flips card
        if (flipCount == 0 && document.getElementById(flipId).innerHTML ==
        '<img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180">')
        {
            //making hyphens back into spaces
            var convertedFlipId = flipId.replace(/-/g, " ");
            document.getElementById(flipId).innerText = convertedFlipId;
            flipCount++;
            concentrationGameSecondClick(); //calls concentrationGame to initiate secondClick
        }
    }

    //executes action for user's second click
    function secondClick(event)
    {
        var secondId = event.target.id;

        if (secondId == "")
        {
            secondId = event.target.parentElement.id;
        }

        //flips card
        if (document.getElementById(secondId).innerHTML ==
            '<img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180">' && flipCount < 2)
        {
            //making hyphens back into spaces
            var convertedSecondId = secondId.replace(/-/g, " ");
            document.getElementById(secondId).innerText = convertedSecondId;
            flipCount++;

            var firstCard = document.getElementById(originalId);
            var secondCard = document.getElementById(secondId);

            if (secondId === targetId)
            {
                //correctly matched!
                var goal = getNumQuestions();
                firstCard.style.color = "LimeGreen";
                secondCard.style.color = "LimeGreen";

                setTimeout(function(){ firstCard.style.visibility = "hidden"; secondCard.style.visibility = "hidden";}, 1200);

                //resetting everything
                flipCount = 0;
                numMatched++;
                numGuesses++;
                increaseScore();
            }
            else
            {
                //incorrectly matched
                firstCard.style.color = "Red";
                secondCard.style.color = "Red";
                wait = true;

                setTimeout(function(){firstCard.innerHTML =
                    '<img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180">'; firstCard.style.color = "Black";
                    secondCard.innerHTML =
                    '<img src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Smiley face" height="70" width="180">'; secondCard.style.color = "Black";
                    flipCount = 0; wait = false;}, 1200);
                numGuesses++;
            }

            targetId = null;

            //calling concentrationGames to reset for next set of clicks
            concentrationGameReset();
            concentrationGame(numMatched); //used to have no 0
        }
    }

    /**************TIMELINE GAME*************/

    //allows user to drag timeline events
    function timelineDrag(ev)
    {
        ev.dataTransfer.setData("Text", ev.target.id);
        currentEventID = ev.target.id;
    }

    /*executes rightDraggingOutput or wrongDraggingOutput
    based on where the user drops the event*/
    function timelineDrop(ev)
    {
        numGuesses++;
        var dateID = ev.target.id;
        var eventID = currentEventID;
        if (eventID == dateID)
        {
            rightDraggingOutput(eventID);
        }
        else
        {
            wrongDraggingOutput(eventID, dateID);
        }
        ev.preventDefault();
        console.log("dropped");
    }

    //finds the date that's clicked
    function timelineFindDate(ev)
    {
        numGuesses++;
        clickedEventID = ev.target.id;
        this.style.color = "blue";

        var eventButtons = document.getElementsByClassName("event");
        for (i = 0; i < eventButtons.length; i++)
        {
            eventButtons[i].removeEventListener('click', timelineFindDate);
        }

        var dateButtons = document.getElementsByClassName("date");
        for (i = 0; i < dateButtons.length; i++)
        {
            dateButtons[i].addEventListener('click', checkTimelineMatch);
        }
    }

    // checks to see if the user matched the event to the correct date by clicking
    function checkTimelineMatch(ev)
    {
        var dateID = ev.target.id;

        var dateButtons = document.getElementsByClassName("date");
        for (i = 0; i < dateButtons.length; i++)
        {
            dateButtons[i].removeEventListener('click', checkTimelineMatch);
        }

        var eventButtons = document.getElementsByClassName("event");
        for (i = 0; i < eventButtons.length; i++)
        {
            if (eventButtons[i].id == dateID)
            {
                eventButtons[i].style.color = "black";
            }
        }

        if (dateID == clickedEventID)
        {
            rightDraggingOutput(clickedEventID);
        }
        else
        {
            wrongDraggingOutput(clickedEventID, dateID);
        }
    }

    // responds appropriately when user correctly matches an event to a date
    function rightDraggingOutput(eventID)
    {
        var goal = getNumQuestions();
        increaseScore();
        numMatched++;
        var eventButtons = document.getElementsByClassName("event");
        var emptyEventButtons = document.getElementsByClassName("emptyEvent");
        var dateButtons = document.getElementsByClassName("date");

        //makes the selected event button and date button green
        for (i = 0; i < eventButtons.length; i++)
        {
            if (eventButtons[i].id == eventID)
            {
                eventButtons[i].style.color = "#0bd871";
            }
        }
        for (i = 0; i < dateButtons.length; i++)
        {
            if (dateButtons[i].id == eventID)
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
            for (i = 0; i < eventButtons.length; i++)
            {
                if (eventButtons[i].id == eventID)
                {
                eventButtons[i].style.visibility = "hidden";
                }
            }
            
            for (i = 0; i < dateButtons.length; i++)
            {
                if (dateButtons[i].id == eventID)
                {
                    dateButtons[i].removeAttribute("style");
                    dateButtons[i].disabled = true;
                }
            }

            var timelineEventButtons = document.getElementsByClassName("timelineEvent");
            for (i = 0; i < timelineEventButtons.length; i++)
            {
                if (i == eventID)
                {
                   timelineEventButtons[i].style.visibility = "visible";
                }
            }
        }, delayInMilliseconds);

        timelineGame(numMatched);
    }

    // responds appropriately when user incorrectly matches an event to a date
    function wrongDraggingOutput(eventID, dateID)
    {
        var eventButtons = document.getElementsByClassName("event");
        var dateButtons = document.getElementsByClassName("date");

        //makes the selected event button and date button red
        for (i = 0; i < eventButtons.length; i++)
        {
            if (eventButtons[i].id == eventID)
            {
                eventButtons[i].style.color = "#f70426";
            }
        }
        for (i = 0; i < dateButtons.length; i++)
        {
            if (dateButtons[i].id == dateID)
            {
                dateButtons[i].style.color = "#f70426";
            }
        }

        //resets the style of the selected event and date buttons
        setTimeout(function(){
            for (i = 0; i < eventButtons.length; i++)
            {
                if (eventButtons[i].id == eventID)
                {
                    eventButtons[i].removeAttribute("style");
                }
            }
            for (i = 0; i < dateButtons.length; i++)
            {
                if (dateButtons[i].id == dateID)
                {
                    dateButtons[i].removeAttribute("style");
                }
            }
        }, delayInMilliseconds);

        timelineGame(numMatched);
    }

    // wrapper function for timeline game -- analogous to runMCGame()
    function timelineGame(numMatched)
    {
        theTime = parseInt(document.getElementById("timer").innerHTML);
        runTimer(theTime);//where n is the number of minutes required.
        document.getElementById("progress-bar").style.width = ourWidth;

        var eventButtons = document.getElementsByClassName("event");
        var dateButtons = document.getElementsByClassName("date");

        if (eventButtons.length == numMatched)
        {
            document.getElementById("endMessage").innerHTML = "Good job! You matched all " + numMatched + " events to their dates in " + numGuesses + " guesses.";
            stopTheTimer();

            for (i = 0; i < dateButtons.length; i++)
            {
                dateButtons[i].disabled = true;
            }
        }
        else
        {
            for ($i = 0; $i < eventButtons.length ; $i++)
            {
                eventButtons[$i].addEventListener('click', timelineFindDate);
                eventButtons[$i].addEventListener('drag', timelineDrag);
                dateButtons[$i].addEventListener('drop', timelineDrop);
                dateButtons[$i].addEventListener('dragover', allowDrop);
                dateButtons[$i].addEventListener('dragleave', resetStyle);
            }
        }

    }

    /************************** MAP GAME ***************************/

    //runs map game
    function runMapGame()
    {
        theQuest = document.getElementById("question").innerHTML;
        if (theQuest !== null && theQuest !== '')
        {
            var lat = document.getElementById("question").getAttribute("data-lat");
            var long = document.getElementById("question").getAttribute("data-long");
            var zoom = document.getElementById("question").getAttribute("data-zoom");
            var map = L.map('map').setView([lat, long], zoom);
            map.options.minZoom = 2;
            map.options.maxZoom = 5;

            var el = document.getElementsByClassName('leaflet-container');
            for (var i = 0; i < el.length; i++)
            {
                el[i].style.backgroundColor = '#b8dfe6';
            }

            //Sets boundaries for the distance the user can span in pixels
            var southWest = L.latLng(-85.0511, -180);
            northEast = L.latLng(85.0511, 180);
            var bounds = L.latLngBounds(southWest, northEast);
            map.setMaxBounds(bounds);
            map.on('drag', function () {
                map.panInsideBounds(bounds, {animate: false});
            });

            var link = '../maps2018/json/' + document.getElementById("question").getAttribute("data-geo");
            $.getJSON(link, function (result) {
            baseLayer = L.geoJson(result, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);

            function style(feature)  {
                return {
                    fillColor: 'white',
                    weight: 1,
                    opacity: 1,
                    color: 'black',
                    fillOpacity: 0.8
                }
            }

            function onEachFeature(feature, layer)
            {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: onClick
                });
            }

            var alreadyRight = false;
            var rightAnswer;
            var clickedWrong = false;

            function onClick(e)
            {
                stopTheTimer();
                var layer = e.target;
                var currentQuestion = document.getElementById("question");
                if(!alreadyRight) { //prevents it from going red after you have gotten it right
                    rightAnswer = currentQuestion.innerHTML.substring(9);
                }

                var infoKey = document.getElementById("question").getAttribute("data-info");
                var clickedAnswer = layer.feature.properties[infoKey];

                if(rightAnswer == clickedAnswer) //they got it right
                {
                    layer.setStyle({
                        fillColor: 'green'
                    });
                    document.getElementById("question").innerHTML = "Correct! That is " + rightAnswer;
                    if(!alreadyRight && !clickedWrong)
                    {
                        increaseScore();
                    }
                    alreadyRight = true;
                }
                else
                {
                    clickedWrong = true;
                    layer.setStyle({
                        fillColor: 'red'
                    });
                }
            }

            // Highlights the area that the mouse is hovering over in gray
            function highlightFeature(e)
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
            function resetHighlight(e)
            {
                var layer = e.target;
               layer.setStyle({
                   weight: 1,
                   color: 'black'
            });
            }
        }); //end of getting the geojson

        theTime = parseInt(document.getElementById("timer").innerHTML);
        runTimer(theTime);
        if (getNumberOfTeams() == 1)
        {
            document.getElementById("progress-bar").style.width = ourWidth;
        }
        for (i = 1; i <= getNumberOfTeams(); i ++)
        {
            if (i == getCurrentTeamNum())
            {
                document.getElementById("scoreboard" + i).style.color = "LightSkyBlue";
            }
            else
            {
                document.getElementById("scoreboard" + i).style.color = "yellow";
            }
        }

        theSender = document.getElementById("theSender");
        theSender.addEventListener('click', getNewMapQuestion);
        }
        else
        {
            document.getElementById("top").innerHTML = "GAME OVER";
        }
    }

    //gest the new map question
    function getNewMapQuestion()
    {
        questionNum ++;
        var newTeam = getNewTeamNum();
        current = window.location.href;
        id = current.substring(37);
        //the_url = "looma-game-utilities.php?" + id;
        the_url = "looma-game-utilities.php" + id;
        jQuery.ajax({
            type: "POST",
            url: the_url,
            data: {question: questionNum, score: ourScores, team: newTeam},
            datatype: 'json',
                    success: function (response) {
                        console.log("sent it");
                        var game = document.getElementById("thegameframe");
                        game.innerHTML = response;
                        resetTimer();
                        runMapGame();
                 }
        });
    }

    /*loads all of the games onto the window based on header
    stated in the looma-game.php file*/
    window.onload = function()
    {
        var head = document.getElementById("header");
        if (head.title == "mc")
        {
            getNumberOfTeams();
            runMCGame();
        }
        else if (head.title == "matching")
        {
            runMatchingGame(numMatched);
        }
        else if (head.title == "concentration")
        {
            concentrationGame(numMatched);
        }
        else if (head.title == "timeline")
        {
            timelineGame(numMatched);
        }
        else if (head.title == "map")
        {
            runMapGame();
        }
    };



