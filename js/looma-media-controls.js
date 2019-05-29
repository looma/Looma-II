/*
LOOMA javascript file
Filename: looma-media-controls.js
Description: supports looma-video.php, looma.audio.php, looma-lesson-present.php, et

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Feb 17
Revision: Looma 2.4
 */

'use strict';

    var audio, video, media;
    var $play, $mute, $seekbar, $volumebar, $time;

function mediaPlayPause () { // play or pause the currently playing MEDIA - stored in global var media
    if (media.paused) {
        media.play();
        $('.play-pause').css('background-image', 'url("images/pause.png")');
    } else {
        media.pause();
        $('.play-pause').css('background-image', 'url("images/video.png")');
    }
}; //end mediaPlayPause()


function minuteSecondTime (time) {  // convert the [current media] time from seconds to mm:ss
    var timeAsString = "" + time;
    var seconds = timeAsString.substring(0, timeAsString.indexOf("."));
    var minutes = Math.floor(Number(seconds) / 60);
    seconds = Number(seconds) % 60;
    if (seconds < 10) seconds = "0" + seconds;
    return minutes + ":" + seconds;
}; // end minuteSecondTime()


function attachMediaControls (myMedia) {

          if(myMedia) {media = myMedia;}
          else {       audio = document.getElementById("audio");
                       video = document.getElementById("video");

                       media = (video)?video:audio;
          }

          // Buttons
          $play =    $('.play-pause');
          $mute =    $('.mute');
          $seekbar = $('.seek-bar');
          $volumebar = $('.volume-bar');
          $time =    $('.time');  $time.text('0:00');

        // Event listener for the play/pause button
        $play.off('click').on('click', mediaPlayPause);

        // Event listener for the mute button
        $mute.on('click', function() {
          if (!media.muted) {
              media.muted = true;
              $mute.attr('style', 'background-image: url("images/audio.png")');
          } else {
              media.muted = false;
              $mute.attr('style', 'background-image: url("images/mute.png")');
          }
        });

        // Event listener for the volume bar
        $volumebar.on('change', function() {
          media.volume = $volumebar.val(); // Update the media volume
        });

        // Event listener for the seek bar
        $seekbar.on('change', function() {         // Calculate the new time
          var time = media.duration * ($seekbar.val() / 100);
          media.currentTime = time;
        });

        // Update the seek bar as the media plays
        if (media) media.addEventListener("timeupdate", function() {
              var value = (100 / media.duration) * media.currentTime;  // Calculate the slider value
              $seekbar.val(value);   // Update the slider value

            $time.text(minuteSecondTime(media.currentTime));
        });

        // Pause the media when the slider handle is being dragged
        $seekbar.on("mousedown", function() { media.pause(); });

        // Play the media when the slider handle is dropped
        $seekbar.on("mouseup", function() { media.play(); });

}; // end attachMediaControls()

/*
   function attachFullscreenPlayPauseControl() {
        $('#fullscreen-playpause').on('click', mediaPlayPause);
   }; //end attachFullScreenPlayPause()
*/

    function modifyFullscreenControl() {
        var videoArea = document.getElementById("video-player");

        var isFullscreen = false;

        $('#fullscreen-control').off('click').on('click', function (e) {
            e.preventDefault();

            var $fsppbutton = $('#fullscreen-playpause');

            if(!isFullscreen)  { //If it is not fullscreen make it fullscreen
                LOOMA.toggleFullscreen();
                isFullscreen = true;
                $fsppbutton.css('display', 'block');
                
                videoArea.className = "fulldisplay";
            }
            else  {  //Otherwise un-fullscreen it
                LOOMA.toggleFullscreen();
                isFullscreen = false;
                $fsppbutton.css('display', 'none');
                videoArea.className = "";
            }
        });
    }; //end modifyFullscreenControl()


function modifyFullscreenAudio() {
    
    var isFullscreen = false;
    
    $('#fullscreen-control').off('click').on('click', function (e) {
        e.preventDefault();
        
        var $fsppbutton = $('#fullscreen-playpause');
        
        if(!isFullscreen) {
            //If it is not fullscreen make it fullscreen
            screenfull.toggle(document.getElementById('fullscreen'));
            isFullscreen = true;
            $fsppbutton.css('display', 'block');
        } else {
            //Otherwise un-fullscreen it
            screenfull.toggle(document.getElementById('fullscreen'));
            isFullscreen = false;
            $fsppbutton.css('display', 'none');
        }
    });
}; //end modifyFullscreenAudio()
