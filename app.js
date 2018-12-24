
//// ########## DICTIONARY ########## ////

var Dictionary = require("oxford-dictionary");

var config = {
    app_id : "9a365978",
    app_key : "736a8b1c5fb3546b9cd1cd35e32a09f5",
    source_lang : "en"
};

var dict = new Dictionary(config);

//// ########## RANDOM WORDS ########## ////

var randomWords = require('random-words');

//// ########## SERVER ########## ////

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

    socket.on('disconnect', function(){

        for(r in rooms) {

            for(p in rooms[r].players) {

                // elimino il socket dalla stanza
                if(socket == rooms[r].players[p].socket) {

                    console.log("Client leaves room...");

                    rooms[r].players.splice(p, 1);

                    io.sockets.to(rooms[r].code).emit("Players counter", rooms[r].getInfoRoom());
                    break;
                }
            }

            // se l'array dei giocatori della stanza è vuoto allora cancello la stanza
            if(rooms[r].players.length == 0) {

                console.log("Delete room...");

                rooms[r].closeRoom();
                rooms.splice(r, 1);

                break;
            }
        }
    });

    var player = new Player(socket, "Dany");
    var r;

    socket.on('New room', function() {

        console.log('Client create new room...')
        r = new Room();
        r.handlePreparationTime();
        r.join(player);

        rooms.push(r);
        socket.join(r.code);

        socket.emit("Room created", r.getInfoRoom());
    });

    socket.on('Join room', function(code) {

        //console.log('Client join in room with code ' + code.code + '...');

        for(r in rooms) {

            if(code.code == rooms[r].code) {

                if(rooms[r].join(player)) {

                    socket.join(rooms[r].code);

                    //console.log(rooms[r].getInfoRoom());

                    socket.emit("Room joined", rooms[r].getInfoRoom());
                    io.sockets.to(rooms[r].code).emit("Players counter", rooms[r].getInfoRoom());

                } else {

                    console.log("Room is full!");

                    socket.emit("Room joining error", {
                        error: "Room is full"
                    });
                }

                return;
            }
        }


        socket.emit("Room joining error", {
            error: "Room doesn't exist"
        });

    });

    socket.on("Receive question",function(data){

        // cerco il socket tra i vari giocatori delle stanze
        let found = false;
        for(r in rooms) {

            if(found == true)
                break;

            for(p in rooms[r].players){

                let player = rooms[r].players[p];
                if(player.socket == socket) {

                    if(rooms[r].actualQuestion != data.nActualQuestion){

                        player.question[data.nActualQuestion] = -1;
                    } else {

                        player.question[data.nActualQuestion] = data.nActualAnswer;
                    }

                    // se tutti i client hanno inviato la risposta
                    if(rooms[r].allPlayerAnswered() == true) {
                        // invio la risposta corretta
                        // DA FAREEEE
                        io.sockets.to(rooms[r].code).emit("ciao");
                    }

                    break;
                }
            }
        }

    });
});

// Player CLASS
function Player(socket, nick) {

    this.socket = socket; // forse togliere
    this.score = 0;
    this.nick = nick;

    this.question = [];
}

function Room() {

    this.MAX_NUMBER_PLAYER = 2;
    this.PREPARATION_TIME = 20*1000;

    this.players = [];
    this.code = createCode();
    this.timer = this.PREPARATION_TIME;

    this.actualQuestion = 1;

    this.allPlayerAnswered = function () {

        for(p in this.players) {
            let player = this.players[p];

            if(player.question[this.actualQuestion] == null) {
                return false;
            }
        }

        return true;
    }

    this.handlePreparationTime = function () {

        this.set = this.interval = setInterval(() => {

            this.timer -= 1000;

            if(this.timer <= 0){

                // genero 4 parole randomiche
                var randomWord = randomWords(4);

                // stampo temporaneamente le parole sul server
                /*for(s in randomWord){
                    console.log(randomWord[s]);
                }*/

                // cerco il significato della prima
                var lookup = dict.definitions(randomWord[0]);

                this.set = lookup.then((res) => {

                    let question = res.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0];

                    // invio tutto quando è stato ricevuto il significato della parola
                    io.sockets.to(this.code).emit("Send question " + this.actualQuestion, {
                       question: question,
                       answers: randomWord
                    });

                },
                function(err) {
                    // err contains any failed responses to handle as desired
                    console.log(err);
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

    this.closeRoom = function() {

        clearInterval(this.interval);
    }

    this.getInfoRoom = function() {

        let info = {
            code: this.code,
            max_player: this.MAX_NUMBER_PLAYER,
            counter: this.players.length,
            question: this.actualQuestion,
            timer: this.timer
        };

        return info;
    }
}

function createCode() {

    var text = "";
    var possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
