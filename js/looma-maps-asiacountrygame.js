/*
*
LOOMA js code file
Filename: looma-maps-asiacountries.js
Description: this file randomly chooses a continent and highlights it, then asks the user to name the continent. It checks if the user is right, then asks about a new continent.
*/

window.onload = function () {
    
    var answers = ["Afghansitan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", "Brunei", "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia", "Iran", "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos", "Lebanon", "Malaysia", "Mongolia", "Myanmar (Burma)", "Nepal", "North Korea", "Oman", "Pakistan", "Philippines", "Qatar", "Russia", "Saudi Arabia", "South Korea", "Sri Lanka", "Syria", "Taiwan", "Tajikistan", "Thailand", "Timor-Leste", "Turkey", "Turkmenistan", "United Arab Emirates (UAE)", "Uzbekistan", "Vietnam", "Yemen"];
    var currentAnswerNum;
    var userGuess = document.getElementById("userGuess");
    var txtOutput = document.getElementById("txtOutput");
    var outputValue;
    
    var submitButton = document.getElementById("submit");
    submitButton.addEventListener('click', userInput);
    
    var nextButton = document.getElementById("next");
    nextButton.addEventListener('click', newQuestion);
    
    //create new canvas
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    
    //map to reference
    var map = new Image();
    map.src = "../maps/AsiaCountriesGame/images/asia-countries.png";
    
    map.onload = function () {
        ctx.drawImage(map, 0, 0), 464, 400;
        generateQuestion();
    };
    
    function generateQuestion() {
        txtOutput.value = '';
        currentAnswerNum = Math.floor(Math.random() * answers.length);
        showMarker(answers[currentAnswerNum]);
    }
    
    function newQuestion() {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(map, 0, 0);
        generateQuestion();
        return false;
    }
    
    function showMarker(answer) {
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        switch (answer) {
            case "Afghansitan":
                ctx.arc(140, 215, 20, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Armenia":
                ctx.arc(70, 175, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Azerbaijan":
                ctx.arc(80, 175, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Bahrain":
                ctx.arc(530, 80, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Bangladesh":
                ctx.arc(400, 170, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Bhutan":
                ctx.arc(625, 250, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Brunei":
                ctx.arc(400, 350, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Cambodia":
                ctx.arc(80, 150, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "China":
                ctx.arc(280, 140, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Cyprus":
                ctx.arc(500, 200, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Georgia":
                ctx.arc(68, 165, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "India":
                ctx.arc(180, 280, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Indonesia":
                ctx.arc(400, 350, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Iran":
                ctx.arc(90, 210, 30, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Iraq":
                ctx.arc(50, 200, 25, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Israel":
                ctx.arc(20, 195, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Japan":
                ctx.arc(400, 150, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Jordan":
                ctx.arc(25, 200, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Kazakhstan":
                ctx.arc(150, 150, 30, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Kuwait":
                ctx.arc(62, 220, 7, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Kyrgyzstan":
                ctx.arc(175, 185, 20, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Laos":
                ctx.arc(290, 275, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Lebanon":
                ctx.arc(25, 190, 5, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Malaysia":
                ctx.arc(290, 350, 15, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(340, 340, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Mongolia":
                ctx.arc(270, 150, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Myanmar(Burma)":
                ctx.arc(260, 275, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Nepal":
                ctx.arc(210, 245, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "North Korea":
                ctx.arc(355, 160, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Oman":
                ctx.arc(90, 275, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Pakistan":
                ctx.arc(150, 240, 25, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Philippines":
                ctx.arc(370, 290, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Qatar":
                ctx.arc(73, 242, 5, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Russia":
                ctx.arc(210, 90, 40, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Saudi Arabia":
                ctx.arc(50, 240, 30, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "South Korea":
                ctx.arc(365, 173, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Sri Lanka":
                ctx.arc(195, 335, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Syria":
                ctx.arc(40, 185, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Taiwan":
                ctx.arc(360, 235, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Tajikistan":
                ctx.arc(170, 180, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Thailand":
                ctx.arc(285, 290, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Timor-Leste":
                ctx.arc(395, 375, 7, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Turkey":
                ctx.arc(40, 165, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Turkmenistan":
                ctx.arc(135, 220, 25, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "United Arab Emirates (UAE)":
                ctx.arc(80, 250, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Uzbekistan":
                ctx.arc(130, 175, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Vietnam":
                ctx.arc(300, 265, 10, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "Yemen":
                ctx.arc(50, 280, 15, 0, 2 * Math.PI);
                ctx.stroke();
                break;
        }
    }
    
    function userInput() {
        outputValue = "";
        var guess = userGuess.value;
        
        if (guess === answers[currentAnswerNum]) {
            outputValue = "<p>Correct!</p><p> It\'s " + answers[currentAnswerNum] + "</p>";
        }
        else {
            outputValue = "Incorrect < br> It's  ";
            outputValue = "<p>Incorrect!</p><p> It\'s " + answers[currentAnswerNum] + "</p>";
        }
        //outputValue = outputValue + answers[currentAnswerNum];
        txtOutput.innerHTML = outputValue;
        return false;
    }
};
