var notAnswered = true;
var secs;


//Code was adjusted from Teddy Koker’s reply on the thread from the link below
//https://stackoverflow.com/questions/31106189/create-a-simple-10-second-countdown

function runTimer() {
    notAnswered = true;
    var startTime = $('#timer').html();
    var secs = startTime;
    function tick() 
    {
        if (notAnswered)
        {
            //This script expects an element with an ID = "timer" that has the starting time.
            var counter = document.getElementById("timer");
            counter.innerHTML = (secs < 10 ? "0" : "") + secs.toString();
            secs--;
            if(secs >= 0) 
            {
                setTimeout(tick, 1000);  
            }
            else
            {
                // defined in looma-game.js
                timesUp();
            }
        }
        else
        {
            return;
        }
    }
    tick();
}

// function stopTheQuestion()
// {
//     tooLate();
// }

//stops the timer from running
function stopTimer() //called from looma-game.js
{
    notAnswered = false;
}

// function pause()
// {
//     notAnswered = false;
// }

// function resume()
// {
//     runTimer(secs);
// }

// function getTimeLeft()
// {
//     return secs;
// }