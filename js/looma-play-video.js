/*
Name: Skip, Aaron, Connor, Ryan

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07, SEP 2024
Revision: Looma Video Editor 1.0

filename: looma-play-video.js
Description: Can play an unedited video
             reroutes the user to looma-edited-video.php if they want to edit a video
Attribution: slightly borrowed from Matt West (blog.teamtreehouse.com)
 */

'use strict';

//NOTE: fileName, filePath , displayName, and thumbPath are set with JS injected by the PHP

$(document).ready(function () {
    
    var video = document.getElementById("video");
    attachMediaControls(video);  //looma-media-controls.js adds eventlisteners to play/pause/volume/slider controls
    //attachFullscreenPlayPauseControl();
    modifyFullscreenControl();
    $('#fullscreen-playpause').show();
    
    
});
