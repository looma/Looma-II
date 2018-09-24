/*
Name: Skip, Aaron, Connor, Ryan
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07
Revision: Looma Video Editor 1.0

filename: looma-video.js
Description: Can play an unedited video
             reroutes the user to looma-edited-video.php if they want to edit a video
Attribution: slightly borrowed from Matt West (blog.teamtreehouse.com)
 */

'use strict';

//NOTE: fileName, filePath , displayName, and thumbPath are set with JS injected by the PHP

   //var fullscreenPlayPauseButton;

/*
    function playVideo(vid)
    { vid.play();
        //playButton.style.backgroundImage = 'url("images/pause.png")';
    };

    function pauseVideo(vid)
    { vid.pause();
        //playButton.style.backgroundImage = 'url("images/video.png")';
    }
*/

$(document).ready(function () {

    attachMediaControls();  //looma-media-controls.js adds eventlisteners to play/pause/volume/slider controls
    //attachFullscreenPlayPauseControl();
    modifyFullscreenControl();
    //fullscreenPlayPauseButton = document.getElementById("fullscreen-playpause");

    // Video
	//var video = document.getElementById("video");

	//var fullscreenButton = document.getElementById("fullscreen-control");

    //var editButton = document.getElementById("edit");
    //var loginButton = document.getElementById("login");


});
