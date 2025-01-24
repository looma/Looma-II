/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03, SEP 2024
Revision: Looma 7.x

filename: looma-play-audio.js
Description: adds media controls to looma-audio.php
 */

'use strict';
$(document).ready(function() {
    var audio = document.getElementById("audio");
    attachMediaControls(audio);  //looma-media-controls.js adds eventlisteners to play/pause/volume/slider controls
});
