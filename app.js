var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);

console.log("Server started.");

var io = require('socket.io')(serv);
io.sockets.on('connection', function(socket){

    console.log('Client Connected');
    player = new Player(socket);
    // search a not full room
    searchRoom(player);

    // create a room
    //createRoom();
});

function createRoom(player) {
    rooms.push(new Room()).player.push(player);
}

function searchRoom(player) {

    for (r in rooms) {
        if(r.player.length < r.MAX_NUMBER_PLAYER) {
            // insert the player in the room 
            r.player.push(player);
            return;
        }
    }

    createRoom(player);
}

// array with rooms created
let rooms = [];

// Room CLASS
function room() {

    const MAX_NUMBER_PLAYER = 5;

    let player = [];
}

// Player CLASS
function Player(_socket) {

    let socket = _socket;
    let score;
}
