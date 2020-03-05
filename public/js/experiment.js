// 'use strict';

// var offerOptions = {
//   offerToReceiveVideo: 1,
// };

// var pcConfig = {
// 	'iceServers': [{
// 		'urls': 'stun:stun.l.google.com:19302'
// 	}]
// };

// var sdpConstraints = {
// 	offerToReceiveAudio: true,
// 	offerToReceiveVideo: true
// };

// let localStream;
// let remoteStream0;
// let remoteStream1;

// let localPc = null;
// let remotePc0 = null;
// let remotePc1 = null;

// var localVideo = document.getElementById('localVideo');

// var rvMap = new Map();  // remote video map
// rvMap.set('rv0', document.getElementById('remoteVideo0'));
// rvMap.set('rv1', document.getElementById('remoteVideo1'));

// var connectBtn = document.getElementById('connectBtn');

// connectBtn.addEventListener('click', ()=>{

//   localPc = new RTCPeerConnection(null);

//   localPc.addEventListener('icecandidate', handleConnection);
//   localPc.addEventListener('iceconnectionstatechange', handleConnectionChange);

//   localPc.addStream(localStream);
//   remotePc1 = new RTCPeerConnection(null);

//   remotePc1.addEventListener('icecandidate', handleConnection);
//   remotePc1.addEventListener('iceconnectionstatechange', handleConnectionChange);
//   remotePc1.addEventListener('addstream', gotRemoteMediaStream);

//   localPc.createOffer(offerOptions)
//     .then(createdOffer1).catch(setSessionDescriptionError);

// });

// navigator.mediaDevices.getUserMedia({
//   audio: false,
//   video: {width:640, height: 480}
// }).then(
//   (s)=>{
//     console.log('adding local stream');
//     localStream = s;
//     localVideo.srcObject = s;
//     onCalling();
//   },
//   (e)=>{
//     alert('error while getting media stream');
//   }
// );

// function onCalling(){
//   // call
//   const videoTracks = localStream.getVideoTracks();
//   const audioTracks = localStream.getAudioTracks();

//   localPc = new RTCPeerConnection(null);

//   localPc.addEventListener('icecandidate', handleConnection);
//   localPc.addEventListener('iceconnectionstatechange', handleConnectionChange);

//   remotePc0 = new RTCPeerConnection(null);

//   remotePc0.addEventListener('icecandidate', handleConnection);
//   remotePc0.addEventListener('iceconnectionstatechange', handleConnectionChange);
//   remotePc0.addEventListener('addstream', gotRemoteMediaStream);

//   localPc.addStream(localStream);

//   localPc.createOffer(offerOptions)
//     .then(createdOffer).catch(setSessionDescriptionError);

// }

// function createdOffer1(description){
//   console.log('createdOffer1');
//   localPc.setLocalDescription(description)
//     .then(()=>{
//       console.log('localPc1!');
//       setLocalDescriptionSuccess(localPc);
//     }).catch(setSessionDescriptionError);

//   remotePc1.setRemoteDescription(description)
//     .then(()=>{
//       setRemoteDescriptionSuccess(remotePc1);
//     }).catch(setSessionDescriptionError);

//   remotePc1.createAnswer()
//     .then(createdAnswer1)
//     .catch(setSessionDescriptionError);
// }

// function createdAnswer1(description){
//   remotePc1.setLocalDescription(description)
//     .then(()=>{
//       setLocalDescriptionSuccess(remotePc1);
//     }).catch(setSessionDescriptionError);

//   console.log('localPeerConection setRemoteDescription starts.');
//   localPc.setRemoteDescription(description)
//     .then(()=>{
//       setRemoteDescriptionSuccess(localPc);
//     }).catch(setSessionDescriptionError);
// }

// function createdOffer(description){
//   console.log('createdOffer');
//   localPc.setLocalDescription(description)
//     .then(()=>{
//       console.log('localpc!');
//       setLocalDescriptionSuccess(localPc);
//     }).catch(setSessionDescriptionError);

//   remotePc0.setRemoteDescription(description)
//     .then(()=>{
//       setRemoteDescriptionSuccess(remotePc0);
//     }).catch(setSessionDescriptionError);

//   remotePc0.createAnswer()
//     .then(createdAnswer)
//     .catch(setSessionDescriptionError);

// }

// function createdAnswer(description){
//   remotePc0.setLocalDescription(description)
//     .then(()=>{
//       setLocalDescriptionSuccess(remotePc0);
//     }).catch(setSessionDescriptionError);

//   console.log('localPeerConection setRemoteDescription starts.');
//   localPc.setRemoteDescription(description)
//     .then(()=>{
//       setRemoteDescriptionSuccess(localPc);
//     }).catch(setSessionDescriptionError);
// }


// function setSessionDescriptionError(error){
//   console.log('Failed to create session description: ' + error.toString());
// }

// function setLocalDescriptionSuccess(peerConnection){
//   setDescriptionSuccess(peerConnection,'setLocalDescription');
// }

// function setRemoteDescriptionSuccess(peerConnection){
//   setDescriptionSuccess(peerConnection, 'setRemoteDescription');
// }

// function setDescriptionSuccess(peerConnection, functionName){
//   const peerName = (peerConnection===localPc) ? 'local': 'remotePc' ;
//   console.log(peerName, functionName, 'complete');
// }

// function gotRemoteMediaStream(event){
//   const pc = event.target;
//   const mediaStream = event.stream;
//   if(pc === remotePc0){
//     rvMap.get('rv0').srcObject = mediaStream;
//     remoteStream0 = mediaStream;
//     console.log('got remote stream 0th');
//   } else if ( pc === remotePc1){
//     rvMap.get('rv1').srcObject = mediaStream;
//     remoteStream1 = mediaStream;
//     console.log('got remote stream 1st');
//   }
// }

// function handleConnectionChange(event){
//   const peerConnection = event.target;
//   console.log('ICE state change event: ', event);
// }

// function handleConnection(event){
//   const peerConnection = event.target;
//   const iceCandidate = event.candidate;

//   if(iceCandidate){
//     const newIceCandidate = new RTCIceCandidate(iceCandidate);
//     const otherPeer = getOtherPeer(peerConnection);

//     otherPeer.addIceCandidate(newIceCandidate)
//       .then(()=>{
//         handleConnectionSuccess(peerConnection);
//       }).catch((error)=>{
//         handleConnectionFailure(peerConnection, error);
//       });

//     console.log('ICE candidate:\n'+event.candidate.candidate);
//   }
// }

// function handleConnectionSuccess(pc){
//   console.log( (pc===localPc)?'local':'remote', 'Conection Job is complete');
// }

// function handleConnectionFailure(pc){
//   console.log( (pc===localPc)?'local':'remote', 'fails');
// }

// function getOtherPeer(peerConnection){
//   if(peerConnection === localPc){
//     if(remotePc1===null){
//       console.log('remotePc0 is returned');
//       return remotePc0;
//     } else {
//       console.log('remotePc1 is returned');
//       return remotePc1;
//     }
//   } else {
//     console.log('localPc is returned');
//     return localPc;
//   }
// }

/////////// socketing ////////
var socket = io.connect();

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('createdRooms', function(roomNames){
  console.log('createdRooms : ' + roomNames);
  console.debug('roomNames : ' + roomNames.length);
});

socket.on('gotRoomsAvailableList', function(result){
  console.debug('result : ' + result);
});

var createRoomsBtn = document.getElementById('createRoomsBtn');
createRoomsBtn.addEventListener('click', function(){
  socket.emit('createRooms',10);
});

var getRoomsBtn = document.getElementById('getRoomsBtn');
getRoomsBtn.addEventListener('click', function(){
  socket.emit('getRoomsAvailableList');
})



