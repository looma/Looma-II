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

var submit, input, output;

function lookupword(word) {

      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {

        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

          var response = JSON.parse(xmlhttp.responseText);

          output.innerHTML = response.def;
        }
      };

      xmlhttp.open("GET", "looma-dictionary-utilities.php?cmd=lookup&word=" + word, true);
      xmlhttp.send();
};

window.onload = function ()
    {
        submit = document.getElementById("submit");
        input = document.getElementById("input");
        output = document.getElementById("output");

        submit.addEventListener('click', function(){lookupword(input.value);});
    };

