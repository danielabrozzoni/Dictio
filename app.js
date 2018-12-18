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
    
    socket.on('New room', function() {
        console.log('New Room')
        r = new Room();     
        player = new Player(socket, "Dany");
        r.join(player);
        console.log(r);
        socket.join(r.code);   
    });
    
});


// Player CLASS
function Player(socket, nick) {

    this.socket = socket; // forse togliere
    this.score = 0;
    this.nick = nick;
}

function Room() {

    this.players = [];
    this.code = createCode();
    this.MAX_NUMBER_PLAYER = 10;

    this.isFull = function () {
        if(this.players.length >= this.MAX_NUMBER_PLAYER)
            return true;
        return false;
    }

    this.join = function(player) {
        if(!this.isFull())
            this.players.push(player);
    }
}

function createCode() {
        
    var text = "";
    var possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
