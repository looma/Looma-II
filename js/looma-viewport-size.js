'use strict';
$(document).ready( function () {
 
    function redraw() {
        $("#width").text(window.innerWidth);
        $("#height").text(window.innerHeight);
    }
    
    window.addEventListener('resize', redraw);
    redraw();
});

