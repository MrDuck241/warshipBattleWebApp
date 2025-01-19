//WebSocket Server File

//Server message info codes

//ClosingSession
//400 -> one of the player send closing message

//CanNotCreateGame
//200 -> game with given name arleady exists

const WebSocket = require('ws');
const crypto = require('crypto'); // For generating session and player autorize keys

const server = new WebSocket.Server({ port: 4500 });

let client_counter = 0;

class Player{
    constructor(playerName, connectionInstance){
        this.playerName = playerName;
        this.connectionInstance = connectionInstance;
        this.poz_x = [];
        this.poz_y = [];
        this.lives = 7;

        const rawData = `${this.playerName}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
        this.uniqueKey =  crypto.createHash('sha256').update(rawData).digest('hex');
    }
    SetPosX(value, index){
        this.poz_x[index] = value;
    }
    SetPosY(value, index){
        this.poz_y[index] = value;
    }
    getPlayerUniqueKey(){
        return this.uniqueKey;
    }
    changePlayerSocketInstance(newSocketInstance){
        this.connectionInstance = newSocketInstance;
    }
};

let players = {};

class GameSession {
    constructor(sessionName, sessionPassword) {
        this.gameSessionName = sessionName;
        this.gameSessionPassword = sessionPassword;

        this.isGameStarted = false;
        this.isGameEnded = false;

        this.gameStatus = "started";
        //closed
        //started
        //waiting
        //players_preparing
        //game_started
        //game_finished

        this.connectedPlayers = 0;
        this.playersGavePos = 0; // Used to know if both players gave their positions: var = 0 => none of player placed ships var = 1 => one player placed ships var = 2 => both players placed their ships
        this.currentPlayerTurn = -1;
        this.playersIndex = {}; // Helpfull array for recognizing player index using his nickname playersIndex["Jan"] = 0 | playersIndex["Ola"] = 1
        this.players = []; // Array for players objects
        this.playersNames = [];

        const rawData = `${this.playerName}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
        this.uniqueKey =  crypto.createHash('sha256').update(rawData).digest('hex');
    }
    AddPlayer(obj, name){
        this.players[this.connectedPlayers] = obj;
        this.playersNames[this.connectedPlayers] = name;
        this.playersIndex[name] = this.connectedPlayers;
        this.connectedPlayers++;
    }
    getGameSessionUniqueKey(){
        return this.uniqueKey;
    }
};

let GameSessions = {};

function doesGameSessionExists(sessionName){
    if(sessionName in GameSessions) return true;
    else return false;
}

function doesPlayerExist(playerNickname, playerIDKey){
    if(playerNickname in players && playerIDKey == players[playerNickname].getPlayerUniqueKey()) return true;
    else return false;
}

function doesGameHasPlayer(sessionName, playerNickname){
    const gameSession = GameSessions[sessionName];

    if(playerNickname in gameSession.playersIndex) return true;
    else return false;
}

function checkSessionPassword(sessionName, playerSessionPassword){
    const sessionPassword = GameSessions[sessionName].gameSessionPassword;
    if(sessionPassword == playerSessionPassword) return true;
    else return false;
}

server.on('connection', socket => {
    client_counter++;
    console.log(`Client number ${client_counter} connected`);

    socket.on('message', message => {
        const data = JSON.parse(message);

        if (!data || !data.action) {
            socket.send(JSON.stringify({ action: "Error", message: "Invalid data format" }));
            return;
        }

        if (data.action === "CreateGameSession") {
            if(doesGameSessionExists(data.sessionName)){
                console.log("Cant create game session: session arleady exists");
                socket.send(JSON.stringify({action: "CanNotCreateGame", error: 200}));
            }
            else {
                GameSessions[data.sessionName] = new GameSession(data.sessionName, data.sessionPassword);
                socket.send(JSON.stringify({action: "GameCreated"}));
            }
        }
        
        else if (data.action === "GetOpponentNickname"){
            const sessionName = data.sessionName;
            const firstPlayer = data.playerNickname; //Player sending question nickaname
            const firstPlayerIDKey = data.PlayerIDKey;

            if(doesGameSessionExists(sessionName)){ 
                if(doesPlayerExist(firstPlayer, firstPlayerIDKey)){
                    if(doesGameHasPlayer(sessionName, firstPlayer)){
                        const gameSession = GameSessions[sessionName];

                        socket.send(JSON.stringify({
                            action: "SendingOpponentNick", 
                            opponent: gameSession.players[1 ^ gameSession.playersIndex[firstPlayer]].playerName}
                        ));
                    }
                }
            }
        }

        else if (data.action === "GetGameSessionsNames") {
            const GameSessionObjects = Object.keys(GameSessions).map(session_name => {
                return {
                    session_name: session_name,
                    is_protected: GameSessions[session_name].gameSessionPassword !== ""
                };
            });
            socket.send(JSON.stringify({ action: 'SendingGameSessions', sessions: GameSessionObjects }));
        }
        
        else if(data.action == "CheckShot") {
            const playerNickname = data.playerNickname;
            const playerIDKey = data.playerIDKey;
            const sessionName = data.sessionName;
            const playerSessionIDKey = data.playerSessionIDKey;
            if(doesGameSessionExists(sessionName)){
                if(doesPlayerExist(playerNickname, playerIDKey)){
                    if(doesGameHasPlayer(sessionName, playerNickname)){
                        let Shooted = false;
                            for(let i = 0; i < GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].poz_x.length; i++) {
                                let liczba = GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].poz_x[i];
                                if(data.placeToCheck.x == liczba) {
                                    if(GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].poz_y[i] == data.placeToCheck.y) {
                                        GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].lives--;
                                        Shooted = true;
                                    }
                                }
                            }
                            if(Shooted == true) {
                                GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].connectionInstance.send(JSON.stringify({action: "YouAreHit", cords: data.placeToCheck}));
                                GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn].connectionInstance.send(JSON.stringify({action: "GoodShoot", cords: data.placeToCheck}));
                            }
                            else{
                                GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn].connectionInstance.send(JSON.stringify({action: "MissedShot", cords: data.placeToCheck}));
                            }
                            if(GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].lives == 0) {

                                const endGameInfoWinner = {
                                    winner: GameSessions[sessionName].playersNames[GameSessions[sessionName].currentPlayerTurn],
                                    loser: GameSessions[sessionName].playersNames[GameSessions[sessionName].currentPlayerTurn ^ 1],
                                    playerLeftShipsLives: GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn].lives,
                                    opponentLeftShipsLives: GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].lives,
                                    playerGoodShots: 7 - GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].lives
                                }

                                const endGameInfoLoser = {
                                    winner: GameSessions[sessionName].playersNames[GameSessions[sessionName].currentPlayerTurn],
                                    loser: GameSessions[sessionName].playersNames[GameSessions[sessionName].currentPlayerTurn ^ 1],
                                    playerLeftShipsLives: GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].lives,
                                    opponentLeftShipsLives: GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn].lives,
                                    playerGoodShots: 7 - GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn].lives
                                }

                                GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn].connectionInstance.send(JSON.stringify({action: "EndOfGame", info: endGameInfoWinner}));
                                GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn ^ 1].connectionInstance.send(JSON.stringify({action: "EndOfGame", info: endGameInfoLoser}));
                                GameSessions[sessionName].isGameEnded = true;

                                
                                delete players[playerNickname];
                                delete GameSessions[sessionName].players[1 ^ GameSessions[sessionName].playersIndex[playerNickname]]; //Deleting "playerNickname" opponent
                                delete GameSessions[sessionName];
                            }
                            else{
                                GameSessions[sessionName].currentPlayerTurn ^= 1;
                                GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn].connectionInstance.send(JSON.stringify({action: "Attack"}));
                            }
                        } else console.log("Player is not assigned to this game session");
                    } else console.log("Player does not exists");
                } else console.log("Game session does not exists");
        }

        else if(data.action == "ExitFromGame") {
            const sessionName = data.sessionName;
            const firstPlayer = data.playerNickname; //Player sending ExitFromGame message
            const firstPlayerIDKey = data.playerIDKey;

            if(doesGameSessionExists(sessionName)){
                if(doesPlayerExist(firstPlayer, firstPlayerIDKey)){
                    if(doesGameHasPlayer(sessionName, firstPlayer)){
                        const gameSession = GameSessions[sessionName];

                        gameSession.players[1 ^ gameSession.playersIndex[firstPlayer]].send(JSON.stringify({ 
                            action: 'ClosingSession', 
                            code: 400
                        }))

                        delete players[firstPlayer];
                        delete gameSession.players[1 ^ gameSession.playersIndex[firstPlayer]]; //Deleting fistPlayer's opponent
                        delete GameSessions[sessionName];
                    }
                }
            }
        }

        else if(data.action == "SaveShipsPositions") {
            const playerNickname = data.playerNickname;
            const playerIDKey = data.playerIDKey;
            const sessionName = data.sessionName;
            const playerSessionIDKey = data.playerSessionIDKey;
            if(doesGameSessionExists(sessionName)){
                if(doesPlayerExist(playerNickname, playerIDKey)){
                    if(doesGameHasPlayer(sessionName, playerNickname)){
                        let x_it = 0;
                        let y_it = 0;
                        GameSessions[sessionName].players[GameSessions[sessionName].playersIndex[playerNickname]].changePlayerSocketInstance(socket);
                        GameSessions[sessionName].playersGavePos++;
                        for(let i = 0; i <= 6; i++) {
                            GameSessions[sessionName].players[GameSessions[sessionName].playersIndex[playerNickname]].SetPosX(data.positions[i].x, x_it);
                            x_it++;
                            GameSessions[sessionName].players[GameSessions[sessionName].playersIndex[playerNickname]].SetPosY(data.positions[i].y, y_it);
                            y_it++;
                        }

                        if(GameSessions[sessionName].playersGavePos == 2) {
                            const randomZeroOrOne = Math.floor(Math.random() * 2);
                            GameSessions[sessionName].currentPlayerTurn = randomZeroOrOne;
                            GameSessions[sessionName].players[GameSessions[sessionName].currentPlayerTurn].connectionInstance.send(JSON.stringify({action: "Attack"}));
                        }
                    } else console.log("Player is not assigned to this game session");
                } else console.log("Player does not exists");
            } else console.log("Game session does not exists");
        }

        else if(data.action === "PlayGame") { //Player connecting to session but not yet playing (waiting for second player)
            const sessionName = data.sessionName;
            const playerSessionPassword = data.sessionPassword;
            const playerNickname = data.playerNickname; //Nickname player chose for playing

            if(doesGameSessionExists(sessionName)) {
                if(checkSessionPassword(sessionName, playerSessionPassword)){
                    players[playerNickname] = new Player(playerNickname, socket);

                    socket.send(JSON.stringify({ 
                        action: "CorrectSessionData", 
                        playerKey: players[playerNickname].getPlayerUniqueKey(),
                        sessionKey: GameSessions[sessionName].getGameSessionUniqueKey()
                    }));

                    GameSessions[sessionName].AddPlayer(players[playerNickname], playerNickname);
                    GameSessions[sessionName].gameStatus = "waiting"; // One player has joined the game session and game is waiting for second player
                }
            }
            else socket.send(JSON.stringify({ action: "IncorrectSessionData" }));
        }

        // Expected recconection is reconection made while react app change route and websocket connection is 
        // automaticaly closed and new connection is needed for proper app behaviour

        else if (data.action == "ExpectedReconnection"){
            const playerNickname = data.playerNickname;
            const playerIDKey = data.playerIDKey;
            const sessionName = data.sessionName;
            const playerSessionIDKey = data.playerSessionIDKey;

            if(doesPlayerExist(playerNickname, playerIDKey)){
                if(doesGameSessionExists(sessionName, playerSessionIDKey)){
                    if(doesGameHasPlayer(sessionName, playerNickname)){
                        const gameSession = GameSessions[sessionName];
                        gameSession.players[gameSession.playersIndex[playerNickname]].changePlayerSocketInstance(socket);
                        gameSession.players[gameSession.playersIndex[playerNickname]].connectionInstance.send(JSON.stringify({ action: "ExpectedReconnectionDone" }));
                        if(gameSession.connectedPlayers > 1) {
                            gameSession.gameStatus = "players_preparing"; //Two players joined game and they can prepare their ships

                            gameSession.players[0].connectionInstance.send(JSON.stringify({action: "ReadyForGame", opponent: gameSession.players[1].playerName}));
                            gameSession.players[1].connectionInstance.send(JSON.stringify({action: "ReadyForGame", opponent: gameSession.players[0].playerName}));                  
                        }
                        gameSession.isGameStarted = true;
                    }
                }
                else socket.send(JSON.stringify({action: "GameSessionNotFoundInSessionsArray"}))
            }
            else socket.send(JSON.stringify({ action: "PlayerNotFoundInPlayersArray" }));
        }

        //functionInWorking
        else if (data.action === "Reconnect") {
            console.log("Reconnet function called");
        }
    }
);

    socket.on('close', () => {
        console.log('Client disconnected');
        client_counter--;
    });
});

console.log('WebSocket server is running');