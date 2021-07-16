
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
LOOMA.speak = function(text, engine, voice, rate) {
    //speak the TEXT,
    //using [optional] ENGINE (in {'synthesis', 'mimic'})
    //using [optional] VOICE
    // [optional] RATE sets the speed of speech. (rate > 1 is FASTER)
    //      in mimic  --setf duration_stretch=1/rate ( e.g. if rate === 0.5 stretch by 2x (slower))
    //      in speechSynthesis  SpeachSynthesisUtterance.rate = rate ( e.g. if rate === 0.5 speak slower)
    //  for Looma in Nepal, use default rate = 2/3
    
    var playPromise;
    
if (text != "" ) {
    const defaultspeed = 2/3;
    var   speed = rate ? rate : defaultspeed;
    
    /* requires a special regex package, like xregexp [https://www.regular-expressions.info/xregexp.html]
         const devanagari = /p{Devanagari}/u;
         if (text.match(devanagari)) text = "I cannot speak Nepali";
    */
    
    // SET ENGINE - use speechsynthesis if present (but not with Chromium)
    if (!engine && speechSynthesis && (navigator.userAgent.indexOf("Chromium") == -1)) {
        engine = 'synthesis';
    }
    if (!engine) engine = 'mimic';  //default engine is mimic
    
    if (!voice) voice = LOOMA.readStore('voice', 'cookie') || 'cmu_us_bdl'; //get the currently used voice, if any. default VOICE
    
    /* current default voice for MIMIC = cmu_us_bdl
    Note from David: The three that seem about equal in clarity,
    lack of low frequency rumble, lack of piercing high frequency … are
        Scottish male	awb (has a bit of the trilled ‘r’)
        US male 		bdl   (Haydi say maybe the best)
        US male		    rms
     */
    /*
    speechSynthesis english voices include:
    TRY THESE
    "Google US English"
    "Google UK English Female"
    "Google UK English Male"
     */
    
    console.log('speaking : "' + text + '" using engine: ' + engine + ' and voice: ' + voice);
    
    if (LOOMA.speak.animationsInProgress == null) {
        LOOMA.speak.animationsInProgress = 0;
    }
    if (LOOMA.speak.speechQueue == null) {
        LOOMA.speak.speechQueue = [];
    }
    window.onbeforeunload = function () {
        console.log("Leaving this page. Stopping Audio");
        LOOMA.speak.cleanup();
    };
    
    /*
    * speak.activate() makes the "Speak" button opqaue and four times as large,
    * to give feedback to the user while the TTS request is waiting.
    * Only called when Mimic is used.
    */
    LOOMA.speak.activate = function () {
        var speechButton = document.getElementsByClassName("speak")[0];
        if (speechButton) {
            LOOMA.speak.animationsInProgress += 1;
            // If no animation is in progress, remember the button size
            if (LOOMA.speak.animationsInProgress == 1) {
                speechButton.oldOpacity = $(speechButton).css("opacity");
                speechButton.oldWidth = $(speechButton).css("width");
                speechButton.oldHeight = $(speechButton).css("height");
                
                $(speechButton).animate({
                    opacity: 1,
                    width: parseFloat(speechButton.oldWidth) * 2 + "px",
                    height: parseFloat(speechButton.oldHeight) * 2 + "px",
                }, 500);
            }
        }
    }; // end speak.activate()
    
    /*
     * speak.disable() makes the "Speak" button translucent and regular sized,
     * to show the user that the TTS is finished.
     * Only called when Mimic is used.
     */
    LOOMA.speak.disable = function () {
        if (speechButton) {
            LOOMA.speak.animationsInProgress -= 1;
            if (LOOMA.speak.animationsInProgress == 0) {
                $(speechButton).animate({
                    opacity: speechButton.oldOpacity,
                    width: speechButton.oldWidth,
                    height: speechButton.oldHeight,
                }, 500);
            }
        }
    }; // end speak.disable()
    
    /*
     * Resets the TTS and button to their original states (only when Mimic is used).
     */
    LOOMA.speak.cleanup = function () {
        if (speechSynthesis.speaking) {
            speechSynthesis.pause();
            clearInterval(interval);
        }
        else {
            LOOMA.speak.playingAudio.pause();
            LOOMA.speak.playingAudio = null;
            LOOMA.speak.speechQueue = [];
            LOOMA.speak.disable();
        }
    }; // end speak.cleanup
    
    ////////////////////////////////
    //start of LOOMA.speak code: ///
    ////////////////////////////////
    
    var interval;  // kludge to get around speechSynthesis bug when speaking long texts
    
    if (engine === 'synthesis') {
        // we use synthesis if the user is running Safari or Chrome.
        // Firefox does have speechSynthesis, but be sure to set webspeech.synth.enabled=true in about:config
        // Chromium's speechSynthesis seems to be broken. (re-check this)
        if (speechSynthesis.speaking) {
            if (speechSynthesis.paused) {
                speechSynthesis.resume();
                interval = setInterval(() => { speechSynthesis.pause(); speechSynthesis.resume(); }, 5000);
            }
            else {
                clearInterval(interval); interval = 0;
                speechSynthesis.pause();
            }
        } else {
            // speechSynthesis usually accounts for latency itself, so there's no need to queue requests.
            var speech = new SpeechSynthesisUtterance(text);
            speech.rate = speed;   // e.g. if rate is 2/3, slow down
            speechSynthesis.speak(speech);
            
            interval = setInterval(() => { speechSynthesis.pause(); speechSynthesis.resume(); }, 5000);
            
        }
    }
    
    else { // engine is NOT 'synthesis', therefore call server-side looma-speech.php which uses 'mimic'
        if (LOOMA.speak.playingAudio != null) {
            // If speaking, stop the currently playing speech.
            console.log("Stopping Audio");
            //LOOMA.speak.playingAudio.pause();
            LOOMA.speak.cleanup();
        } else {  //else start the new speech
            console.log("Playing Audio: " + text);
            
            // To reduce latency before speech starts, split the speech into sentences, and speak each separately.
            // separating on: period, comma, question mark, exclamation mark, semicolon, colon   /[.,?!;:]/
            // Splitting over these punctuation marks will usually work.
            //There are a few cases where it will sound unusual ("Dr.", "Mr.", "Ms.", etc).
            //It may lag on unusually long sentences without punctuation.
            var splitSentences = text.split(/[.,?!;:]/);
            console.log("Speaking " + splitSentences.length + " phrases.");
            
            var lastAudio = null;
            var firstAudio = null;
            
            for (var i = 0; i < splitSentences.length; i++) {
                var currentText = splitSentences[i];
                var audioSource;
                if (voice) {
                    audioSource = 'looma-mimic.php?text=' +
                        encodeURIComponent(currentText) +
                        '&voice=' + encodeURIComponent(voice) +
                        '&rate=' + encodeURIComponent(speed);
                } else {
                    audioSource = 'looma-mimic.php?text=' +
                        encodeURIComponent(currentText);
                }
                // This is like preloading images – all the requests to mimic will execute early, so there won't be lag between phrases.
                var currentAudio = new Audio(audioSource);
                
                //this 'onended' handler is attached to each phrase before it is entered into the queue
                currentAudio.onended = function () {
                    // When this phrase is over, start the next one, by popping it off the queue
                    console.log("End of Phrase");
                    var nextAudio = LOOMA.speak.speechQueue.pop(); // The equivalent of "dequeue". (Pulls from the end of the array.)
                    if (nextAudio != null) {
                        LOOMA.speak.playingAudio = nextAudio;
                        console.log("Playing Next Phrase");
                        //play the next phrase
                        playPromise = nextAudio.play();
                    } else {
                        // There's nothing else to do, just remove the flag.
                        console.log("Done with all phrases.");
                        LOOMA.speak.cleanup();
                    }
                };
                
                if (lastAudio == null) { //for the first phrase, dont put it on the queue, just play it
                    firstAudio = currentAudio;
                } else {
                    //push this phrase onto the queue
                    LOOMA.speak.speechQueue.unshift(currentAudio); // The equivalent of "enqueue". (Puts it at the beginning of the array.)
                }
                lastAudio = currentAudio;
            }  // end FOR loop which builds the queue of audio phrases to play
            
            LOOMA.speak.playingAudio = firstAudio;
            console.log("Playing Phrase");
            //play the first phrase
            playPromise = firstAudio.play().then(
                function () {
                    console.log('Play started');
                }).catch(
                function (error) {
                    console.log('Play promise error: ', error);
                });
            
            console.log('promise is ', playPromise);
            
            // In browsers that don’t yet support this functionality,
            // playPromise won’t be defined.
            /*  if (playPromise !== undefined) {
                  playPromise.then(function () {
                      console.log('Play started');
                  }).catch(function (error) {
                      console.log('Play promise error: ', error);
                  });
             
              }
            */
            LOOMA.speak.activate();
        }
        }  //end of code that calls server-side MIMIC
    } // end if (text != '')
}; //end LOOMA.speak()
