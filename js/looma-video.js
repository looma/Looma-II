/*
Name: Skip, Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 1.0

filename: looma-video.js
Description: Can play an unedited video reroutes the user to looma-edited-video.php if
they want to edit a video
Attribution: slightly borrowed from Matt West (blog.teamtreehouse.com)
 */

'use strict';
$(document).ready(function () {
    // Title
    document.getElementById("title").innerHTML = fileName;
    
    // Video
	var video = document.getElementById("video");
    
    // Time Tracker
    var timeDiv = document.getElementById("time");
    timeDiv.innerHTML = "0:00";

	// Media Controls - play, mute, volume 
	var mediaControls = document.getElementById("media-controls");
	var playButton = document.getElementById("play-pause");
	var muteButton = document.getElementById("volume");
    
    // Sliders
	var seekBar = document.getElementById("seek-bar");
	var volumeBar = document.getElementById("volume-bar");
	
	// Make fullscreenPlayPauseButton invisible when not in fullscreen
    var fullscreenPlayPauseButton = document.getElementById("fullscreen-playpause");
	var fullscreenButton = document.getElementById("fullscreen-control");
    
    var editButton = document.getElementById("create-edit");
    var loginButton = document.getElementById("login");
    
    var videoArea = document.getElementById("video-area");
    
    var isFullscreen = false;
	$('#fullscreen-control').click(function (e) {
		e.preventDefault();
		if(!isFullscreen)
		{
            //If it is not fullscreen make it fullscreen
            e.preventDefault();
            screenfull.toggle(videoArea);
            isFullscreen = true;
            fullscreenPlayPauseButton.style.display = "block";
            videoArea.className = "fullscreen";
            videoArea.style.width = "100%";
            
            if (video.paused == true)
            {
                fullscreenPlayPauseButton.style.backgroundImage = 'url("images/video.png")';
            }
            else
            {
                fullscreenPlayPauseButton.style.backgroundImage = 'url("images/pause.png")';
            }
		}
		else
		{
            //Otherwise un-fullscreen it
            e.preventDefault();
            screenfull.toggle(videoArea);
            isFullscreen = false;
            fullscreenPlayPauseButton.style.display = "none";
            videoArea.className = "";
		}
	});
    
    function playVideo(vid)
    {
        vid.play();
        playButton.style.backgroundImage = 'url("images/pause.png")';    
    }
    function pauseVideo(vid)
    {
        vid.pause();
        playButton.style.backgroundImage = 'url("images/video.png")';
    }
    
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
    }
    
    video.addEventListener('loadeddata', function () {
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
    
    fullscreenPlayPauseButton.addEventListener("click", function() {
            if (video.paused == true) {
                // Play the video
                playVideo(video);

                // Update the button text to 'Pause'
                fullscreenPlayPauseButton.style.backgroundImage = 'url("images/pause.png")';

            } 
            else {
                // Pause the video
                pauseVideo(video);

                // Update the button text to 'Play'
                fullscreenPlayPauseButton.style.backgroundImage = 'url("images/video.png")';
            }
	});
    
    playButton.addEventListener("click", function () {
        if (video.paused == true) {
            // Play the video
            playVideo(video); 
        } 
        else {
            pauseVideo(video);
        }
	});

	// Event listener for the mute button
	muteButton.addEventListener("click", function () {
        if (video.muted == false) {
            // Mute the video
            video.muted = true;

            // Update the button text
            muteButton.style.backgroundImage = 'url("images/mute.png")';
        } 
        else {
            // Unmute the video
            video.muted = false;

            // Update the button text
            muteButton.style.backgroundImage = 'url("images/audio.png")';
        }
	});

	// Event listener for the seek bar
	seekBar.addEventListener("change", function () {
        // Calculate the new time
        var time = video.duration * (seekBar.value / 100);

        // Update the video time
        video.currentTime = time;

        playButton.style.backgroundImage = 'url("images/video.png")';
	});

	// Update the seek bar as the video plays
	video.addEventListener("timeupdate", function () {
        // Calculate the slider value
        var value = (100 / video.duration) * video.currentTime;
        
        // Update the slider value
        seekBar.value = value;
        
        timeDiv.innerHTML = minuteSecondTime(video.currentTime); 
	});
    
    seekBar.addEventListener("mousedown", function () {
		pauseVideo(video);
	});

	// Event listener for the volume bar
	volumeBar.addEventListener("change", function () {
		// Update the video volume
		video.volume = volumeBar.value;
	});
    
    
    loginButton.addEventListener("click", function() {
        if (loginButton.innerHTML == "Log Out") {
            loginButton.innerHTML = "Log In";
            editButton.style.display = "none";
            pauseVideo(video);
        }
        else {
            loginButton.innerHTML = "Log Out";
            editButton.style.display = "inline";
            pauseVideo(video);
        }
    });
    
    editButton.addEventListener("click", function () {
        // Call edited-video.php  
        window.location = 'looma-edited-video.php?fn=' + fileName +
			'&fp=' + filePath + '&txt=' + null + '&dn=' + "null";  
    });

});