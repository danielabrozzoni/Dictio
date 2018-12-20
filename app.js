var express = require('express');
var app = express();
var serv = require('http').Server(app);

var rooms = [];

app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);

console.log("Server started.");

var io = require('socket.io')(serv);
io.sockets.on('connection', function(socket){

    socket.on('New room', function() {

        console.log('Client create new room...')
        r = new Room();
        r.handlePreparationTime();
        player = new Player(socket, "Dany");
        r.join(player);

        rooms.push(r);
        console.log(rooms);
        socket.join(r.code);

        socket.emit("Room created", {
            code : r.code,
            max_player: r.MAX_NUMBER_PLAYER
        });
    });

    socket.on('Join room', function(code) {
        console.log('Client join in room with code ' + code.code + '...');

        var player = new Player(socket, "Mokka");

        for(r in rooms) {

            console.log(code + " " + rooms[r].code);

            if(code.code == rooms[r].code) {

                if(rooms[r].join(player)) {

                    console.log(rooms[r]);
                    socket.join(rooms[r].code);

                    var counter =  {
                        counter : rooms[r].players.length,
                        max_player: rooms[r].MAX_NUMBER_PLAYER
                    }

                    socket.emit("Room joined", counter);
                    socket.to(rooms[r].code).emit("Players counter", counter);

                } else {

                    console.log("Room is full!");
                }

                return;
            }
        }

        console.log("Room doesn't exist");
    });

});


// Player CLASS
function Player(socket, nick) {

    this.socket = socket; // forse togliere
    this.score = 0;
    this.nick = nick;
}

function Room() {


    this.MAX_NUMBER_PLAYER = 5;
    this.PREPARATION_TIME = 30*1000;

    this.players = [];
    this.code = createCode();
    this.timer = this.PREPARATION_TIME;

    this.actualQuestion = 1;

    this.handlePreparationTime = function () {

        this.set = this.interval = setInterval(() => {
            console.log(this.timer);
            this.timer -= 1000;

            if(this.timer <= 0){

                io.sockets.to(this.code).emit("Send question " + this.actualQuestion, {
                    answer1: "ciao",
                    answer2: "bella raga",
                    answer3: "fanculo",
                    answer4: "ciaoneeeee",
                });

                clearInterval(this.interval);

            }

            io.sockets.to(this.code).emit("Preparation time", {
                timer: this.timer
            });
        }, 1000);
    }

    this.isFull = function () {

        if(this.players.length >= this.MAX_NUMBER_PLAYER)
            return true;
        return false;
    }

    this.join = function(player) {

        if(!this.isFull()) {
            this.players.push(player);
            return true;
        }

        return false;
    }
}

function createCode() {

    var text = "";
    var possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
