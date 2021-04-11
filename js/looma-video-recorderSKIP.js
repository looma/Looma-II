// global variables
'use strict';
var recorder;
// set to timeout after 5  minutes
let recordingTimeMS = 300000;


var displayMediaOptions = {
  video: {
    cursor: "always"
  },
  audio: false
};
 

function log(msg) {
  logElement.innerHTML += msg + "\n";
}

//set up timeout
function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

// grab available data and push it to blob
function record(stream, lengthInMS){
  recorder = new MediaRecorder(stream);
  let data = [];

  recorder.ondataavailable = event => data.push(event.data);
  recorder.start();
  //log(recorder.state + " for " + (lengthInMS/1000) + " seconds...");

  let recorded = wait(lengthInMS).then(
    () => recorder.state == "recording" && recorder.stop()
  );

  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = event => reject(event.name);
  });

  
  return Promise.all([
    stopped,
  ])
  .then(() => data);
}

// on click preview stream and set mediarecorder stream to camera
var start = function(){
  if (document.getElementById('SR').checked) {
    getStreamForCamera().then(streamCamera => {
      preview.srcObject = streamCamera;
      preview.captureStream = preview.captureStream || preview.mozCaptureStream;
      
      getStreamForWindow().then(streamWindow => {
        // we now have access to the screen too
        // we generate a combined stream with the video from the
        // screen and the audio from the camera
        var finalStream = new MediaStream();
        const videoTrack = streamWindow.getVideoTracks()[0];
        finalStream.addTrack(videoTrack);
        const audioTrack = streamCamera.getAudioTracks()[0];
        finalStream.addTrack(audioTrack);

        record(finalStream,recordingTimeMS).then (recordedChunks => {
          // package all blobs into our final url to download
        let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
        recording.src = URL.createObjectURL(recordedBlob);
        downloadButton.href = recording.src;

        var today= new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        var h=today.getHours();
        var m=today.getMinutes();
        var s=today.getSeconds();
        today = mm + '/' + dd + '/' + yyyy+'_'+h+':'+m+':'+s;

        downloadButton.download = "RecordedVideo"+today+".mp4";

        })
      });
    });
  } else {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
    	// let user see webcam and direct button to stream we are recording
      preview.srcObject = stream;
      downloadButton.href = stream;
      preview.captureStream = preview.captureStream || preview.mozCaptureStream;
      return new Promise(resolve => preview.onplaying = resolve);
      // once we have stuff to record start the recording
    }).then(() => record(preview.captureStream(), recordingTimeMS))
    .then (recordedChunks => {
    	// package all blobs into our final url to download
      let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
      recording.src = URL.createObjectURL(recordedBlob);
      downloadButton.href = recording.src;

      var today= new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = today.getFullYear();
      var h=today.getHours();
      var m=today.getMinutes();
      var s=today.getSeconds();
      today = mm + '/' + dd + '/' + yyyy+'_'+h+':'+m+':'+s;

      downloadButton.download = "RecordedVideo"+today+".mp4";

     // log("Successfully recorded " + recordedBlob.size + " bytes of " +
         // recordedBlob.type + " media.");
    })
  }
  //.catch(log);
}
// stop the webcam stream tracks
var stop = function() {
  var stream = preview.srcObject;
  if(stream != null){
  	stream.getTracks().forEach(track => track.stop());
  }
  preview.srcObject = null;
  if(recorder!=null){
  	if(recorder.state!='inactive'){
      recorder.stop();
    }
  }
}

// function to just preview the webcam
var previewing = function(){
	 vendorUrl = window.URL || window.webkitURL;
	if (navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({ audio:true, video:true })
		.then(function (stream) {
		  preview.srcObject = stream;
		}).catch(function (error) {
		  console.log("getUserMedia not available");
		});
	}
}


const getStreamForWindow = () => navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

// we ask for permission to record the audio and video from the camera
const getStreamForCamera = () => navigator.mediaDevices.getUserMedia({
   audio: true,
   video: true
});


$(document).ready(function() {

  var preview = $('#video1');
  
  $('#stop-recording').click(stop);
  $('#preview-recording').click(previewing);
  $('#start-recording').click(start);
  $('#save-recording').click(function(){});
  $('#screen-recording').click(function(){});

// start off by previewing
    previewing();
});