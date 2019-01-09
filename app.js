
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

    // funzione di disconnessione del giocatore
    socket.on('disconnect', function(){

        for(r in rooms) {

            for(p in rooms[r].players) {

                // se trovo il giocatore nella stanza
                if(socket == rooms[r].players[p].socket) {

                    console.log("Client leaves room...");

                    // elimino il socket dalla stanza
                    rooms[r].players.splice(p, 1);

                    // invio le nuove informazioni sulla stanza
                    // con il nuovo numero di giocatori
                    io.sockets.to(rooms[r].code).emit("Players counter", rooms[r].getInfoRoom());
                    break;
                }
            }

            // se l'array dei giocatori della stanza è vuoto
            if(rooms[r].players.length == 0) {

                console.log("Delete room...");

                // chiudo i vari interval (thread) della stanza e la cancello dal vettore
                rooms[r].closeRoom();
                rooms.splice(r, 1);

                break;
            }
        }
    });

    // giocatore fasullo
    // DA FARE: le informazioni del giocatore (nickname e blabla)
    var player = new Player(socket, "Dany");
    // variabile della stanza (nel caso in cui si debba creare)
    var r;

    // funzione per la creazione della stanza
    socket.on('New room', function() {

        console.log('Client create new room...');
        // creo la stanza
        r = new Room();
        // avvio il contatore per far partire il gioco
        r.handlePreparationTime();
        // inserisco il giocatore all'interno della stanza
        r.join(player);
        socket.join(r.code);

        // inserisco la stanza nel vettore
        rooms.push(r);

        // invio le informazioni al giocatore che ha creato la stanza
        socket.emit("Room created", r.getInfoRoom());
    });

    // funzione per accedere alla stanza
    socket.on('Join room', function(code) {

        for(r in rooms) {

            // se il codice è uguale e la stanza non ha ancora cominciato a giocare
            if(code.code == rooms[r].code) {

                if(rooms[r].questions[0] == undefined) {
                    // inserisco nella stanza il giocatore
                    // se riesco (se non è piena la stanza)
                    if(rooms[r].join(player)) {

                        socket.join(rooms[r].code);

                        // e gli invio la conferma dell'accesso alla stanza
                        // e gli invio anche le informazioni riguardanti la stanza
                        socket.emit("Room joined", rooms[r].getInfoRoom());
                        io.sockets.to(rooms[r].code).emit("Players counter", rooms[r].getInfoRoom());

                    } else {

                        console.log("Room is full!");
                        // invio l'errore se la stanza è piena
                        socket.emit("Room joining error", {
                            error: "Room is full"
                        });
                    }
                } else {
                    console.log("You can't access on room!");

                    // invio l'errore se il gioco è iniziato
                    socket.emit("Room joining error", {
                        error: "Game on room started"
                    });
                }

                return;
            }
        }

        // se non trovo la stanza
        // invio l'errore della stanza inesistente
        socket.emit("Room joining error", {
            error: "Room doesn't exist"
        });

    });

    // funzione per ricevere la risposta del giocatore
    socket.on("Receive question",function(data){

        // cerco il socket tra i vari giocatori delle stanze
        let found = false;

        for(r in rooms) {

            if(found == true)
                break;

            for(p in rooms[r].players){

                let player = rooms[r].players[p];

                // se trovo il giocatore nella stanza
                if(player.socket == socket) {

                    console.log(rooms[r].actualQuestion + " "  +  data.nActualQuestion);
                    console.log(rooms[r].players[p].answer);

                    // se si trova in una domanda diversa da quella della stanza
                    if(rooms[r].actualQuestion != data.nActualQuestion){

                        console.log("Ugo");
                    }
                    // se il giocatore non ha ancora risposto alla domanda
                    else if(rooms[r].players[p].answer[rooms[r].actualQuestion] == false) {

                        console.log(rooms[r].actualQuestion);

                        // imposto la risposta del giocatore in base a quella che ha inserito
                        player.answer[data.nActualQuestion] = data.nActualAnswer;

                        // se tutti i client hanno inviato la risposta
                        if(rooms[r].allPlayerAnswered() == true) {

                            console.log("ciao");

                            // invio a ogni singolo socket il flag che indica se
                            // la risposta che ha inserito è corretta o meno
                            for(i in rooms[r].players) {

                                let s = rooms[r].players[i].socket;
                                let _flagCorrectAnswer = false;

                                // setto il flag a true se è uguale la risposta a quella della stanza
                                if(rooms[r].questions[rooms[r].actualQuestion].correctAnswer == rooms[r].players[i].answer[rooms[r].actualQuestion]) {
                                    _flagCorrectAnswer = true;
                                }

                                // invio l'informazione
                                s.emit("debug", {
                                    flagCorrectAnswer: _flagCorrectAnswer
                                });
                            }

                            // informo il giocatore che tutti hanno risposto
                            io.sockets.to(rooms[r].code).emit("All players answered", {
                                correctAnswer: rooms[r].questions[rooms[r].actualQuestion].correctAnswer
                            });

                            // imposto il timer a 3 secondi e lo avvio per la prossima domanda
                            rooms[r].timer = 3*1000;
                            rooms[r].handlePreparationTime();
                        }
                    } else {

                        console.log("ciaoone");
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

    this.answer = Array(10).fill(false);
}

function Question(question, answer, correctAnswer) {
    this.question = question;
    this.answer = answer;

    this.correctAnswer = correctAnswer;
}

function Room() {

    this.MAX_NUMBER_PLAYER = 2;
    this.PREPARATION_TIME = 10*1000;

    this.players = [];
    this.code = createCode();
    this.timer = this.PREPARATION_TIME;

    this.actualQuestion = -1;

    this.questions = [];

    this.allPlayerAnswered = function () {

        for(p in this.players) {
            let player = this.players[p];

            if(player.answer[this.actualQuestion] === false) {
                return false;
            }
        }

        return true;
    }

    this.handlePreparationTime = function () {

        this.actualQuestion++;

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

                var random_number = Math.floor(Math.random()*3);
                var lookup = dict.definitions(randomWord[random_number]);


                this.set = lookup.then((res) => {

                    let question = res.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0];

                    question = capitalizeFirstLetter(question);

                    this.questions[this.actualQuestion] = new Question(question, randomWord, random_number);
                    // invio tutto quando è stato ricevuto il significato della parola
                    console.log(this.questions);
                    io.sockets.to(this.code).emit("Send question", {
                        nQuestion: this.actualQuestion,
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
            if(this.actualQuestion == 0) {

                io.sockets.to(this.code).emit("Preparation time", {
                    timer: this.timer
                });

            } else {

                io.sockets.to(this.code).emit("Answer time", {
                    timer: this.timer
                });
            }
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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
