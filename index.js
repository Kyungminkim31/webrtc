'use strict';

var express = require('express');
var http = require('http');
var socketIO = require('socket.io');
var nodeStatic = require('node-static');
var os = require('os');

var app = express();

var handlebars = require('express3-handlebars')
        .create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars')

var cors = require('cors');

var fileServer = new(nodeStatic.Server)();

app.use(cors());
app.use(express.static('public'));

app.set('port', process.env.PORT || 8886);

app.get('/webrtc', function(req, res){
  res.render('webrtc');
});

/////////////// start - Test Router ////////
app.get('/multiPeer', function(req,res){
  res.render('multiPeer');
});

app.get('/multiRooms', function(req,res){
  res.render('multiRooms');
});

/////////////// End - Test Router ////////

// custom 404 page
app.use(function(req, res){
  res.type('text/plain');
  res.status(404);
  res.send('404 - Not Found');
});

// custom 500 page
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('text/plain');
  res.status(500);
  res.send('500 - Server Error');
});

var server = app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' 
    + app.get('port') 
    + '; press Ctrl - C to terminate');
});

var io = socketIO.listen(server);
io.sockets.on('connection', function(socket) {
  console.log(socket.id + ' is connected.');
  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server : '];
    array.push.apply(array, arguments);
    socket.emit('log', array);
    console.log(arguments);
  }

  socket.on('message', function(message) {
    console.log(socket.id, 'Client said: ', message);
    socket.broadcast.emit('message', message);
  });

  socket.on('leave', function(room){
    console.log('socket id ' + socket.id + ' emits \'leave\'.');
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

    if(numClients >= 0){
      socket.leave(room);
      console.log('Client Id ' + socket.id + ' just left room ' + room);
      numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
      console.log('Room ' + room + ' now has ' + numClients + ' clients(s)');
    } else {
      console.error('No one is in room ' + room);
    }

  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  //////////////////////////////////////////////////////////
  // multiple room management experiment #01
  // author : Kyungmin Kim
  // date : 04 Mar. 2020
  //////////////////////////////////////////////////////////

  var roomNames = [];
  const ROOM_NAME_PREFIX = 'room';
  var currentRoomsArr = [];

  // create rooms for initiation
  socket.on('createRooms', function(roomCount){
    console.log(socket.id + ' send createRooms');
    
    // removing socket.id because of having only rooms
    Object.keys(io.sockets.adapter.rooms).forEach(element => {
      if(element !== socket.id){
        currentRoomsArr.push(element);
      }
    });  

    var tempRoomName;

    // 요청받은 숫자만큼 새로이 방을 만들고 만든 방에 대한 이름배열 값을 다시 클라이언트로 쏴준다.
    if(currentRoomsArr.length === 0) {
      for(var i = 0; i < roomCount; i++){
        tempRoomName = ROOM_NAME_PREFIX + i.toString().padStart(2,'0');
        roomNames.push(tempRoomName);
        socket.join(tempRoomName);
      }
      socket.emit('createdRooms',roomNames);
      currentRoomsArr = roomNames;
      console.log(io.sockets.adapter.rooms);

    } else {
      log('Client ID ' + socket.id + ' failed to create rooms');
      log('Server is having already plenty of rooms');
    }
  });

  // 입장 가능한 방리스트를 보여준다.
  socket.on('getRoomsAvailableList', function(){
    console.debug('get message getRoomsAvailableList');
    let clientsInRoom;
    let numClients;

    if(currentRoomsArr){
      currentRoomsArr.forEach(element =>{
        clientsInRoom = io.sockets.adapter.rooms[element];
        numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
      });

      socket.emit('gotRoomsAvailableList', currentRoomsArr); 
    } else {
      socket.emit('gotRoomsAvailableList', 0); 
    } 
  });
});