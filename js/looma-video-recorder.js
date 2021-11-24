// global variables
let uploadButton = document.getElementById("uploadButton");
//let recording = document.getElementById("uploadButton");
let logElement = document.getElementById("log");
let previewPane = document.getElementById('preview_pane');
var finalStream;

var recorder;
// set to timeout after 5  minutes
let recordingTimeMS = 300000;

//var displayMediaOptions = {video: {cursor: "always"}, audio: false};

function log(msg) { logElement.innerHTML += msg + "\n"; };

//set up timeout
function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

// grab available data and push it to blob
function record(stream, lengthInMS){
 // recorder = new MediaRecorder(stream, {mimeType: 'video/mp4'});
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
  
  return Promise.all([ stopped ]).then(() => data); //wait for all streams to stop, then return DATA array
} // end record()

// on click preview stream and set mediarecorder stream to camera
function start (){
  if (document.getElementById('SR').checked) {
  
      navigator.mediaDevices.getUserMedia({video: true, audio: true})
          //  getStreamForCamera()
      .then(streamCamera => {
        console.log('start: getusermedia succeeded');
      previewPane.srcObject = streamCamera;
      previewPane.captureStream = previewPane.captureStream || previewPane.mozCaptureStream;
  
        navigator.mediaDevices.getDisplayMedia({video: {cursor: "always"}, audio: false})
            //  getStreamForWindow()
        .then(streamWindow => {
          console.log('start: getdisplaymedia succeeded');
  
          // we now have access to the screen too
        // we generate a combined stream with the video from the
        // screen and the audio from the camera
        finalStream = new MediaStream();
        const videoTrack = streamWindow.getVideoTracks()[0];
        finalStream.addTrack(videoTrack);
        const audioTrack = streamCamera.getAudioTracks()[0];
        finalStream.addTrack(audioTrack);

        record(finalStream,recordingTimeMS).then (recordedChunks => {
          // package all blobs into our final url to upload
        let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
          //recording.src = URL.createObjectURL(recordedBlob);
          //uploadButton.href = recording.src;
          uploadButton.href = URL.createObjectURL(recordedBlob);
         
  
        var today= new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        var h=today.getHours();
        var m=today.getMinutes();
        var s=today.getSeconds();
        var now = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + m + ':' + s;

        uploadButton.download = "RecordedVideo"+now+".mp4";

        })
      });
    });
  } else {
    navigator.mediaDevices.getUserMedia({video: true, audio: true})
        .then(stream => {
    	// let user see webcam and direct button to stream we are recording
          console.log('start: getusermedia succeeded');
          previewPane.srcObject = stream;
          uploadButton.href = stream;
          previewPane.captureStream = previewPane.captureStream || previewPane.mozCaptureStream;
          return new Promise(resolve => previewPane.onplaying = resolve);
      // once we have stuff to record start the recording
    }).then(() => record(previewPane.captureStream(), recordingTimeMS))
    .then (recordedChunks => {
    	// package all blobs into our final url to upload
      let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
      //recording.src = URL.createObjectURL(recordedBlob);
      //uploadButton.href = recording.src;
      uploadButton.href = URL.createObjectURL(recordedBlob);
  
      var today= new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = today.getFullYear();
      var h=today.getHours();
      var m=today.getMinutes();
      var s=today.getSeconds();
      var now = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + m + ':' + s;

      uploadButton.download = "RecordedVideo"+now+".mp4";

     console.log("Successfully recorded " + recordedBlob.size + " bytes of " +
         recordedBlob.type + " media.");
    })
  }

  $('#start_button').off('click').text('Pause recording').click(pause);
}  // end start()

function pause() {
  $('#start_button').off('click').text('Continue recording').click(start);
  
} // end pause()

// stop the webcam stream tracks
function stop() {
  var stream = previewPane.srcObject;
  if(stream != null){
  	stream.getTracks().forEach(track => track.stop());
  }
  previewPane.srcObject = null;
  if(recorder!=null){
  	if(recorder.state!='inactive'){
      recorder.stop();
    }
  }
} // end stop()

// function to just preview the webcam
function preview(){
  
    //if(previewPane.srcObject) previewPane.srcObject = null;
    
	 vendorUrl = window.URL || window.webkitURL;
	if (navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true })
		.then(function (stream) {
          console.log('preview: getUserMedia succeeded');
          previewPane.srcObject = stream;
		}).catch(function (error) {
		  console.log('preview: getUserMedia failed');
          LOOMA.alert("Could not access video camera", 0, true);
		});
	}
} // end preview()


//  ask for permission to record the display
const getStreamForWindow = () =>
    navigator.mediaDevices.getDisplayMedia({video: {cursor: "always"}, audio: false});

//  ask for permission to record the audio and video from the camera
const getStreamForCamera = () =>
    navigator.mediaDevices.getUserMedia({video: true, audio: true});

$(document).ready(function() {
  
  $('#stop_button').click(stop);
  $('#preview_button').click(preview);
  $('#start_button').click(start);
  
  $(uploadButton).click(function(){
    LOOMA.makeTransparent($('#main-container-horizontal'));
    $('#uploadDialog').show();
  });
  
  stop();
  preview();
});