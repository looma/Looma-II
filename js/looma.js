/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma.js
Description:
 */

'use strict';

/*  //removed use of screenfull.js JAN 2019 because it fails in Chrome rel 71
function restoreFullscreenControlOLD () {
    $('#fullscreen-control').off('click').on('click', function (e) {
        e.preventDefault();
        //LOOMA.toggleFullscreen();
        var fs =      document.getElementById('video-fullscreen');
        if (!fs) fs = document.getElementById('fullscreen');
        screenfull.toggle(fs);
    }); //end fullscreen
};
*/

var language;

function restoreFullscreenControl () {
    $('#fullscreen-control').off('click').on('click', function (e) {
        e.preventDefault();
        LOOMA.toggleFullscreen();
    }); //end fullscreen
}


$(document).ready (function() {
    
    window.top.scrollTo(0,1); // trying to remove toolbar on safari iPhone DOESNT WORK?
   // window.screen.orientation.lock('landscape'); // trying to force landscape orientation on iPhone DOESNT WORK?
    
    
    
        if (screen.orientation.type === 'portrait-primary'
           //&& (window.innerHeight > window.innerWidth)
        )
            LOOMA.alert('Looma should be viewed in Landscape mode. Please rotate your phone', 10, true);
    
    screen.orientation.addEventListener("change", function(e) {
        if (screen.orientation.type === 'portrait-primary')
            LOOMA.alert('Looma is best viewed in landscape mode. Please rotate your phone', 10, true);
        else LOOMA.closePopup();
    });
    
    
    
    //NOTE: experimental code to change color scheme for all Looma pages
    // not visible to users
   var main_color = LOOMA.readStore('main-color','local');
   var toolbar_color = LOOMA.readStore('toolbar-color','local');
    //document.documentElement.style.setProperty('--looma-background', main_color);
    //document.documentElement.style.setProperty('--looma-toolbar', toolbar_color);
    
    // LOOMA fullscreen display
    // any page can include a button with ID 'fullscreen-control'
    // to allow the user to make the element with id="fullscreen" display in fullscreen
    // that page must include:        <?php include ('includes/js-includes.php'); ?>

    restoreFullscreenControl();

    //turn off any speech when user leaves the page
    if (speechSynthesis) {$(window).on("unload", function(){speechSynthesis.cancel();});}

    // for translation: on every page load, check localStore['language'] for language to be used
    // if stored value doesnt exist, create a stored value with language='english'
    // then use the value to set KEYWORDs and TOOLTIPs on the page to 'english' [default]
    // or 'native' [change class="english-keyword" to hidden and class="native-keyword" to visible]
    //var language;
    language = LOOMA.readStore('language', 'cookie');
    if (!language) {
        LOOMA.setStore('language', 'english', 'cookie');
        language = 'english';
    }

    LOOMA.translate(language);

    // when TRANSLATE button is clicked, change the language localStore setting
    // language localStore values are 'english' or 'native'
    // and re-translate KEYWORDS on the page
    $('#translate').click(function(){
            // toggle the language var ('english' <--> 'native')
            language = (LOOMA.readStore('language', 'cookie') == 'english' ? 'native' : 'english' );
            // reset the cookie to the new setting
            LOOMA.setStore('language', language, 'cookie');
            // change all the keywords on the page to the new setting
            LOOMA.translate(language);
    }); // end anonymous function for translate.click


    //NOTE: might be better to change the CLASS of #padlock, and use #padlock.classname in CSS to change the image src
    if (LOOMA.loggedIn()) $('#padlock').attr('src','images/padlock-open.png');
    else                  $('#padlock').attr('src','images/padlock-closed.png');
    
/* replaced with class="tip show-yes"
    function showDn (displayName, location) { $('#dn').html( '<p>' + displayName + '</p>').appendTo(location).show(); };
    
    $('#main-container-horizontal').on('mouseenter', '.activity',
        function(e) { $(e.currentTarget).find('.display-name').show();}
    );
    
    $('#main-container-horizontal').on('mouseleave', '.activity',
        function(e) { $(e.currentTarget).find('.display-name').hide();}
    );
*/
    

    $('#padlock').hover(
        function() { if (LOOMA.loggedIn()) {$('#login-id').show(); } },
        function() {                        $('#login-id').hide();  }
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
    
    $('#dismiss').click(     function() { window.history.back();});  //override this in JS if needed
    $('.back-button').click( function() { if (parent.history.length > 0) parent.history.back(); else location.replace('looma-home.php')});

    $('.screensize').text('Window size = ' + Math.round(window.outerWidth) + ' x ' + Math.round(window.outerHeight));
    $('.bodysize').text('HTML body size = ' + Math.round($('body').outerWidth()) + ' x ' + Math.round($('body').outerHeight()));


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
    //NOTE: this code is overwritten in looma-html.js because looma-html.php displays the PDF in an <iframe> so the current selection in in the iframe
    //NOTE: this code is also overwritten in looma-dictionary.js so that the entered word can be spoken w/o selecting
    //NOTE: this code is also overwritten in looma-clock.js so that the current time can be spoken w/o selecting
    //NOTE: this code is also overwritten in looma-vocab-flashcard.js so that the current word or defin can be spoken w/o selecting
    //NOTE: this code is also overwritten in looma-sort-game.js so that the current word can be spoken w/o selecting
    //IMPORTANT NOT: be sure to call .OFF() to turn off this click handler before adding another
    //     e.g. use code like this:  $('button.speak').off('click').click(function(){....
    $('button.speak').click(function(){
        var toString = window.getSelection().toString();
    
        // speak the definition if a lookup popup is showing
        var $def = $('#definition');
        if ($def) toString += $def.text();
    
    
        console.log ('selected text to speak: ', toString);
        LOOMA.speak(toString);
    });

    //attach LOOMA.lookup() to the '.lookup' button
    //NOTE: this code is overwritten in looma-pdf.js because looma-pdf.php displays the PDF in an <iframe> so the current selection in in the iframe
    $('button.lookup').click(function(){
        var toString = window.getSelection().toString();
        console.log ('selected text to lookup: "', toString, '"');
       // LOOMA.lookupWord(toString);
        LOOMA.popupDefinition(toString.split(' ')[0], 15);
    });
    
/*
    //attach LOOMA.download() to the '.download' button
    
    // NOTE: this didnt work, at least on localhost
    //       using "<a href=filename download=targetfilename>"
    //       see looma.js at line
    
    
    $('button.download').click(function(){
        // name and path need to be set by the JS of the page with download button
        var name = 'Big_Bee.png';
        var path = '../content/pictures/';
        console.log ('selected file to download: "', path + name, '"');
        LOOMA.download(name, path);
    });
 */
 
 /* ////////////////////////////////////////////////////////////////////////
    try this to remove browser toolbar on smart phones [doesnt work yet 2023 07 27]
    
    window.onresize = function() {
        document.body.height = window.innerHeight;
    }
    window.onresize(); // called to initially set the height.
*/

}); //end of document.ready anonymous function
