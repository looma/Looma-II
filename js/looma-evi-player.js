/*
Name: Skip, Aaron, Connor, Ryan
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 07, 2019 05
Revision: Looma Video Editor 3.0

Filename: looma-evi-player.js
Description: videoplayer controls for looma-evi-player.php
Attribution: slightly borrowed from Matt West (blog.teamtreehouse.com)
 */

'use strict';

// Arrays of Information for inserted elements in this EVI

var videoTimes = [];
var videoIds =   [];
var videoCollections = [];

var currentAddedVideo = null;
var playingAddedVideo = false;
var showingAddedFile = false;

var baseVideo, addedVideo;  //these are the two HTML 'video' elements
var baseVideoTime;          // stores the base video time so it can be restarted after viewing an added video

//DIVs use to display inserted elements
var baseVideoArea;
var pdfArea;
var textArea;
var imageArea
var addedVideoArea;

var index = 0;  // index points to the next inserted element in the EVI, from this currentTime

var frameID;    // the ID of the current requestAnimationFrame call, in case we want to cancel it
/*************************************************/
/************* define utility functions **********/
/*************************************************/

// Important Functions - Video
function playVideo(vid) {
    vid.play();
    $('.play-pause').css('backgroundImage','url("images/pause.png")');
}

function pauseVideo(vid) {
    vid.pause();
    $('.play-pause').css('backgroundImage','url("images/video.png")');
}

function toggleVideo(vid) {
    if (vid.paused === true) playVideo(vid);
    else                        pauseVideo(vid);
}  // end toggleVideo()

// Displaying inserted media - Overlays

function show_text() {
    $('.displayArea').hide();
    showingAddedFile = true;
    playingAddedVideo = false;
    //pauseVideo(baseVideo);
    $(textArea).show();
}

function show_image(src, alt) {
    $('.displayArea').hide();
    showingAddedFile = true;
    playingAddedVideo = false;
    //pauseVideo(baseVideo);
    $(imageArea).show();}

function show_pdf() {
    $('.displayArea').hide();
    showingAddedFile = true;
    playingAddedVideo = false;
    //pauseVideo(baseVideo);
    $(pdfArea).show();
}

function show_added_video() {
    $('.displayArea').hide();
    showingAddedFile = false;
    playingAddedVideo = true;
    baseVideoTime = baseVideo.currentTime;
    pauseVideo(baseVideo);
    //$('#show-base-video').show();
    $(addedVideoArea).show();
    frameID = window.requestAnimationFrame(checkTime);
    
    //attachMediaControls(addedVideo);
    media = addedVideo;
}

function show_base_video() {
    $('.displayArea').hide();
    showingAddedFile = false;
    playingAddedVideo = false;
    $(baseVideoArea).show();
    playVideo(baseVideo);
    //attachMediaControls(baseVideo);
    
    media = baseVideo;
}

window.onload = function () {
    
    // parameters for this Edited Video are passed in the page as
    //      a DIV with ID "args" that has data-commands, data-dn, data-vn, and data-vp set
    var commands =    $('#args').data('commands');  // list of embedded elements in the EVI
    var displayName = $('#args').data('dn');  // display name
    var vn =          $('#args').data('vn');  // base video filename
    var videoPath =   $('#args').data('vp');  // base video fp
    
    // Display title
    if (displayName != "null") { document.getElementById("title").innerHTML = displayName; }
    else {              document.getElementById("title").innerHTML = "New Edited Video"; }
    
	// Video
	baseVideo = document.getElementById("video");
    attachMediaControls(baseVideo);

    // Video Time Tracker
    var timeDiv = document.getElementsByClassName("time");
    timeDiv[0].innerHTML = "0:00";

	// Media Controls - play, mute, volume
	var mediaControls = document.getElementById("media-controls");
	var playButton = document.getElementById("video-playpause");
	var muteButton = document.getElementById("volume");
	var fullscreenPlayPauseButton = document.getElementById("fullscreen-playpause");
    var fullscreenControlButton = document.getElementById("fullscreen-control");
    // Media Controls - Sliders
	var seekBar =   document.getElementsByClassName("seek-bar")[0];
	var volumeBar = document.getElementsByClassName("volume-bar")[0];
    
    //video area
    baseVideoArea   = document.getElementById("video");
    // Overlay areas
    pdfArea        = document.getElementById("pdf-area");
    imageArea      = document.getElementById("picture-area");
    textArea       = document.getElementById("text-file-area");
    addedVideoArea = document.getElementById("added-video-area");
    
/*********************************************************/
/**************   execution starts here ******************/
/*********************************************************/

if (commands != null)
    {
        commands.forEach(function(element)
        {
            videoTimes.push(element.time)
            videoIds.push(element.id)
            videoCollections.push(element.collection)
        });
        
    modifyFullscreenControl();
    
    // Event listener for the PLAY button
    $play.off().on('click', function() {
		 if(playingAddedVideo) {
            // Play or Pause the Current Added Video
            toggleVideo(addedVideo);
            
         } else if (showingAddedFile) {
             show_base_video();
         } else {
            // Play or pause the video
            toggleVideo(baseVideo);
            frameID = window.requestAnimationFrame(checkTime);
         }
	});

	// Event listener for the MUTE button
	$mute.off().on("click", function () {
		if (media.muted == false) {
			// Mute the video
			media.muted = true;
			muteButton.style.backgroundImage = 'url("images/mute.png")';
		} else {
			// Unmute the video
			media.muted = false;
			muteButton.style.backgroundImage = 'url("images/audio.png")';
		}
	});
    
 
    
        // Event listener for the seek bar
        seekBar.addEventListener("change", function () {

        if (playingAddedVideo)
        {
            var time = currentAddedVideo.duration * (seekBar.value / 100);
            currentAddedVideo.currentTime = time;
            currentAddedVideo.pause();
        }
        else
        {
            // Remove All Overlays
            $('.displayArea').hide();

            // Calculate the new time
            var time = baseVideo.duration * (seekBar.value / 100);
            $(baseVideoArea).show();

            // Update the video time
            baseVideo.currentTime = time;
    
            pauseVideo(baseVideo);

            //update VAR INDEX to point to the next inserted item that will be encountered from this time
            var checking = true;
            var i = 0;
            while(checking == true) {
                if(i < videoTimes.length) {
                    if(time <= videoTimes[i]) {
                        index = i;
                        checking = false;
                    } else {
                        i++;
                    }
                } else {
                    checking = false;
                    i = videoTimes.length;
                }
            }
        }
            $('.play-pause').css('backgroundImage','url("images/video.png")');
    });

    // Update the seek bar as the video plays
        baseVideo.addEventListener("timeupdate", function () {
       
        // Calculate the slider value
        var value = (100 / baseVideo.duration) * baseVideo.currentTime;
        var didEditPast;
        
        // Update the slider value
        seekBar.value = value;

        timeDiv.innerHTML = minuteSecondTime(baseVideo.currentTime);

        // Check whether user went back in time
        if (videoTimes.length > 0)
        {
            if (baseVideo.currentTime < videoTimes[videoTimes.length - 1]) {
                didEditPast = true;
            } else {
                didEditPast = false;
            }
        }
    });

    // Pause the video when the slider handle is being dragged
    seekBar.addEventListener("mousedown", function () {
        if(playingAddedVideo) {
            currentAddedVideo.pause();
        } else {
            baseVideo.pause();
        }
    });

    // Play the video when the slider handle is dropped
    seekBar.addEventListener("mouseup", function () {
        if(playingAddedVideo) {
            playVideo(currentAddedVideo);
        } else {
            playVideo(baseVideo);
        }
    });

    // Event listener for the volume bar
    volumeBar.addEventListener("change", function () {
        // Update the video volume
        baseVideo.volume = volumeBar.value;
    });

    function checkTime() {
		if (videoTimes.length > 0 && index < videoTimes.length) {  //While there are still annotations in the video
		    
            if(parseFloat(videoTimes[index]) <= baseVideo.currentTime) {  // check if it is time for the next insertion
                if(videoCollections[index] == "activities") {
                    
                    pauseVideo(baseVideo);  // stop the base video
                    //window.cancelAnimationFrame(frameID);  // stop checking for inserted items every frame paint
                    
                    // get the details of the next insertion
                    $.post("looma-database-utilities.php",
                        {cmd: "openByID", collection: 'activities', id: videoIds[index]},
                        function(result) {
                            result = JSON.parse(result);
                            
                        //*********  TEXT  ************//
                            if (result.ft == "text") {
                                $.post("looma-database-utilities.php",
                                    {cmd: "openByID", collection: "text", id: result.mongoID.$id},
                                        function(newResult) {
                                            newResult = JSON.parse(newResult);
                                            $(textArea).empty().html(newResult.data);
                                            show_text();
                                        });
                            }  // end TEXT
                            
                        //*********  IMAGE  ************//
                            else if(result.ft == "image" || result.ft == "png" || result.ft == "jpg" || result.ft == "jpeg" || result.ft == "gif") {

                                var imagePath;
                                
                                if(result.fp) { imagePath = (result.fp + result.fn); }
                                else {          imagePath = "../content/pictures/" + result.fn; }
                                
                                var img = document.createElement("img");
                                img.src = imagePath;
                                img.alt = "Image not found";
                                //img.setAttribute("id", "image-overlay");
                                //currentImage = img;
                                //document.getElementById("picture-area").appendChild(img);
                                $(imageArea).empty().append(img);
                                show_image();
                            }  // end IMAGE
                            
                        //*********  PDF  ************//
                            else if (result.ft == "pdf") {

                                var pdfPath;
                                if(result.fp) {
                                    pdfPath = (result.fp + result.fn);
                                }
                                else {
                                    pdfPath = "../content/pdfs/" + result.fn;
                                }
                                var pdf = document.createElement("iframe");
                                pdf.src = pdfPath;
                                //currentPdf = pdf;
                                $(pdfArea).empty().append(pdf);
                                //Adds a pdf to pdfArea
                                show_pdf();
                            }  // end PDF
                            
                        //*********  inserted VIDEO  ************//
                            else if (result.ft == "video" || result.ft == "mov" || result.ft == "mp4" || result.ft == "mp5") {
                                
                                var addedVideoPath;
                                if(result.fp) {
                                    addedVideoPath = (result.fp + result.fn);
                                }
                                else {
                                    addedVideoPath = "../content/videos/" + result.fn;
                                }
                                
                                addedVideo = document.createElement("video");
                                addedVideo.src = addedVideoPath;
                                addedVideo.id = "addedVideoId";
                                currentAddedVideo = addedVideo;
                                playingAddedVideo = true;
                                $(addedVideoArea).empty()
                                                 .append(addedVideo)
                                                 .append($('<div id = "show-base-video"><button id="show-base-button">Back to base video</button></div>'));
                                
                                $('#show-base-button').click(function() {
                                    addedVideo.pause();
                                    baseVideo.currentTime = baseVideoTime;
                                    show_base_video();
                                });
                                
                                $('#addedVideoId').on("timeupdate", function() {
                                    var value = (100 / addedVideo.duration) * addedVideo.currentTime;  // Calculate the slider value
                                    $seekbar.val(value);   // Update the slider value
                                    $time.text(minuteSecondTime(addedVideo.currentTime));
                                });
                                
                                $('#addedVideoId').on('ended',function(){show_base_video();});
                                
                                media = addedVideo;
                                $time.text(minuteSecondTime(media.currentTime));
                                show_added_video();
                            
                                $('.play-pause').css('backgroundImage','url("images/video.png")');
                            }  // end VIDEO
                            //else  // inserted element is not in 'activities' collection
                                // call requestAnimationFrame again for the next frame
                                //frameID = window.requestAnimationFrame(checkTime);
                        });
                    }
                index++;  // start watching for the next inserted item
            }  // end of processing a new inserted element
        }
		
        // call requestAnimationFrame again for the next frame
        frameID = window.requestAnimationFrame(checkTime);
		
        if(playingAddedVideo) {
            if(currentAddedVideo.paused == false) {
                // Calculate the slider value
                var value = (100 / currentAddedVideo.duration) * currentAddedVideo.currentTime;
                // Update the slider value
                seekBar.value = value;
                timeDiv.innerHTML = minuteSecondTime(currentAddedVideo.currentTime);
            }
        }
        
   
  
	} //end checkTime()
}};
