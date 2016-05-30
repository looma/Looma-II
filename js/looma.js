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

$(document).ready (function() {

    //turn off any speech when user leaves the page
    if (speechSynthesis) {$(window).unload(function(){speechSynthesis.cancel();});}

    var language;
    // for translation: on every page load, check localStore['language'] for language to be used
    // if stored value doesnt exist, create a stored value with language='english'
    // then use the value to set KEYWORDs and TOOLTIPs on the page to 'english' [default]
    // or 'native' [change class="english-keyword" to hidden and class="native-keyword" to visible]

    language = LOOMA.readStore('language', 'local');
    if (!language) {document.cookie = 'language=english'; language = 'english';}

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

/*    $('.screensize').text('(Screen  ' + screen.width + ' x ' + screen.height + ')  ');
*/
    $('.screensize').text('Window size = ' + window.outerWidth + ' x ' + window.outerHeight);
    $('.bodysize').text('HTML body size = ' + $('body').outerWidth() + ' x ' + $('body').outerHeight());

    /*    function toggleFullScreen() { //borrowed from developer.moz.org
              if (!document.fullscreenElement &&    // alternative standard method
                  !document.mozFullScreenElement &&
                  !document.webkitFullscreenElement &&
                  !document.msFullscreenElement ) {  // current working methods
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                  document.documentElement.msRequestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                  document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                  document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
              } else { //the is currrently a fullscreen element
                if (document.exitFullscreen) {
                  document.exitFullscreen();
                } else if (document.msExitFullscreen) {
                  document.msExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                  document.webkitExitFullscreen();
                }
              }
            }; //end toggleFullScreen()
    */
    /* activate fullscreen button if present */
/*    var fullScreenButton = document.getElementById("fullscreen-control");

    if (fullScreenButton) {  // add event listener for the fullscreen button
        var fullScreenElement = document.getElementById("fullscreen");
        fullScreenButton.addEventListener("click", function(e){e.preventDefault();toggleFullScreen();});
        };
*/
/*    document.getElementById("fullscreen").addEventListener("fullScreenChange", function(){
        alert('FS change');});
    document.getElementById("fullscreen").addEventListener("fullScreenError", function(){
        alert('FS error');});
*/
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

}); //end of document.ready anonymous function
