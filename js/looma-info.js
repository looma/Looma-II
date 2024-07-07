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

$(document).ready(function () {
    
    toolbar_button_activate("info");
    
    $('#log-viewer').click(function(event){window.open('activity',"_self");});
    $('#system_info').click(function(event){ $('#advanced_info').toggle();});
    
    //  the attribution logos on looma-info page are live links to websites
    //  check if online before following these links to avoid 404 or network timeout
    $('a').click(function(event){
            if (navigator.onLine) {
                var target = event.currentTarget.href;
                window.open(target,'popup','width=540, height=400, top=200, left=270');
            }
    
        event.preventDefault();
        });
        
        //using jquery.easy-ticker.js
        $('#credits').easyTicker({
            direction: 'up',
            easing: 'swing',
            speed: '2500',
            interval: 500,
            height: '',
            visible: 0,
            mousePause: 1,
            controls: {
                up: '',
                down: '',
                toggle: '',
                playText: 'Play',
                stopText: 'Stop'
            }
        })});
  //      });function roll()
     
     //   {
     //   $('#credits-wrapper').css('top', '');
     //   $('#credits-wrapper').animate({top:"-1800%"}, 45000, roll);

        // with 210 names, ' top:"-1800%" ' works
        // perhaps K = -1800/210 = -9 is the right coefficient. e.g. ' top:"' + -9*count + '%" '
        //
        // NOTES on adjusting the CREDITS BOX:
        // ~30 names show in the 'credit-box'
        // adjust 'top:"-xxx%"}' when adding more names
        // when there are 195 names, "animate({top:"-600%"}" is just right)
        //
        //adjust [time= nnnnn] to go faster or slower
        // the time of 30 sec (30000) is pretty fast speed
        // time = 45000 (45 sec) is about right, time = 60000 (60secs) is too slow
        // may want to go faster if we have lots more names
     //};

    //roll();
 

