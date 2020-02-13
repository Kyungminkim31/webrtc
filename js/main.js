'use strict';

const mediaSource = new MediaSource();
mediaSource.addEventListener('source', handleSourceOpen, false);
let recordedBlobs;
let mediaRecorder;
let sourceBuffer;

let tmpPicture, tmpContext;
let preRollPictures;
let postPickingPictures;

const MAX_LIMIT = 5;

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var recordedVideo = document.getElementById('recordedVideo');
var recordBtn = document.getElementById('recordBtn');
var sendBtn = document.getElementById('sendBtn');
var playBtn = document.getElementById('playBtn');
var snapBtn = document.getElementById('snapBtn');
var uploadBtn = document.getElementById('uploadBtn');
var dataChannelSend = document.querySelector('input#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var statusContainer = document.getElementById('statusSpan');
var pickingBtn = document.getElementById('pickingBtn');
var scrollDiv = document.getElementById('scrollCanvas');

var receiveChannel;
var sendChannel;

var photo = document.getElementById('photo');
var photoContext = photo.getContext('2d');

var photoContextW;
var photoContextH;

var pcConfig = {
  'iceServers': [{
	'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

//////////////////////////////////////////////////
// Event 처리
//////////////////////////////////////////////////
playBtn.addEventListener('click', () => {
  console.log('Play button is clicked...');
  const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.style.visibility = 'visible';
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
  playBtn.disabled = true;
});

sendBtn.addEventListener('click', ()=>{
  var data = dataChannelSend.value;
  try{
	sendChannel.send(data);
	dataChannelReceive.value += data +'\n';
  } catch(err){
	console.log('Something is going to be wrong...' + err.name);
  }
	trace('sent data : '+data);
	dataChannelSend.value ='';
});

snapBtn.addEventListener('click', ()=>{
  photoContext.drawImage(remoteVideo, 0, 0, photo.width, photo.height);
  uploadBtn.disabled = false;
  photo.style.visibility = "visible"; 
  trace('draw image on canvas...');  
});

// upload event handler
var xhr;
uploadBtn.addEventListener('click', ()=>{
  trace('uploadSnampshot...');
  var dataURL = photo.toDataURL('image/jpeg');
  document.getElementById('userid').value = '1202';
  document.getElementById('imagefile').value = dataURL;
  
  var fd = new FormData(document.forms["uploadForm"]);

  // do some Ajax...
  xhr = new XMLHttpRequest();
  xhr.onreadystatechange = viewMessage;
  xhr.open('POST', 'http://node.visionconnect.co.kr:4000/uploadx', true);

  xhr.upload.onprogress = function(e) {
	if(e.lengthComputable){
	  var percentComplete = (e.loaded/e.total) * 100;
	  trace(percentComplete + '% upload');
	}
  };

  xhr.onload = function(){};

  xhr.send(fd);
});
recordBtn.addEventListener('click', beginRecording);
stopBtn.addEventListener('click', stopRecording);

sendBtn.disabled = true;
snapBtn.disabled = true;
uploadBtn.disabled = true;
dataChannelSend.disabled = true;
stopBtn.disabled = true;
playBtn.disabled = true;
recordBtn.disabled = false;


/////////////////////////////////////
// setting functions 
/////////////////////////////////////

var takePicture = function (mode, sourceVideo, destArray){

  console.log('picture mode : ', mode);

  tmpPicture = document.createElement('canvas');
  tmpContext = tmpPicture.getContext('2d');

  tmpPicture.width = tmpContext.width = sourceVideo.videoWidth;
  tmpPicture.height = tmpContext.height = sourceVideo.videoHeight;

  tmpContext.drawImage(sourceVideo, 0, 0, tmpPicture.width, tmpPicture.height);

  if(destArray.length === MAX_LIMIT){
    destArray.shift();
  }
  destArray.push(tmpPicture);

}

// 픽업 이벤트 후 5개의 스냅샷을 유지한다.
function snapPickingPictures(){

  tmpPicture = document.createElement('canvas');
  tmpContext = tmpPicture.getContext('2d');

  tmpPicture.width = tmpContext.width = localVideo.videoWidth;
  tmpPicture.height = tmpContext.height = localVideo.videoHeight;

  tmpContext.drawImage(localVideo, 0, 0, tmpPicture.width, tmpPicture.height);

  if(postPickingPictures.length === MAX_LIMIT) {
    postPickingPictures.shift();
  }
  postPickingPictures.push(tmpPicture);

}

// 픽업 이벤트 발생전까지 5개의 스냅샵을 유지한다.
function takePreRollPictures() {
  tmpPicture = document.createElement('canvas');
  tmpContext = tmpPicture.getContext('2d');

  tmpPicture.width = tmpContext.width = localVideo.videoWidth;
  tmpPicture.height = tmpContext.width = localVideo.videoHeight;

  // tmpPicture.width = tmpContext.width = remoteVideo.videoWidth;
  // tmpPicture.height = tmpContext.width = remoteVideo.videoHeight;

  tmpContext.drawImage(localVideo, 0, 0, tmpPicture.width, tmpPicture.height);
  // tmpContext.drawImage(remoteVideo, 0, 0, tmpPicture.width, tmpPicture.height);

  if(preRollPictures.length === MAX_LIMIT){
	preRollPictures.shift();
  }
  preRollPictures.push(tmpPicture);
}

// 지정된 사이즈 만큼의 Snapshot을 만들어 낸다.
function drawPhotos(sourceArray){
    console.log('Clearing previous elements...');
    while(scrollDiv.firstChild){
        scrollDiv.removeChild(scrollDiv.firstChild);
    } 
    console.log('Drawing current elements...');
    for(var i = 0; i < sourceArray.length;i++){
        sourceArray[i].style.visibility = 'visible';
        sourceArray[i].style.width ="120px";
        sourceArray[i].style.height ="auto";
        sourceArray[i].style.padding ="5px";
        sourceArray[i].style.display ="inline-block";
        scrollDiv.style.border = "1px solid #ccc";
        scrollDiv.style.overflow = "auto";
        scrollDiv.style.whiteSpace = "nowrap";
        scrollDiv.appendChild(sourceArray[i]);
    }
}

function drawResult(){
    console.log('Drawing current elements...');
    for(var i = 0; i < postPickingPictures.length;i++){
        postPickingPictures[i].style.visibility = 'visible';
        postPickingPictures[i].style.width ="120px";
        postPickingPictures[i].style.height ="auto";
        postPickingPictures[i].style.padding ="5px";
        postPickingPictures[i].style.display ="inline-block";
        scrollDiv.style.border = "1px solid #ccc";
        scrollDiv.style.overflow = "auto";
        scrollDiv.style.whiteSpace = "nowrap";
        scrollDiv.appendChild(postPickingPictures[i]);
    }
}

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event){
  //console.log('handleDataAvailable', event);
  if(event.data && event.data.size > 0){
	recordedBlobs.push(event.data);
  }
}

function beginRecording(){
	preRollPictures = [];
  setInterval(takePreRollPictures, 1000);
  trace('>>>>> on Record <<<<<');
  stopBtn.disabled = false;
  playBtn.disabled = true;

  // stopBtn.style.visibility = 'visible';
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.style.visibility = 'hidden';

  recordedBlobs = [];

  let options = {mimeType: 'video/webm;codecs=vp9'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
  	console.error(`${options.mimeType} is not Supported`);
  	// errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
  	options = {mimeType: 'video/webm;codecs=vp8'};
  	if (!MediaRecorder.isTypeSupported(options.mimeType)) {
  	  console.error(`${options.mimeType} is not Supported`);
  	  // errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
  	  options = {mimeType: 'video/webm'};
  	  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
  		console.error(`${options.mimeType} is not Supported`);
  		// errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
  		options = {mimeType: ''};
  	  }
  	}
  }

  try {
  	// mediaRecorder = new MediaRecorder(remoteStream, options);
  	mediaRecorder = new MediaRecorder(localStream, options);
  } catch (e) {
	  console.error('Exception while creating MediaRecorder:', e);
	  // errorMsgElement.innerHTML = 'Exception while creating MediaRecorder:  ${JSON.stringify(e)}`;
	  return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  mediaRecorder.onstop = (event) => {
  	console.log('Recorder stopped:', event);
  	console.log('Recorded Blobs: ', recordedBlobs);
    console.log('preRollPictures [] : ',preRollPictures);
    
    drawPhotos(preRollPictures);
    postPickingPictures = [];
    setInterval(snapPickingPictures, 1000);
    setTimeout(clearInterval, 5100);
    setTimeout(drawResult, 6000);
  };

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10);
  console.log('MediaRecorder started', mediaRecorder);
}


function stopRecording(){
  clearInterval();
  console.log('<<<< Stop recording >>>>');
  stopBtn.disabled = true;
  playBtn.disabled = false;
  mediaRecorder.stop();
}

function snapPhoto(){
  photoContext.drawImage(remoteVideo, 0, 0, photo.width, photo.height);
  uploadBtn.disabled = false;
  photo.style.visibility = "visible"; 
  trace('draw image on canvas...');
}

function viewMessage(){
  if(xhr.readyState==4){
	if(xhr.status===200){
	  var responseObj = JSON.parse(xhr.response);
	  if(responseObj.value === "1"){
		photo.style.visibility = "hidden"; 
		// 'uploading is sucess'
		alert('Uploading is sucess.');
	  }
	}
  }
}

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

socket.on('answer', function(message){
	console.log('Answer from Android', message);
});

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
	maybeStart();
  } else if (message.type === 'offer') {
	if (!isInitiator && !isStarted) {
	  maybeStart();
	}
	pc.setRemoteDescription(new RTCSessionDescription(message));
	doAnswer();
  } else if (message.type === 'answer' && isStarted) {
	pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
	var candidate = new RTCIceCandidate({
	  sdpMLineIndex: message.label,
	  candidate: message.candidate
	});
	pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
	handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
	maybeStart();
  }
}

var constraints = {
  video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
	'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
	console.log('>>>>>> creating peer connection');
	createPeerConnection();
	pc.addStream(localStream);
	isStarted = true;
	sendBtn.disabled = false;
	snapBtn.disabled = false;
	recordBtn.disabled = false;
	dataChannelSend.disabled = false;
	console.log('isInitiator', isInitiator);
	if (isInitiator) {
	  doCall();
	}
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////
//      Initialization and Event about DataChannel     //
/////////////////////////////////////////////////////////
function initDataChannel(){
	// 클라이언트로부터 전송해오는 DataChannel 콜백함수를 지정한다.
	sendChannel = pc.createDataChannel('sendDataChannel', null);
	console.log('Created send data channel');
	
	//전송을 위한 DataChannel의 콜백 지정
	sendChannel.onopen = onSendChannelStateChange;
	sendChannel.onclose = onSendChannelStateChange;
	console.log('set callback function for sendChannel');

	// 수신을 위한 DataChannel의 콜백 지정
	pc.ondatachannel = receiveChannelCallback;
	console.log('set callback function for receiveChannelCallback');
}


function createPeerConnection() {
  try {
	pc = new RTCPeerConnection(null);
	pc.onicecandidate = handleIceCandidate;
	pc.onaddstream = handleRemoteStreamAdded;
	pc.onremovestream = handleRemoteStreamRemoved;

	initDataChannel();
	
	console.log('Created RTCPeerConnnection');

  } catch (e) {
	console.log('Failed to create PeerConnection, exception: ' + e.message);
	alert('Cannot create RTCPeerConnection object.');
	return;
  }
}

function onSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  if (readyState === 'open') {
	console.log('readyState is open');
  } else {
	console.log('readyState is close');
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
	sendMessage({
	  type: 'candidate',
	  label: event.candidate.sdpMLineIndex,
	  id: event.candidate.sdpMid,
	  candidate: event.candidate.candidate
	});
  } else {
	console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
	setLocalAndSendMessage,
	onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
	if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
	  turnExists = true;
	  turnReady = true;
	  break;
	}
  }
  if (!turnExists) {
	console.log('Getting TURN server from ', turnURL);
	// No TURN server. Get one from computeengineondemand.appspot.com:
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
	  if (xhr.readyState === 4 && xhr.status === 200) {
		var turnServer = JSON.parse(xhr.responseText);
		console.log('Got TURN server: ', turnServer);
		pcConfig.iceServers.push({
		  'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
		  'credential': turnServer.password
		});
		turnReady = true;
	  }
	};
	xhr.open('GET', turnURL, true);
	xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
  // 스냅샵을 위한 비디오 전처리
  remoteVideo.onloadedmetadata = function(){
	photo.width = photoContextW = remoteVideo.videoWidth;
	photo.height = photoContextH = remoteVideo.videoHeight;
	trace('got remoteStream with width and height : ', photoContextW, photoContextH);
  }
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}

function receiveChannelCallback(event) {
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace('Received Message : '+ event.data );
  dataChannelReceive.value += event.data+'\n';
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace('Receive channel state is: ' + readyState);
}

///////////////////////////////////////////////////////
// Function for Logging
///////////////////////////////////////////////////////
function trace(text) {
  if (text[text.length - 1] === '\n') {
	text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
	var now = (window.performance.now() / 1000).toFixed(3);
	var d = new Date()
			, yy = d.getFullYear()
			, mm = leadingZeros(d.getMonth(),2)
			, dd = leadingZeros(d.getDate(),2)
			, h = d.getHours()
			, m = d.getMinutes()
			, s = leadingZeros(d.getSeconds(),2)
			, ms = leadingZeros(d.getMilliseconds(),3);
	var time = yy+'-'+mm+'-'+dd+' '+'['+h + ':' + m +':' + s + '.' + ms +']';
	console.log(time + ' - ' + text);
  } else {
	console.log(text);
  }
}

function leadingZeros(n, digits) {
  var zero = '';
  n = n.toString();

  if (n.length < digits) {
	for (var i = 0; i < digits - n.length; i++)
	  zero += '0';
  }
  return zero + n;
}
