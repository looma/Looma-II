/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: xxxxx.js
Description:
 */

'use strict';

// utility JS functions used by many LOOMA pages
/*defines:
 * LOOMA.playMedia()
 * LOOMA.setStore()
 * LOOMA.readStore()
 * LOOMA.loggedIn()
 * LOOMA.translate()
 * LOOMA.lookup()
 * LOOMA.wordlist()
 * LOOMA.setTheme()
 * LOOMA.changeTheme()
 * LOOMA.setText()
 * LOOMA.addEvent()
 * LOOMA.removeEvent()
 * LOOMA.addErrorMessage()
 * LOOMA.removeErrorMessage()
 * LOOMA.speak(text)
 * LOOMA.alert()
 * LOOMA.confirm()
 * LOOMA.prompt()
 * LOOMA.translatableSpans()
 */

var LOOMA = (function() {

    // local VARs here

    // local FUNCTIONS here

    return {


//this allows us to define LOOMA.playMedia() [and other LOOMA functions] that won't cause name conflicts

playMedia : function(button) {
    switch (button.getAttribute("data-ft")) {
        case "video":
        case "mp4":
        case "m4v":
        case "mov":
            window.location = 'looma-video.php?' +
                 'fn=' + button.getAttribute('data-fn') +
                '&fp=' + button.getAttribute('data-fp') +
                '&dn=' + button.getAttribute('data-dn');
            break;

        case "evi":
            //evi = edited video indicator
            //If you click on an edited video it sends the filename, location and the information
            //to looma-edited-video.php
            window.location = 'looma-edited-video.php?fn=' + button.getAttribute('data-fn') +
            '&fp=' + button.getAttribute('data-fp') +
            '&id=' + button.getAttribute('data-id') +
            '&dn=' + button.getAttribute('data-dn');
            break;

      case "image":
        case "jpg":
        case "png":
        case "gif":
            window.location = 'looma-image.php?fn=' + button.getAttribute(
                    'data-fn') +
                '&fp=' + button.getAttribute('data-fp');
            break;

        case "audio":
        case "mp3":
            window.location = 'looma-audio.php?fn=' + button.getAttribute(
                    'data-fn') +
                '&fp=' + button.getAttribute('data-fp') +
                '&dn=' + button.getAttribute('data-dn');
            break;

        case "pdf":
            /*
            //direct call to  ViewerJS replaced with looma-pdf.php with iframe
            window.location = 'ViewerJS/#../' + button.getAttribute('data-fp') + button.getAttribute('data-fn');
            */

            //old code using PDF.js
            window.location = 'looma-pdf.php?fn=' + button.getAttribute(
                    'data-fn') +
                '&fp=' + button.getAttribute('data-fp') +
                '&zoom=' + button.getAttribute('data-zoom') +
                '&pg=' + button.getAttribute('data-pg');


            break;

        case "slideshow":      // SLIDESHOW activity type from Thomas
                     window.location = 'looma-slideshow.php?id=' + button.getAttribute("data-id");
            break;

        case "html":
            var fp = encodeURIComponent(button.getAttribute('data-fp'));
            var fn = encodeURIComponent(button.getAttribute('data-fn'));
            window.location = 'looma-html.php?fp=' + fp + '&fn=' + fn;
            break;

        case "epaath":
        case "EP":
            /*var target = button.getAttribute('data-fp') +
                              button.getAttribute('data-fn') +
                              "/start.html";
            */
            fp = encodeURIComponent(button.getAttribute('data-fp'));
            fn = encodeURIComponent(button.getAttribute('data-fn') +
                '/start.html');
            window.location = 'looma-html.php?fp=' + fp + '&fn=' + fn;

            /*window.location = button.getAttribute('data-fp') +
                              button.getAttribute('data-fn') +
                              "/start.html";
            */
            /*'looma-epaath.php?fn=' + button.getAttribute('data-fn') +
                               '&fp=' + button.getAttribute('data-fp');
                               */
            break;
        default:
            console.log("ERROR: in LOOMA.playMedia(), unknown type: " +
                button.getAttribute("data-ft"));
    } //end SWITCH
}, //end LOOMA.playMedia()

capitalize : function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}, //end capitalize()


//use localStore, type='local' or type='session' instead of cookies when the data doesnt have to be sent to the server
/*current COOKIES and webstorage used:
 * theme [cookie]
 * scroll [sessionStore]
 * language, class, subject, chapter, arith-grade, arith-subject,
 * vocab-grade, vocab-subject, vocab-count, vocab-random [localStore]
 */
setStore : function(name, value, type) {
    if (type == 'local') localStorage.setItem(name, value);
    else if (type == 'session') sessionStorage.setItem(name, value);
    else if (type == 'cookie') document.cookie = name + '=' +
        encodeURIComponent(value);
    else console.log('LOOMA.utilities.setStore: unknown localStore type: ' +
        type);
},

readStore : function(name, type) {
    if (type == 'local') return localStorage.getItem(name);
    else if (type == 'session') return sessionStorage.getItem(name);
    else if (type == 'cookie') return LOOMA.readCookie(name);
    else {
        console.log('LOOMA.utilities.readStore: unknown localStore type: ' +
            type);
        return null;
    }
},

readCookie : function(name) {
    // look up COOKIE with KEY = name, return its value, or null if cookie doesnt exist
    var cookies = document.cookie.split(';'); //OK if no cookie? YES
    // iterate through all the cookies to find "name=..." cookie, return its value
    for (var i = 0, count = cookies.length; i < count; i++) {
        // remove leading spaces inserted by some browsers
        var cookie = (cookies[i].slice(0, 1) == ' ' ? cookies[i].slice(1) :
            cookies[i]);
        cookie = decodeURIComponent(cookie);
        cookie = cookie.split('=');
        if (cookie[0] == name) return cookie[1]; //return the value of cookie with key "name"
    }
    return null; // if cookie with key "name" is not found, return NULL
}, // end readCookie()

loggedIn : function() {
    return LOOMA.readCookie('login');
}, //end loggedIn()

translate : function(language) {
    // based on the value of LANGUAGE, hide or show all KEYWORDs and TIPs
    if (language == 'native') {
        $('.english-keyword').hide();
        $('.native-keyword').show();
        $('.english-tip').removeClass('yes-show');
        $('.native-tip').addClass('yes-show');
    } else /*english*/ {
        $('.english-keyword').show();
        $('.native-keyword').hide();
        $('.english-tip').addClass('yes-show');
        $('.native-tip').removeClass('yes-show');
    }
    //change toolbar TRANSLATE icon to the flag of the OTHER language (not being currently shown)
    if (language == 'english') $('#flag').attr('src',
        'images/native-flag.png');
    else /*native*/ $('#flag').attr('src', 'images/english-flag.png');


    // DEBUG     console.log("LOOMA.translate: changing language to " + language);

}, // end translate()

//***********  USING THE LOOMA DICTIONARY ***************
//***********  functions are LOOKUP and WORDLIST *****************
//
//when you need a word looked up in the dictionary, call LOOMA.lookup() with these parameters:
//            word: the word to look up
//            succeed: a FUNCTION to be called when the definition comes back from the dictionary server
//                the parameter of the call to "succeed" is an object with these properties:
//                    result.en = english word
//                    result.np = nepali translation [may be ""]
//                    result.phon = phonetic of nepali word [may be ""]
//                    result.def = english definition [may be ""]
//                    result.img = filename for a picture of the word [may be ""]
//                    result.ch_id = code for textbook chapter the word first appears in [may be ""]
//                typically, succeed() would display the translation (result.np), the definition (result.def) and
//                the picture (result.img) somewhere on the webpage
//                NOTE: if the lookup request is processed, but the word is not found in the dictionary, the request will "succeed"
//                      and the result will be result.defn = "Word not found"
//            fail: a FUNCTION to be called if the lookup request fails (for instance if the Looma server is down)
//                typically, fail() would display "Dictionary lookup request failed" somewhere on the webpage

lookup : function(word, succeed, fail) {

    console.log('LOOMA.lookup: dictionary lookup - word is "' + word + '"');

    $.ajax(
        "looma-dictionary-utilities.php", //Looma Odroid
        //"http://192.168.1.135/Database Editor/looma-dictionary-utilities.php",  //justin's macbook
        {
            type: 'GET',
            cache: false,
            crossDomain: true,
            dataType: "json",
            data: "cmd=lookup&word=" + encodeURIComponent(word.toLowerCase()),
            error: fail,
            success: succeed //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
        });

    return false;
}, //end LOOKUP

//when you need a list of words from the dictionary, call LOOMA.wordlist() with these parameters:
//            class: the class level of the words [optional], should be in the format "class1", "class2", etc.
//            subj: the textbook subject of the words [optional], should be in this format, ("math", "english", "nepali", "science", "socialstudies")
//            count: number of words requested. [optional, defaults to 25]
//            random: use "true" for a randomly ordered word list, "false" for an alpha ordered word list, [optional, set to "false" by default]
//                    NOTE: 'random' is a string, not a boolean
//            succeed: a FUNCTION to be called when the definition comes back from the dictionary server
//                the parameter to 'succeed' is an array of [english] words
//            fail: a FUNCTION to be called if the word list request fails (for instance if the Looma server is down)
//                typically, fail() would display "Dictionary lookup request failed" somewhere on the webpage
wordlist : function(grade, subj, count, random, succeed, fail) {

    $.ajax(
        "looma-dictionary-utilities.php", //Looma Odroid
        //"http://192.168.1.135/Database Editor/looma-dictionary-utilities.php", //justin's macbook
        //  "looma-dictionary.php",
        {
            type: 'GET',
            cache: false,
            crossDomain: true,
            dataType: "json", //jQ will convert the response back into JS, dont need parseJSON()
            data: "cmd=list" +
                "&class=" + encodeURIComponent(grade) +
                "&subj=" + encodeURIComponent(subj) +
                "&count=" + count.toString() +
                "&random=" + encodeURIComponent(random),
            error: fail,
            success: succeed //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
        });

    return false;
}, //end WORDLIST

rtl : function(element) { //enables Right-to-left input for numbers in looma-arith-problems.php
    if (element.setSelectionRange) element.setSelectionRange(0, 0);
},



// ************** LOOMA THEME FUNCTIONS *******************
// ************** functions are SETTHEME and CHANGETHEME *****

//         THEMES are defined in 'looma-theme-themename.css' files
//        pressing a theme change button (in footer or looma-settings.php) calls changeTheme() which
//            resets the 'theme' cookie and calls setTheme()
//        setTheme () reads the 'theme' cookie to get 'newthemename'
//            and changes the HREF of the LINK element with ID='theme' to point to the file 'looma-theme-newthemename.css

setTheme : function() {

    var theme = LOOMA.readStore('theme', 'cookie'); //get the currently used theme, if any
    if (!theme) theme = 'looma'; //default THEME is "looma"

    $('#theme-stylesheet').attr('href', 'css/looma-theme-' + theme + '.css');
    location.reload(); //some browsers need RELOAD to show the new THEME [??]
    // changes the HREF attribute of the LINK with ID 'theme-stylesheet' based on the 'theme' COOKIE value
    return theme;
}, //end LOOMA.setTheme()

changeTheme : function(e) { //theme change button has been pressed
    LOOMA.setStore('theme', encodeURIComponent(e.target.value), 'cookie');
    LOOMA.setTheme(); //change currently used theme
}, //end LOOMA.changeTheme()

changeVoice : function(e) { //voice change button has been pressed
    LOOMA.setStore('voice', encodeURIComponent(e.target.value), 'cookie');
}, //end LOOMA.changeVoice()


/* LOOMA.lookupWord()
Programmer name: Matt Flower, Maxwell Patterson, Jai Mehra
Email: matt.flower@menloschool.org , maxwell.patterson@menloschool.org , jai.mehra@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 7/7/2016
 */

    //Gets The JSON Object From dictionary collection in the Database by calling looma-dictionaryutilities.php
lookupWord : function (text) {
      var firstWord;

      text = text.trim();
      if (text.indexOf(' ') !== -1) firstWord = text.substr(0, text.indexOf(' '));
      else firstWord = text;

      $('#popup').remove();

      var $popup =  $('<div id="popup"/>');
      var $word =   $('<div id="word"/>');
      var $nepali = $('<div id="nepali"/>');
      var $def =    $('<div id="definition"/>');
      var $pos =    $('<div id="partOfSpeech"/>');


      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          //Parse JSON
          var wordJSON = JSON.parse(xmlhttp.responseText);

          //Get All Relevant Information and add it to the POPUP's HTML
          $word.text(wordJSON.en);
          $nepali.text(wordJSON.np);
          if (wordJSON.def =='plural of') wordJSON.def = wordJSON.def + ' ' + wordJSON.rw;
          $def.text(wordJSON.def);
          $pos.html('<i>' + wordJSON.part + '</i>');

          $popup.append($word, $nepali, $pos, $def);

          $popup.appendTo('body').hide();

          LOOMA.alert($popup.html(), 15);
        }
      };
      xmlhttp.open("GET", "looma-dictionary-utilities.php?cmd=lookup&word=" + firstWord, true);
      xmlhttp.send();
    },   //end lookupWord()


     /**
     * Generates translatable spans given english and native translations. You will need to know the native translation;
     * this program doesn't do any translation. For building translatable HTML on client side, e.g. from JS
     * @param english  - the english phrase
     * @param native   - the translation of the english phrase
     * */
    translatableSpans : function(english, native){
        var language = LOOMA.readStore('language', 'local');

        // rewrite to generate the spanss once, then set hidden on the correct span
        if (language == "english") {
            return "<span class='english-keyword'>" + english +
                "<span class='xlat'>" + native + "</span>" + "</span>" +
                "<span class='native-keyword' hidden>" + native +
                "<span class='xlat'>" + english + "</span>" +
                "</span>";
        } else
            return "<span class='english-keyword' hidden>" + english +
                "<span class='xlat'>" + native + "</span>" + "</span>" +
                "<span class='native-keyword'>" + native +
                "<span class='xlat'>" + english + "</span>" +
                "</span>";
    } //end translatableSpan()

    };  //end RETURN public functions
}()); //IIEF immediately instantianted function expression


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

    console.log('speaking : ' + text + ' using voice:  ' + voice);

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
          /*false && */
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
}; //end LOOMA.speak()

/*
 from looma-alerts.js in the slideshow team code
 Description: Creates a styled translatable popup interface.
 NOTES: All methods support prompts/alerts in either text or html. If using either, any text can be converted into
 Looma's translatable spans using the provided LOOMA.translatableSpans().

 Programmer name: Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
 Owner: VillageTech Solutions (villagetechsolutions.org)
 Date: 7/5/16
 Revision: 0.4

 * Makes the entire screen minus modal transparent and checks for clicks outside the modal
 */
LOOMA.makeTransparent = function() {
    var $container = $('body > div');
    $container.addClass('all-transparent');
    //the following click code doesnt work
    //$container.click(function(e) { $container.click(); });

    //nor does this one
    //$(document).click(function(e) {if (e.target !== $('.popup')[0]) LOOMA.closePopup();});

    //also set ESC key to cancel the popup
    $(document).keydown(function (e) {
        const ESC = 27;  // escape key maps to keycode `27`
        if    (e.keyCode == ESC) LOOMA.closePopup() ;
    });//end ESC listener

};  // End of makeTransparent


/** Removes any popups on the page */
LOOMA.closePopup = function() {
        //$("#confirm-popup").off('click'); //not needed if we do remove() below
        //$("#close-popup").off('click');
        //$("#dismiss-popup").off('click');
    $('.popup').fadeOut(1000).remove();
    var $container = $('body > div');
    $container.removeClass('all-transparent');
    $container.off('click');
    $(document).off('keydown');  //stop listening for ESC
    //$(document).off('click');  //stop listening for CLICK
};  //end closePopup()

/**
 * This function creates a popup message box that can be dismissed by the user.
 * @param msg - The message the user is presented.
 * @param time (optional)- a delay in seconds after which the popup is automatically closed
 * */
//var popupInterval;
LOOMA.alert = function(msg, time, notTransparent){
    LOOMA.closePopup();
    if (!notTransparent) LOOMA.makeTransparent();
    $(document.body).append("<div class= 'popup'>" +
        "<button class='popup-button' id='dismiss-popup'><b>X</b></button>"+ msg +
        "<button id ='close-popup' class ='popup-button'>" +
        LOOMA.translatableSpans("OK", "ठिक छ") + "</button></div>").hide().fadeIn(1000);

    $('#close-popup, #dismiss-popup').click(function() {
       // $("#close-popup").off('click');
        //$("#dismiss-popup").off('click');
        LOOMA.closePopup();
    });
 /*   $('#dismiss-popup').click(function() {
        LOOMA.closePopup();
    });
*/
   if (time) {
        var timeLeft = time - 1;
        var popupButton = $('#close-popup');
        popupButton.html(LOOMA.translatableSpans("OK (" + Math.round(timeLeft + 1) + ")",
            "ठिक छ(" + Math.round(timeLeft + 1) + ")"));
        clearInterval(popupInterval);
        var popupInterval = setInterval(function() {
            if (timeLeft <= 0) {
                clearInterval(popupInterval);
                LOOMA.closePopup();
            }
            timeLeft -= 1;
            popupButton.html(LOOMA.translatableSpans("OK (" + Math.round(timeLeft + 1) + ")",
                "ठिक छ(" + Math.round(timeLeft + 1) + ")"));
        },1000);
    };
};  //end alert()

/**
 * Prompts the user to confirm a message.
 * @param msg - The message the user is presented in question format.
 * @param confirmed - A function to call if the user confirms
 * @param canceled - A function to call if the user cancels
 * */
LOOMA.confirm = function(msg, confirmed, canceled, notTransparent) {
    LOOMA.closePopup();
    if (!notTransparent) LOOMA.makeTransparent();
    $(document.body).append("<div class='popup confirmation'>" +
        "<button class='popup-button' id='dismiss-popup'><b>X</b></button> " + msg +
        "<button id='close-popup' class='popup-button'>" + LOOMA.translatableSpans("cancel", "रद्द गरेर") + "</button>" +
        "<button id='confirm-popup' class='popup-button'>"+
        LOOMA.translatableSpans("confirm", "निश्चय गर्नुहोस्") +"</button></div>").hide().fadeIn(1000);

    $('#confirm-popup').click(function() {
        //$("#confirm-popup").off('click');
        LOOMA.closePopup();
        confirmed();
    });

    $('#dismiss-popup, #close-popup').click(function() {
        //$("#close-popup").off('click');
        //$("#dismiss-popup").off('click');
        LOOMA.closePopup();
        canceled();
   });
};  //end confirm()

/**
 /**
 * Prompts the user to enter text.
 * @param msg - The message the user is presented, prompting them to enter text.
 * @param callback - A function where the user's text response will be sent.
 * */
LOOMA.prompt = function(msg, confirmed, canceled, notTransparent) {
    LOOMA.closePopup();
    if (!notTransparent) LOOMA.makeTransparent();
    $(document.body).append("<div class='popup textEntry'>" +
        "<button class='popup-button' id='dismiss-popup'><b>X</b></button>" + msg +
        "<button id='close-popup' class='popup-button'>" + LOOMA.translatableSpans("cancel", "रद्द गरेर") + "</button>" +
        "<textarea id='popup-textarea' autofocus></textarea>" +
        "<button id='confirm-popup' class='popup-button'>"+
        LOOMA.translatableSpans("OK", "ठिक छ") +"</button></div>").hide().fadeIn(1000) ;

    $('#confirm-popup').click(function() {
       //$("#confirm-popup").off('click');
       confirmed($('#popup-textarea').val());
       LOOMA.closePopup();
    });

    $('#dismiss-popup, #close-popup').click(function() {
        //$("#close-popup").off('click');
        //$("#dismiss-popup").off('click');
        LOOMA.closePopup();
        canceled();
   });
};  //end prompt()


