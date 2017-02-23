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

    var audio, video, media, $play;

    function playVideo(vid)
    { vid.play();
        //playButton.style.backgroundImage = 'url("images/pause.png")';
    };  //end playVideo()

    function pauseVideo(vid)
    { vid.pause();
        //playButton.style.backgroundImage = 'url("images/video.png")';
    }; //end pauseVideo()



function attachMediaControls () {

          // media
          audio = document.getElementById("audio");
          video = document.getElementById("video");

          media = (audio)?audio:video;

          // Buttons
          $play = $('.play-pause');
          var $mute = $('.mute');
          var $seekbar = $('.seek-bar');
          var $volumebar = $('.volume-bar');
          var $time = $('#time');  $time.text('0:00');

          //var playButton = document.getElementById("play-pause");
          //var muteButton = document.getElementById("mute");

          // Sliders
          //var seekBar = document.getElementById("seek-bar");
          //var volumeBar = document.getElementById("volume-bar");



        // Event listener for the play/pause button
        //playButton.addEventListener("click", function() {
        $play.on('click', function() {
          if (media.paused) {
              media.play();
              $play.attr('style', 'background-image: url("images/pause.png")');
              //playButton.innerHTML = "Pause";
          } else {
              media.pause();
              $play.attr('style', 'background-image: url("images/video.png")');
             //playButton.innerHTML = "Play";
          }
        });

        // Event listener for the mute button
        //muteButton.addEventListener("click", function() {
        $mute.on('click', function() {
          if (!media.muted) {
              media.muted = true;
              $mute.attr('style', 'background-image: url("images/audio.png")');
              //muteButton.innerHTML = "Unmute";
          } else {
              media.muted = false;
              $mute.attr('style', 'background-image: url("images/mute.png")');
            //muteButton.innerHTML = "Mute";
          }
        });

        // Event listener for the volume bar
        $volumebar.on("change", function() {
          // Update the media volume
          media.volume = $volumebar.attr('value');
        });

        // Event listener for the seek bar
        //seekBar.addEventListener("change", function() {
        $seekbar.on('change', function() {         // Calculate the new time
          var time = media.duration * ($seekbar.val() / 100);
          media.currentTime = time;
        });

        // Update the seek bar as the media plays
        if (media) media.addEventListener("timeupdate", function() {
          // Calculate the slider value
          var value = (100 / media.duration) * media.currentTime;
          // Update the slider value
          $seekbar.val(value);

          $time.text(minuteSecondTime(media.currentTime));
        });

        // Pause the media when the slider handle is being dragged
        $seekbar.on("mousedown", function() {
          media.pause();
        });

        // Play the media when the slider handle is dropped
        $seekbar.on("mouseup", function() {
          media.play();
        });

        function minuteSecondTime (time)
        {
            //Converts all time to minutes:seconds
            var timeAsString = "" + time;
            var seconds = timeAsString.substring(0, timeAsString.indexOf("."));
            var minutes = Math.floor(Number(seconds) / 60);
            seconds = Number(seconds) % 60;
            if (seconds < 10)
            {
                seconds = "0" + seconds;
            }
            return minutes + ":" + seconds;
        };

    };

   function attachFullscreenPlayPauseControl() {

        $('#fullscreen-playpause').on('click', function() {
                if (video.paused)
                     { playVideo(video);
                       $(this).css('backgroundImage', 'url("images/pause.png")');
                }
                else { pauseVideo(video);
                       $(this).css('backgroundImage', 'url("images/video.png")');
                }
        });
    };


    function modifyFullscreenControl() {
        var videoArea = document.getElementById("video-area");

        var isFullscreen = false;

        $('#fullscreen-control').off('click').on('click', function (e) {
            e.preventDefault();

            var $fsppbutton = $('#fullscreen-playpause');

            if(!isFullscreen)
            {
                //If it is not fullscreen make it fullscreen
                screenfull.toggle(document.getElementById('fullscreen'));
                isFullscreen = true;
                $fsppbutton.css('display', 'block');

                    videoArea.className = "fulldisplay";
                    videoArea.style.width = "100%";


                if (video.paused == true)
                { $fsppbutton.css('backgroundImage', 'url("images/video.png")'); }
                else
                { $fsppbutton.css('backgroundImage', 'url("images/pause.png")'); }
            }
            else
            {
                //Otherwise un-fullscreen it
                screenfull.toggle(document.getElementById('fullscreen'));
                isFullscreen = false;
                $fsppbutton.css('display', 'none');

                if (media.paused) $play.attr('style', 'background-image: url("images/video.png")');
                else              $play.attr('style', 'background-image: url("images/pause.png")');

                videoArea.className = "";
            }
        });

         $('#video').on('loadeddata', function () {
            //Sets the video-area to the size of the video by finding the calculated width of the video
            var vidWidth = window.getComputedStyle(video).getPropertyValue("width");
            var videoArea = document.getElementById("video-area");
            videoArea.style.width = parseInt(vidWidth) + "px";

            var videoPlayer = document.getElementById("video-player");
            var titleArea = document.getElementById("title-area");

            //Makes the title area fill the space to the right of the video
            titleArea.style.width = ((videoPlayer.offsetWidth / 2) - (video.offsetWidth / 2)) + "px";
            titleArea.style.height = video.offsetHeight + "px";
        });

    };
