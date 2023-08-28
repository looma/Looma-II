/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: xxxxx.js
Description:
 */

'use strict';

/*
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
*/

$(document).ready (function() {
    
    $('#themes').change(function () {  // change theme when a theme button is clicked
        var newTheme = encodeURIComponent(this.value);
        LOOMA.changeTheme(newTheme);
        $(this).find('option#' + newTheme).attr('selected', true);
        //$(this).val(newTheme);
});
    
    $('.theme#' + LOOMA.readStore('theme', 'session-cookie')).attr('selected', true); //add checkmark on current theme

//new code to display a list of speechSynthesis voices
/*
                if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
                  speechSynthesis.onvoiceschanged = populateVoiceList;
                };
*/

    $('.gender').change(function() {
                        var newVoice = encodeURIComponent(this.value);
                        var engine = 'mimic';
                        LOOMA.changeVoice(newVoice); // change voice when voice button is clicked
                        LOOMA.speak('the voice has been changed', engine, newVoice);
                    });

    //$('.voice#' + LOOMA.readStore('voice', 'cookie')).attr('checked', 'checked'); //add checkmark on current voice
    
 
    console.log('reading cookie: ' + LOOMA.readStore('voice', 'cookie'));
    console.log('setting CHECKED on: ', '.voice#' + LOOMA.readStore('voice', 'cookie'));

    if (!LOOMA.loggedIn())  //not logged in
    {   $('#login-status').text('You are not logged in');
        $('.login').addClass('loggedIn').text('Login to use Teacher Tools').click( function(){ window.location = "looma-login.php";});

    }
    else //logged in
    {   var loginname = LOOMA.readStore('login', 'cookie');
        var loginlevel = LOOMA.readStore('login-level', 'cookie') || null;
        $('#login-status').text("You are logged in as '" + loginname + "'");
        $('.settings-control').css('display', 'inline');                       // show the teacher tools
        if (loginlevel === 'admin' || loginlevel === 'exec') $('.admin-control').css('display', 'inline');
        if (loginname == 'skip' || loginlevel === 'exec')    $('.exec-control').css('display', 'inline');

        $('.login').toggleClass('loggedIn').text('Logout').click
            ( function()
                {
                LOOMA.confirm('are you sure you want to log out?',
                    function(){window.location = "looma-logout.php";},
                    function(){}, false);
                }
            );
    
        $('#updatecode').click(function() {
            LOOMA.confirm('This will update the Looma code then reboot the system',
                function() {window.location = "looma-update.php?cmd='code'";},
                function(){return false;}
            );
        });
        
        $('#update').click(function() {window.location = "looma-update.php";});
        
        $('.change-password').toggleClass('loggedIn').text('Change Password').click
        ( function() {window.location = "looma-change-password.php";}
        );
    }

}); //end of document.ready anonymous function
