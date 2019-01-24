![](https://github.com/imaprincess/Dictio/blob/master/Images/dictiogame.png)

## Manuale utente
### Cos'è dictio? 
Dictio è una piattaforma web pensata per sfidare i tuoi amici a colpi di inglese - chi ne sa di più? 

### Come collegarsi
Una volta collegati al sito, uno di voi dovrà creare una nuova stanza premendo sull'apposito tasto. Ogni stanza ha un codice univoco: gli altri partecipanti, per aggiungersi alla stanza, dovranno inserirlo nell'apposita barra. Fate in fretta! Dopo 10 secondi dalla creazione della stanza il gioco ha inizio. 

### Come giocare
Sul display del tuo pc/tablet/telefono appariranno delle domande - clicca sulla parola che ti sembra somigliare di più alla definizione fornita. Quando tutti hanno risposto vi verrà svelata la risposta corretta!

## Per chi vuole saperne di più
### Come funziona dictio?
Dictio è basato sullo scambio di messaggi fra client e server, necessari per mantenere il gioco sincronizzato.
Esistono diversi tipi di messaggi: 

#### Messaggi inviati dal server 
* ```Room created``` -> Conferma la creazione della Room. 
* ```Room joined``` -> Conferma l'unione di un partecipante alla Room.
* ```Room joining error``` -> Comunica un qualche errore nell'unione ad una room, che potrebbe essere ```"Room is full"```, cioè quando la room ha raggiunto il numero massimo di partecipanti, ```"Room doesn't exist"```, quando il codice inserito non corrisponde a nessuna Room, oppure ```"Game on room started"```, cioè quando il gioco è già cominciato.  
* ```Preparation time``` -> Scandisce il passare del tempo di preparazione, cioè l'intervallo di tempo prima dell'inizio del gioco, dove i partecipanti si uniscono alla room.
* ```Players counter``` -> Invia il conteggio attuale dei player, in modo che il client lo visualizzi a schermo.
* ```Send quiz``` -> Invia il quiz a tutti i client
* ```Answer time``` -> Scandisce il passare del tempo utile per rispondere al quiz proposto.
* ```All players answered``` -> Comunica che tutti i giocatori hanno risposto alla domanda proposta. 
* ```Ranking``` -> Invia la classifica ai client.

#### Messaggi inviati dal client
* ```New room``` -> Richiesta di creazione della Room.
* ```Join room``` -> Richiesta di unione da parte di un Player ad una Room.
* ```Sending answer``` -> Invio della risposta alla domanda attuale.
 
### Quali entità sono presenti nel codice? 
Nel codice sono presenti solo tre entità: 
* ```(Room)[]```
* ```(Player)[]```
* ```(Quiz)[]```

### Gestione degli utenti
Le uniche azioni consentite ad un utente sono creare una Room e unirsi ad una Room già creata. Quando un utente fa parte di una room, può rispondere alle domande proposte, per poi visualizzare la classifica. 

Tutti gli utenti sono considerati uguali quando inseriti in una Room, nemmeno il creatore ha potere sugli altri, non esiste modo di accedere come "admin" o come utente con poteri speciali. 

Ad ogni utente è assegnato un nickname, utile per visualizzare la classifica, ma non per il sistema: il riconoscimento degli utenti si basa sul socket utilizzato per connettersi, non sul nickname scelto - questo evita eventuali conflitti e non obbliga gli utenti a scegliere dei nickname diversi fra di loro. 

### Gestione dei quiz
Ogni quiz è formato da una domanda, quattro risposte possibili e un numero, che rappresenta l'indice (0-based) della risposta corretta. 
I quiz sono formati casualmente, utilizzando due API, una per fornire quattro parole random e una per fornire la definizione di una di esse.

### Gestione delle stanze
Ogni stanza è a sé stante e indipendente dalle altre, e ha senso solo quando popolata da giocatori. È identificata da un codice univoco, creato casualmente da un insieme di lettere maiuscole e minuscole (circa 50 lettere, cioè 26 maiuscole e 26 minuscole meno qualche lettera considerata "non ben chiara" quando appare a schermo - ad esempio, la i maiuscola e la L minuscola sono state tolte, perché facilmente confondibili) e utilizzato dai player quando vogliono unirsi ad una nuova Room. 

Ogni stanza contiene un numero limitato di players (per ora 4) e un numero di quiz. Player e quiz sono indipendenti e diversi da una stanza all'altra, non vengono mai riutilizzati, ma creati ogni volta nuovi. 


### Che tecnologie sono state utilizzate? 
#### Gestione del server
#### Gestione del client 
