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

function populateVoiceList() {
  if(typeof speechSynthesis === 'undefined') { return; }

  var voices = speechSynthesis.getVoices();

  for(var  i = 0; i < voices.length ; i++) {
    var option = document.createElement('span');

    //   <span class="voicespan"><input type="radio" data-engine="mimic" class="voice" id="cmu_us_axb"  value="cmu_us_axb">   Indian female (axb) </span><br>
    option.innerHTML = voices[i].name + ' (' + voices[i].lang + ')';

    if(voices[i].default) {
      option.innerHTML += ' -- DEFAULT';
    }

    option.setAttribute('data-lang', voices[i].lang);
    option.setAttribute('data-name', voices[i].name);
    document.getElementById("synth-voices").appendChild(option);
  }
}


$(document).ready (function() {
    
    $('#themes').change(function () {  // change theme when a theme button is clicked
        var newTheme = encodeURIComponent(this.value);
        LOOMA.changeTheme(newTheme);
        //$(this).attr('selected', true);
});
    
    //$('.theme#' + LOOMA.readStore('theme', 'cookie')).attr('checked', 'checked'); //add checkmark on current theme

//new code to display a list of speechSynthesis voices
/*
                if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
                  speechSynthesis.onvoiceschanged = populateVoiceList;
                };
*/

    $('#voices').change(function() {
                        var newVoice = encodeURIComponent(this.value);
                        var engine = this.getAttribute('data-engine');
                        LOOMA.changeVoice(newVoice); // change voice when voice button is clicked
                        LOOMA.speak('the voice has been changed', engine, newVoice);
                    });

    //$('.voice#' + LOOMA.readStore('voice', 'cookie')).attr('checked', 'checked'); //add checkmark on current voice



    console.log('reading cookie: ' + LOOMA.readStore('voice', 'cookie'));
    console.log('setting CHECKED on: ', '.voice#' + LOOMA.readStore('voice', 'cookie'));

    if (!LOOMA.loggedIn())  //not logged in
    {   $('#login-status').text('You are not logged in');
        $('.login').addClass('loggedIn').text('Login').click( function(){ window.location = "looma-login.php";});

    }
    else //logged in
    {   var loginname = LOOMA.readStore('login', 'cookie');
        $('#login-status').text("You are logged in as '" + loginname + "'");
        $('.settings-control').css('display', 'inline');                       // show the teacher tools
        if (loginname == 'skip' || loginname === 'david') $('.admin-control').css('display', 'inline');;
        if (loginname == 'skip' ) $('.exec-control').css('display', 'inline');;

        $('.login').toggleClass('loggedIn').text('Logout').click
            ( function()
                {
                LOOMA.confirm('are you sure you want to log out?',
                    function(){window.location = "looma-logout.php";},
                    function(){}, true);
                }
            );

    }

}); //end of document.ready anonymous function
