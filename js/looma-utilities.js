/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-utilities.js
Description:
 */

'use strict';

// utility JS functions used by many LOOMA pages

/*defines:
 * LOOMA.playMedia()
 * LOOMA.notice()
 * LOOMA.confirm() not defined yet
 * LOOMA.setStore()
 * LOOMA.readStore()
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
 */

var LOOMA = {}; //define namespace object for LOOMA
                //this allows us to define LOOMA.playMedia() [and other LOOMA functions] that won't cause name conflicts

LOOMA.playMedia = function (button) {
        switch (button.getAttribute("data-ft")){
            case "video":
            case "mp4":
            case "mov":
                window.location = 'looma-video.php?fn=' + button.getAttribute('data-fn') +
                                                 '&fp=' + button.getAttribute('data-fp');
                break;
            case "image":
            case "jpg":
            case "png":
            case "gif":
                window.location = 'looma-image.php?fn=' + button.getAttribute('data-fn') +
                                                 '&fp=' + button.getAttribute('data-fp');
                break;
            case "audio":
            case "mp3":
                window.location = 'looma-audio.php?fn=' + button.getAttribute('data-fn') +
                                                 '&fp=' + button.getAttribute('data-fp');
                break;
            case "pdf":
                /*
                //direct call to  ViewerJS replaced with looma-pdf.php with iframe
                window.location = 'ViewerJS/#../' + button.getAttribute('data-fp') + button.getAttribute('data-fn');
                */

                //old code using PDF.js
                window.location = 'looma-pdf.php?fn=' + button.getAttribute('data-fn') +
                                   '&fp=' + button.getAttribute('data-fp') +
                                   '&pg=' + button.getAttribute('data-pg');


                break;
            case "epaath":
                /*var target = button.getAttribute('data-fp') +
                                  button.getAttribute('data-fn') +
                                  "/start.html";
                */
                var fp = encodeURIComponent(button.getAttribute('data-fp'));
                var fn = encodeURIComponent(button.getAttribute('data-fn') + '/start.html');
                window.location = 'looma-epaath.php?fp=' + fp + '&fn=' + fn;

                /*window.location = button.getAttribute('data-fp') +
                                  button.getAttribute('data-fn') +
                                  "/start.html";
                */
                /*'looma-epaath.php?fn=' + button.getAttribute('data-fn') +
                                   '&fp=' + button.getAttribute('data-fp');
                                   */
                break;
            default:
                console.log("ERROR: in LOOMA.playMedia(), unknown type: " + button.getAttribute("data-ft"));
        } //end SWITCH
    };//end LOOMA.playMedia()

LOOMA.notice = function(id, secs) {
        $('#' + id).show(); setTimeout(function(){ $("#notice").hide();}, secs * 1000);
};  //end notice()

LOOMA.confirm = function(text, btn1, btn2) {};  //TODO: generate a popup with text=text and two buttons with bnt1, btn2 labels.
                                                //return T or F depending on which button is clicked
                                                // use #notice CSS styling from looma.css

LOOMA.capitalize =     function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};  //end capitalize()


//use LOOMA.setStore() and LOOMA.readStore()  to set/get LocalStore and Cookies,
//use localStore, type='local' or type='session' instead of cookies when the data doesnt have to be sent to the server
    /*current COOKIES and webstorage used:
     * theme [cookie]
     * scroll [sessionStore]
     * language, class, subject, chapter, arith-grade, arith-subject,
     * vocab-grade, vocab-subject, vocab-count, vocab-random [localStore]
    */
LOOMA.setStore = function(name, value, type) {
    if      (type == 'local')   localStorage.setItem(name, value);
    else if (type == 'session') sessionStorage.setItem(name, value);
    else if (type == 'cookie')     document.cookie=name + '=' + encodeURIComponent(value);
    else console.log ('LOOMA.utilities.setStore: unknown localStore type: ' + type);
};

LOOMA.readStore = function (name, type) {
    if      (type == 'local')   return localStorage.getItem(name);
    else if (type == 'session')    return sessionStorage.getItem(name);
    else if (type == 'cookie')  return LOOMA.readCookie(name);
    else {console.log ('LOOMA.utilities.readStore: unknown localStore type: ' + type); return null;}
};

LOOMA.readCookie = function(name) {
    // look up COOKIE with KEY = name, return its value, or null if cookie doesnt exist
    var cookies = document.cookie.split(';');  //OK if no cookie? YES
    // iterate through all the cookies to find "name=..." cookie, return its value
    for (var i = 0, count = cookies.length; i < count ; i++) {
        // remove leading spaces inserted by some browsers
        var cookie = (cookies[i].slice(0,1) == ' ' ? cookies[i].slice(1) : cookies[i]);
        cookie = decodeURIComponent(cookie);
        cookie = cookie.split('=');
        if (cookie[0] == name) return cookie[1]; //return the value of cookie with key "name"
    }
    return null; // if cookie with key "name" is not found, return NULL
};     // end readCookie()

LOOMA.translate = function(language) {
    // based on the value of LANGUAGE, hide or show all KEYWORDs and TIPs
    if (language == 'native') {$('.english-keyword').hide(); $('.native-keyword').show();
                               $('.english-tip').removeClass('yes-show');
                               $('.native-tip').addClass('yes-show');}
    else  /*english*/         {$('.english-keyword').show(); $('.native-keyword').hide();
                               $('.english-tip').addClass('yes-show');
                               $('.native-tip').removeClass('yes-show');}
    //change toolbar TRANSLATE icon to the flag of the OTHER language (not being currently shown)
    if (language == 'english') $('#flag').attr('src','images/native-flag.png');
    else /*native*/               $('#flag').attr('src','images/english-flag.png');


    // DEBUG     console.log("LOOMA.translate: changing language to " + language);

}; // end translate()

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

LOOMA.lookup = function (word, succeed, fail) {

    console.log('LOOMA.lookup: dictionary lookup - word is ' + word);

    $.ajax(
        "looma-dictionary-utilities.php",  //Looma Odroid
         //"http://192.168.1.135/Database Editor/looma-dictionary-utilities.php",  //justin's macbook
         {type: 'GET',
          cache: false,
          crossDomain: true,
          dataType: "json",
          data: "cmd=lookup&word=" + encodeURIComponent(word.toLowerCase()),
          error: fail,
          success: succeed   //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
         });

    return false;
}; //end LOOKUP

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
 LOOMA.wordlist = function (grade, subj, count, random, succeed, fail) {

    $.ajax(
        "looma-dictionary-utilities.php",  //Looma Odroid
         //"http://192.168.1.135/Database Editor/looma-dictionary-utilities.php", //justin's macbook
         //  "looma-dictionary.php",
         {type: 'GET',
          cache: false,
          crossDomain: true,
          dataType: "json",            //jQ will convert the response back into JS, dont need parseJSON()
          data:
                    "cmd=list" +
                      "&class=" + encodeURIComponent(grade) +
                      "&subj=" + encodeURIComponent(subj) +
                      "&count=" + count.toString() +
                      "&random=" + encodeURIComponent(random),
          error: fail,
          success: succeed  //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
         });

    return false;
}; //end WORDLIST

LOOMA.rtl = function(element) {    //enables Right-to-left input for numbers in looma-arith-problems.php
    if(element.setSelectionRange) element.setSelectionRange(0,0);
    };

LOOMA.showScroll = function(x) {  //reports scroll to console for DEBUGging
    console.log('LOOMA.showScroll: scrolling ', $("#main-container-horizontal").scrollTop(), ' timer = ', x);
    };

LOOMA.scrollStop = function(){

        //should call on $('.main-container-horizontal.scroll') ???

        //DEBUG     LOOMA.showScroll(scrollTimeout);

        //still scrolling, so clear the timeout, then reset the timeout counter
        if (scrollTimeout) clearTimeout(scrollTimeout);
        //set the timer - when it  expires [after scrollDebounce msecs], call adjustScroll()
        scrollTimeout = setTimeout(function(){LOOMA.adjustScroll();},scrollDebounce);
        };

LOOMA.adjustScroll = function() {
    var increment = 166;
    var temp;
    //var i = $('#main-container-horizontal').scrollTop();
    ///var j = i /increment;
    //var k = Math.floor(j);
    //var l = increment * k;

    temp = increment * Math.floor($("#main-container-horizontal").scrollTop() / increment);
    $("#main-container-hroizontal").off('scroll');

    $("#main-container-horizontal").scrollTop(temp);

    $("#main-container-horizontal").scroll(LOOMA.scrollStop);

    console.log('LOOMA.adjustScroll: scroll adjusted to ', temp);

};


// ************** LOOMA THEME FUNCTIONS *******************
// ************** functions are SETTHEME and CHANGETHEME *****

//         THEMES are defined in 'looma-theme-themename.css' files
//        pressing a theme change button (in footer or looma-settings.php) calls changeTheme() which
//            resets the 'theme' cookie and calls setTheme()
//        setTheme () reads the 'theme' cookie to get 'newthemename'
//            and changes the HREF of the LINK element with ID='theme' to point to the file 'looma-theme-newthemename.css

LOOMA.setTheme = function() {

    var theme = LOOMA.readStore('theme', 'cookie'); //get the currently used theme, if any
    if (!theme) theme='looma';           //default THEME is "looma"

    $('#theme-stylesheet').attr('href', 'css/looma-theme-' + theme + '.css');
    location.reload();  //some browsers need RELOAD to show the new THEME [??]
    // changes the HREF attribute of the LINK with ID 'theme-stylesheet' based on the 'theme' COOKIE value
    return theme;
};  //end LOOMA.setTheme()

LOOMA.changeTheme = function(e) {  //theme change button has been pressed
    LOOMA.setStore('theme', encodeURIComponent(e.target.value), 'cookie');
    LOOMA.setTheme();  //change currently used theme
}; //end LOOMA.changeTheme()

LOOMA.alert = function(text, secs) { //show an 'alert' popup for x seconds, then dissolve
    // make a popup with the text, then setlimit(secs) to a callback that removes the popup
}; //end LOOMA.alert

// Function for setting the text of an element:
LOOMA.setText = function(id, message) {
        if ( (typeof id == 'string') &&
             (typeof message == 'string') )
        {
            // Get a reference to the element:
            var output = this.$(id);
            if (!output) return false;

            // Set the text
            if (output.textContent !== undefined) {
                output.textContent = message;
            } else {
                output.innerText = message;
            }
            return true;
        } // End of main IF.
    }; // End of setText() function.

// Function for creating event listeners:
LOOMA.addEvent= function(obj, type, fn) {
        if (obj && obj.addEventListener) { // W3C
            obj.addEventListener(type, fn, false);
        } else if (obj && obj.attachEvent) { // Older IE
            obj.attachEvent('on' + type, fn);
        }
    }; // End of addEvent() function.

// Function for removing event listeners:
LOOMA.removeEvent = function(obj, type, fn) {
        if (obj && obj.removeEventListener) { // W3C
            obj.removeEventListener(type, fn, false);
        } else if (obj && obj.detachEvent) { // Older IE
            obj.detachEvent('on' + type, fn);
        }
    }; // End of removeEvent() function.

LOOMA.addErrorMessage = function(id, msg) {
    // Get the form element reference:
    var elem = document.getElementById(id);

    // Define the new span's ID value:
    var newId = id + 'Error';

    // Check for the existence of the span:
    var span = document.getElementById(newId);
    if (span) {
        span.firstChild.value = msg; // Update
    } else { // Create new.

        // Create the span:
        span = document.createElement('span');
        span.id = newId;
    span.className = 'error';
        span.appendChild(document.createTextNode(msg));

        // Add the span to the parent:
        elem.parentNode.appendChild(span);

// PURSUE 2: allow the 'label' element to have multiple classes
        if (elem.previousSibling.className !== null)  //if there is an existing className then concat ' error'
        {elem.previousSibling.className += ' error';}
    else                      //else set className to 'error'
        {elem.previousSibling.className = 'error';}

    } // End of main IF-ELSE.

}; // End of addErrorMessage() function.

// This function removes the error message.
// It takes one argument: the form element ID.
LOOMA.removeErrorMessage = function(id) {
    // Get a reference to the span:
    var span = document.getElementById(id + 'Error');
    if (span) {

        // Remove the class from the label:
//PURSUE 2: allow 'label' element to have multiple classes
        if (span.previousSibling.previousSibling.className == 'error') //if the only class is 'error
        {span.previousSibling.previousSibling.className = null;}  //the set class=null
        else
        {span.previousSibling.previousSibling.className =
           span.previousSibling.previousSibling.className.slice (0,-6);} //else slice off ' error' from className

        // Remove the span:
        span.parentNode.removeChild(span);

    } // End of IF.

}; // End of removeErrorMessage() function.

/* LOOMA.speak()
* Author: Akshay Srivatsan
* Date: Summer 2015
* Description: Put this function in your JavaScript file to use speech
*   synthesis, or just import this file from your HTML file.
* Requirements: pico2wave must be installed on the Looma or server that serves
*   this JS file. The speech synthesis PHP file must be at "/Looma/looma-speech.php".
*/
 LOOMA.speak = function(text) {
     if (speechSynthesis) { //careful with this - Looma may show existence of speechSynthesis but still not .speak()
         if (speechSynthesis.speaking)
             {
             if (speechSynthesis.paused)
                 speechSynthesis.resume();
             else speechSynthesis.pause();
             }
         else {
             var speech = new SpeechSynthesisUtterance(text);
             speechSynthesis.speak(speech);
         }
     }  else {
           new Audio('/Looma/looma-speech.php?text=' + encodeURIComponent(text)).play();
     }
}; //end speak()


