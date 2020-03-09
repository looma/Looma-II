/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-audio.js
Description: adds media controls to looma-audio.php
 */

'use strict';
$(document).ready(function() {
    var audio = document.getElementById("audio");
    attachMediaControls(audio);  //looma-media-controls.js adds eventlisteners to play/pause/volume/slider controls
});
