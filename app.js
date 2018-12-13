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

});

function createRoom(player) {

    let r = new Room();
    console.log(r);
    r.player.push(player);
    rooms.push(r);
    console.log("Room created");
}

function searchRoom(player) {

    for (r in rooms) {
        if(rooms[r].player.length < rooms[r].MAX_NUMBER_PLAYER) {
            // insert the player in the room 
            rooms[r].player.push(player);
            console.log("Player added");
            return;
        }
    }

    createRoom(player);
}

// array with rooms created
let rooms = [];

// Room CLASS
function Room() {

    this.MAX_NUMBER_PLAYER = 5;
    this.player = [];
}

// Player CLASS
function Player(socket) {

    this.socket = socket;
    this.score = 0;
}
