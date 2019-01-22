class Room {
    constructor() {
        this.CAPACITY = 2;
        this.PREPARATION_TIME = 10 * 1000; // 10 secs
        this.ANSWER_TIME = 3*1000; // 3 secs

        this.players = [];
        this.quizzes = [];

        this.code = this.createCode();
        this.timer = this.PREPARATION_TIME;

        this.actualQuiz = -1;

        this.createQuiz = () => {
            // genero 4 parole randomiche
            console.log("Create quiz");
            var randomWord = randomWords(4);

            // cerco il significato della prima
            
            let random_number = Math.floor(Math.random() * 3);

            dict.definitions(randomWord[random_number]).then((res) => {

                let question = res.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0];

                question = capitalizeFirstLetter(question);


                console.log("actual:", this);
                this.quizzes[this.actualQuiz] = new Quiz(question, randomWord, random_number);
                // invio tutto quando è stato ricevuto il significato della parola
                console.log(this.quizzes);
                console.log("Send quiz");
                io.sockets.to(this.code).emit("Send quiz", {
                    nQuiz: this.actualQuiz,
                    question: question,
                    answers: randomWord
                });

            },
                function (err) {
                    // err contains any failed responses to handle as desired
                    console.log(err);
                }).catch(err => console.log(err));
        }

        this.handleTime = (timerInterval, countdownSeconds, f) => {

            this.actualQuiz++;
            this.timer = countdownSeconds;

            this.set = this.interval = setInterval(() => {

                console.log(this);
                this.timer -= timerInterval;

                if (this.timer <= 0) {

                    f();

                    clearInterval(this.interval);
                } 
                
                if (this.actualQuiz == 0) {

                    io.sockets.to(this.code).emit("Preparation time", {
                        timer: this.timer
                    });

                } else {

                    io.sockets.to(this.code).emit("Answer time", {
                        timer: this.timer
                    });
                }
            }, timerInterval);
        }

    }

    allPlayerAnswered() {

        for (p in this.players) {
            let player = this.players[p];

            if (player.answer[this.actualQuiz] === false) {
                return false;
            }
        }

        return true;
    }



    isFull() {

        if (this.players.length >= this.CAPACITY)
            return true;
        return false;
    }

    join(player) {

        if (!this.isFull()) {
            this.players.push(player);
            return true;
        }

        return false;
    }

    closeRoom() {

        clearInterval(this.interval);
    }

    getInfoRoom() {

        let info = {
            code: this.code,
            capacity: this.CAPACITY,
            counter: this.players.length,
            quiz: this.actualQuiz,
            timer: this.timer
        };

        return info;
    }

    createCode() {

        let text = "";
        let possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

        for (let i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}

// Player CLASS
class Player {

    constructor(socket, nick) {
        this.socket = socket;
        this.score = 0;
        this.nick = nick;
    
        this.answer = Array(10).fill(false);
    }

}

class Quiz {

    constructor(question, answer, correctAnswer) {

        this.question = question;
        this.answer = answer;

        this.correctAnswer = correctAnswer;
    }
}


//// ########## DICTIONARY ########## ////

let Dictionary = require("oxford-dictionary");

let config = {
    app_id: "9a365978",
    app_key: "736a8b1c5fb3546b9cd1cd35e32a09f5",
    source_lang: "en"
};

let dict = new Dictionary(config);

//// ########## RANDOM WORDS ########## ////

let randomWords = require('random-words');

//// ########## SERVER ########## ////

let express = require('express');
let app = express();
let serv = require('http').Server(app);

let rooms = [];


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

console.log("Server started.");

let io = require('socket.io')(serv);

io.sockets.on('connection', function (socket) {

    // funzione di disconnessione del giocatore
    socket.on('disconnect', function () {

        for (r in rooms) {

            for (p in rooms[r].players) {

                // se trovo il giocatore nella stanza
                if (socket == rooms[r].players[p].socket) {

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
            if (rooms[r].players.length == 0) {

                console.log("Delete room...");

                // chiudo i vari interval (thread) della stanza e la cancello dal vettore
                rooms[r].closeRoom();
                rooms.splice(r, 1);

                break;
            }
        }
    });

    // giocatore fasullo
    // TODO: le informazioni del giocatore (nickname e blabla)
    let player = new Player(socket, "Dany");
    // variabile della stanza (nel caso in cui si debba creare)
    let r;

    // funzione per la creazione della stanza
    socket.on('New room', function () {

        console.log('Client create new room...');
        // creo la stanza
        r = new Room();
        // avvio il contatore per far partire il gioco
        //r.handlePreparationTime();

        console.log(r.createQuiz);
        r.handleTime(1000, r.PREPARATION_TIME, r.createQuiz);

        // inserisco il giocatore all'interno della stanza
        r.join(player);
        socket.join(r.code);

        // inserisco la stanza nel vettore
        rooms.push(r);

        // invio le informazioni al giocatore che ha creato la stanza
        socket.emit("Room created", r.getInfoRoom());
    });

    // funzione per accedere alla stanza
    socket.on('Join room', function (code) {

        for (r in rooms) {

            // se il codice è uguale e la stanza non ha ancora cominciato a giocare
            if (code.code == rooms[r].code) {

                if (rooms[r].quizzes[0] == undefined) {
                    // inserisco nella stanza il giocatore
                    // se riesco (se non è piena la stanza)
                    if (rooms[r].join(player)) {

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
    socket.on("Receive answer", function (data) {

        // cerco il socket tra i vari giocatori delle stanze
        let found = false;

        for (r in rooms) {

            if (found == true)
                break;

            for (p in rooms[r].players) {

                let player = rooms[r].players[p];

                // se trovo il giocatore nella stanza
                if (player.socket == socket) {

                    console.log(rooms[r].actualQuiz + " " + data.nActualQuiz);
                    console.log(rooms[r].players[p].answer);

                    // se si trova in una domanda diversa da quella della stanza
                    if (rooms[r].actualQuiz != data.nActualQuiz) {

                        console.log("Ugo");
                    }
                    // se il giocatore non ha ancora risposto alla domanda
                    else if (rooms[r].players[p].answer[rooms[r].actualQuiz] == false) {

                        console.log(rooms[r].actualQuiz);

                        // imposto la risposta del giocatore in base a quella che ha inserito
                        player.answer[data.nActualQuiz] = data.nActualAnswer;

                        // se tutti i client hanno inviato la risposta
                        if (rooms[r].allPlayerAnswered() == true) {

                            console.log("ciao");

                            // invio a ogni singolo socket il flag che indica se
                            // la risposta che ha inserito è corretta o meno
                            for (i in rooms[r].players) {

                                let s = rooms[r].players[i].socket;
                                let _flagCorrectAnswer = false;

                                // setto il flag a true se è uguale la risposta a quella della stanza
                                if (rooms[r].quizzes[rooms[r].actualQuiz].correctAnswer == rooms[r].players[i].answer[rooms[r].actualQuiz]) {
                                    _flagCorrectAnswer = true;
                                }

                                // invio l'informazione
                                s.emit("debug", {
                                    flagCorrectAnswer: _flagCorrectAnswer
                                });
                            }

                            // informo il giocatore che tutti hanno risposto
                            io.sockets.to(rooms[r].code).emit("All players answered", {
                                correctAnswer: rooms[r].quizzes[rooms[r].actualQuiz].correctAnswer
                            });

                            // imposto il timer a 3 secondi e lo avvio per la prossima domanda
                            rooms[r].timer = 3 * 1000;
                            rooms[r].handleTime(1000, rooms[r].ANSWER_TIME, rooms[r].createQuiz);

                            console.log("Quizzes length: " + rooms[r].quizzes.length);
                            if(rooms[r].quizzes.length == 2){
                                console.log(rooms[r].players);
                                let obj = {
                                    players: []
                                };

                                for(element in rooms[r].players) 
                                    obj.players.push(element);

                                console.log(obj);

                                io.sockets.to(rooms[r].code).emit("Ranking", obj);
                            }
                        }
                    } else {

                    }

                    break;
                }
            }
        }

    });
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
