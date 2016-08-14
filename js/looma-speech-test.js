/*
LOOMA javascript file
Filename: xxx.JS
Description:

Programmer name:
Email:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision: Looma 2.0.x

Comments:
 */

'use strict';

/*define functions here */

window.onload = function ()
    {
//local copy of LOOMA.speak, so that we can ensure that MIMIC is used instead of SPEECHSYNTHESIS

/* LOOMA.speak()
 * Author: Akshay Srivatsan
 * Date: Summer 2015/2016
 * Description: Put this function in your JavaScript file to use TTS
 * or just import this file from your HTML file.
 * If it uses Mimic, the call can specify a Mimic voice.
 *
 * Uses the standard javascript object "speechSynthesis" if present [and browser !== Chromium],
 * otherwise, calls server-side looma-mimic.php, which uses Mimic to generate a wave file
 *
 * Requirements for mimic: Mimic must be installed on the Looma or server that serves
 *   this JS file. The speech synthesis PHP file must be at "/Looma/looma-mimic.php".
 */
LOOMA.speak = function(text, voice) {

    if (!voice) voice = LOOMA.readStore('voice', 'cookie') || 'cmu_us_slt'; //get the currently used voice, if any. default VOICE is "slt"

    console.log('speaking using:  ' + voice);

    var speechButton = document.getElementsByClassName("speak")[0];

    if (LOOMA.speak.animationsInProgress == null) {
        LOOMA.speak.animationsInProgress = 0;
    }
    /*
     * Makes the "Speak" button opqaue and four times as large, to give feedback to the user while the TTS request is waiting.
     * Only runs when Mimic is used.
     */
    LOOMA.speak.activate = function() {
        if (speechButton) {
            LOOMA.speak.animationsInProgress += 1;
            //console.log("Add Animation: " + LOOMA.speak.animationsInProgress);
            // If an animation is in progress, leave the settings alone.
            if (LOOMA.speak.animationsInProgress == 1) {
                speechButton.oldOpacity = $(speechButton).css("opacity");
                speechButton.oldWidth = $(speechButton).css("width");
                speechButton.oldHeight = $(speechButton).css("height");
                //console.log("UPDATE");
            }
            //console.log(speechButton.oldWidth);
            $(speechButton).animate({
                opacity: 1,
                width: parseFloat(speechButton.oldWidth) * 2 +
                    "px",
                height: parseFloat(speechButton.oldHeight) * 2 +
                    "px",
            }, 500);
        }
    }; // end speak.activate()

    /*
     * Makes the "Speak" button translucent and regular sized, to show the user that the TTS is finished.
     * Only runs when Mimic is used.
     */
    LOOMA.speak.disable = function() {
        if (speechButton) {
            // speechButton.style.opacity = "";
            $(speechButton).animate({
                opacity: speechButton.oldOpacity,
                width: speechButton.oldWidth,
                height: speechButton.oldHeight,
            }, 500, undefined, function() {
                speechButton.style.opacity = "";
                speechButton.style.width = "";
                speechButton.style.height = "";

                //console.log("Remove Animation: " + LOOMA.speak.animationsInProgress);
                LOOMA.speak.animationsInProgress -= 1;
                if (LOOMA.speak.animationsInProgress == 0) {
                    speechButton.oldOpacity = null;
                    speechButton.oldWidth = null;
                    speechButton.oldHeight = null;
                }
            });
        }
    }; // end speak.disable()

    /*
     * Resets the TTS and button to their original states (only when Mimic is used).
     */
    LOOMA.speak.cleanup = function() {
        if (speechSynthesis.speaking) speechSynthesis.pause()
        else
        {
            LOOMA.speak.playingAudio.pause();
            LOOMA.speak.playingAudio = null;
            LOOMA.speak.speechQueue = [];
            LOOMA.speak.disable();
        }
    }; // end speak.cleanup

    if (LOOMA.speak.speechQueue == null) {
        LOOMA.speak.speechQueue = [];
    }
    window.onbeforeunload = function() {
        console.log("Stopping Audio");
        LOOMA.speak.cleanup();
    };

    if (
          /*comment out this "false" to use local JS speechSynthesis */
          false &&
          /*  end of comment around "false" */
         speechSynthesis && (navigator.userAgent.indexOf("Chromium") == -1))
        {
        // use speechSynthesis if the user is running Safari or Chrome.
        //Firefox doesn't have speechSynthesis, and Chromium's speechSynthesis is broken.
        if (speechSynthesis.speaking) {
            if (speechSynthesis.paused)
                speechSynthesis.resume();
            else speechSynthesis.pause();
        } else {
            // speechSynthesis usually accounts for latency itself, so there's no need to queue requests.
            var speech = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(speech);
        }
    } else {
        if (LOOMA.speak.playingAudio != null) {
            // Stop the currently playing speech.
            console.log("Stopping Audio");
            LOOMA.speak.playingAudio.pause();
            LOOMA.speak.cleanup();
        } else {
            // To reduce latency before speech starts, split the speech into sentences, and speak each separately.
            console.log("Playing Audio: " + text);

            // Splitting over these punctuation marks will usually work.
            //There are a few cases where it will sound unusual ("Dr.", "Mr.", "Ms.", etc).
            //It may lag on unusually long sentences without punctuation.
            var splitSentences = text.split(/[.,?!;:]/);
            var lastAudio = null;
            var firstAudio = null;
            console.log("Speaking " + splitSentences.length + " phrases.");

            for (var i = 0; i < splitSentences.length; i++) {
                var currentText = splitSentences[i];
                var audioSource;
                if (voice) {
                    audioSource = '/Looma/looma-mimic.php?text=' +
                        encodeURIComponent(
                            currentText) +
                        '&voice=' + encodeURIComponent(voice);
                } else {
                    audioSource = '/Looma/looma-mimic.php?text=' +
                        encodeURIComponent(
                            currentText);
                }
                // This is like preloading images – all the requests to mimic will execute early, so there won't be lag between phrases.
                var currentAudio = new Audio(audioSource);

                currentAudio.onended = function() {
                    // When this phrase is over, start the next one.
                    console.log("End of Phrase");
                    var nextAudio = LOOMA.speak.speechQueue.pop(); // The equivalent of "dequeue". (Pulls from the end of the array.)
                    if (nextAudio != null) {
                        LOOMA.speak.playingAudio = nextAudio;
                        console.log("Playing Next Phrase");
                        nextAudio.play();
                    } else {
                        // There's nothing else to do, just remove the flag.
                        console.log("Done with all phrases.");
                        LOOMA.speak.cleanup();
                    }
                };

                if (lastAudio == null) {
                    firstAudio = currentAudio;
                } else {
                    LOOMA.speak.speechQueue.unshift(currentAudio); // The equivalent of "enqueue". (Puts it at the beginning of the array.)
                }
                lastAudio = currentAudio;
            }
            LOOMA.speak.playingAudio = firstAudio;
            console.log("Playing Phrase");
            firstAudio.play();
            LOOMA.speak.activate();
        }

    }
}; //end speak()
//***************

    function speak(engine, text) {
        switch (engine) {
            case 'mimic':
                LOOMA.speak(text);
            break;
            case 'synthesis':
                var speech = new SpeechSynthesisUtterance(text);
                //speech.voice ='Ellen';

                var voices = window.speechSynthesis.getVoices();
                speech.voice = voices.filter(function(voice) { return voice.name == 'Chrome OK US English Female HQ'; })[0];

                speechSynthesis.speak(speech);
            break;
            case 'responsive':
                if(responsiveVoice.voiceSupport()) {
                    responsiveVoice.setDefaultVoice("US English Female");
                    responsiveVoice.speak(text);}
                else console.log ('responsiveVoice not present');

            break;

            case 'pico':
                new Audio('/Looma/looma-speech.php?text=' + encodeURIComponent(text)).play();
            break;
            case 'other':
            break;
        };//end switch
        }; //end speak()


    $(document).ready (function() {
        $('button').click(function(){
            speak($(this).attr('id'), $('input#text').val());
        });

    /*  $('button.synthesis').click(function(){speak('hello looma. speech is working');});

        $('input#text').change(function(){
            //$('input:textbox').val()
            LOOMA.speak(this:textbox.val());
        });
    */
    }); //end document.ready function
};