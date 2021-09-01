/*
LOOMA javascript file
Filename: looma-template.js
Description: supports looma-xxx.php
/
Programmer name: Skip
Owner: Looma Education Company
Date: xxx  2017
Revision: Looma 3.0
*/
'use strict';
/* declare global variables here */
/* declare functions here */
const words = new Array("Hat", "Cat", "Sat", "Flat", "Tap", "Flap", "Trap", "Mat", "Top", "Stop", "Flop", "Plot", "Hot", "Job", "Dog", "Fog");
const usedWords = new Array(16);
$(document).ready(function() {
    //initialization code here
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
    function get_game_succeed(result) {
        var words = result['prompts'];
    };
    var i = 0;
    var isFinishedNum = 0;
    var isFinished = false;
    for(i = 0; i < 16; i++){
        $("#sample_button" + i.toString()).click(function() {
            var notDoneGettingWord = true;
            var newWord = "";
            var k = 0;
            isFinishedNum = 0;
            for (k = 0; k < words.length; k++){
                console.log(k + " " + words[k]);
                if (words[k] != "Used Up"){
                    isFinished = false;
                }
                else {
                    isFinishedNum = isFinishedNum + 1;
                    console.log("Finished Counter: " + isFinishedNum);
                }
            }
            if (isFinishedNum == 16){
                isFinished = true;
            }
            if (!isFinished){
                while(notDoneGettingWord){
                    newWord = getRandomWord();
                    if (newWord != "Used Up"){
                        words[words.indexOf(newWord)] = "Used Up";
                        notDoneGettingWord = false;
                    }
                }
                this.innerHTML = newWord;
            }
        });
    }
});
function getRandomWord(){
    return words[Math.floor(Math.random() * words.length)];
}
function checkIfNew(W){
    var rtnBool = true;
    var j = 0;
    for(j = 0; j < words.length; j++){
        if (W == usedWords[j]){
            rtnBool = false;
        }
    }
    return rtnBool;
}