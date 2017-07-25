/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma.js
Description:
 */

'use strict';

    function restoreFullscreenControl () {
        $('#fullscreen-control').off('click').on('click', function (e) {
            e.preventDefault();
            //LOOMA.toggleFullscreen();
            screenfull.toggle(document.getElementById('fullscreen'));
    }); //end fullscreen
  };

$(document).ready (function() {

    // LOOMA fullscreen display
    // any page can include a button with ID 'fullscreen-control'
    // to allow the user to make the element with id="fullscreen" display in fullscreen
    // that page must include '<script src="js/looma-screenfull.js"></script>'

    restoreFullscreenControl();

    //turn off any speech when user leaves the page
    if (speechSynthesis) {$(window).on("unload", function(){speechSynthesis.cancel();});}

    // for translation: on every page load, check localStore['language'] for language to be used
    // if stored value doesnt exist, create a stored value with language='english'
    // then use the value to set KEYWORDs and TOOLTIPs on the page to 'english' [default]
    // or 'native' [change class="english-keyword" to hidden and class="native-keyword" to visible]
    var language;
    language = LOOMA.readStore('language', 'local');
    if (!language) {
        //document.cookie = 'language=english';  //BUG - must set in localstore, not in a cookie
        LOOMA.setStore('language', 'english', 'local');
        language = 'english';
    };

    LOOMA.translate(language);

    // when TRANSLATE button is clicked, change the language cookie setting
    // language cookies values are 'english' or 'native'
    // and re-translate KEYWORDS on the page
    $('#translate').click(function(){
            // toggle the language var ('english' <--> 'native')
            language = (LOOMA.readStore('language', 'local') == 'english' ? 'native' : 'english' );
            // reset the cookie to the new setting
            LOOMA.setStore('language', language, 'local');
            // change all the keywords on the page to the new setting
            LOOMA.translate(language);
    }); // end anonymous function for translate.click


    //NOTE: might be better to change the CLASS of #padlock, and use #padlock.classname in CSS to change the image src
    if (LOOMA.loggedIn()) $('#padlock').attr('src','images/padlock-open.png');
    else                  $('#padlock').attr('src','images/padlock-closed.png');

    $('#padlock').hover(
        function()
            { if (LOOMA.loggedIn()) $('#login-id').show(); },
        function()
            { $('#login-id').hide(); }
        );

    $('#padlock').click(function(){
        if (!LOOMA.loggedIn())
            {window.location = "looma-login.php";}
        else
            {LOOMA.confirm('are you sure you want to log out?',
                    function(){window.location = "looma-logout.php";},
                    function(){},
                    true);
            }
        });


    $('.screensize').text('Window size = ' + window.outerWidth + ' x ' + window.outerHeight);
    $('.bodysize').text('HTML body size = ' + $('body').outerWidth() + ' x ' + $('body').outerHeight());


    function updateClock() {
        var now = new Date(); // current date
        var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        var mins = now.getMinutes();
        mins = (mins < 10 ? '0' + mins : mins);
        var time = now.getHours() + ':' + mins;
        // a cleaner way than string concatenation
        var date = [now.getDate(),
                    months[now.getMonth()],
                    now.getFullYear()].join(' ');
        // set the content of the element to the formatted string
        $('#datetime').html( [date, time].join(' ') );

           // call this function again in 60*1000ms
        setTimeout(updateClock, 60000);
    } //end updateClock()

    var datetime = document.getElementById('datetime');

    if (datetime) updateClock(); // initial call

    //attach LOOMA.speak() to the '.speak' button
    //NOTE: this code is overwritten in looma-pdf.js because looma-pdf.php displays the PDF in an <iframe> so the current selection in in the iframe
    //NOTE: this code is also overwritten in looma-dictionary.js so that the entered word can be spoken w/o selecting
    //NOTE: this code is also overwritten in looma-clock.js so that the current time can be spoken w/o selecting
    //IMPROTANT NOT: be sure to call .OFF() to turn off this click handler before adding another
    //     e.g. use code like this:  $('button.speak').off('click').click(function(){....
    $('button.speak').click(function(){

        var toString = window.getSelection().toString();
        console.log ('selected text to speak: ', toString);
        LOOMA.speak(toString);
    });

    //attach LOOMA.lookup() to the '.lookup' button
    //NOTE: this code is overwritten in looma-pdf.js because looma-pdf.php displays the PDF in an <iframe> so the current selection in in the iframe
    $('button.lookup').click(function(){
        var toString = window.getSelection().toString();
        console.log ('selected text to lookup: "', toString, '"');
       // LOOMA.lookupWord(toString);
        LOOMA.popupDefinition(toString, 15);
    });
}); //end of document.ready anonymous function
