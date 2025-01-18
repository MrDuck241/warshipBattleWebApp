import '../components_styles/GameMenu.css'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GameMenu = () => {

    const serverUrl = import.meta.env.VITE_SERVER_URL;

    const [playerNickname, setPlayerNickname] = useState('');
    const [showGamesNamesBox, setShowGamesNamesBox] = useState(false);
    const [gameSessions, setGameSessions] = useState(null);
    const [sessionPasswords, setSessionPasswords] = useState({}); // Array for inserted password for sessions in the games list

    const navigate = useNavigate();

    const createGame = () => {
        const serverConn = new WebSocket(serverUrl);
        const gameName = prompt("Enter Name for Your Game Session");
        const gamePassword = prompt("Enter Password for Your Game Session (Leave Empty to Set Open Session)");

        if (gameName.trim() && gamePassword.trim()) {

            const createGameMessage = {
                action: "CreateGameSession",
                sessionName: gameName,
                sessionPassword: gamePassword
            };
    
            serverConn.onopen = function () {
                serverConn.send(JSON.stringify(createGameMessage));
            };
    
            serverConn.onmessage = (event) => {
                const receivedData = JSON.parse(event.data);
                if(receivedData.action == "CanNotCreateGame"){
                    switch(receivedData.error){
                        case 200:
                            alert("Can not create game session: session with this name arleady exists");
                        break;
                    }
                }
                else if(receivedData.action == "GameCreated") alert("Session Created");
                serverConn.close();
            }

            serverConn.onerror = () => {
                alert("Error while connecting to server, try later!");
            }
        }
        else alert("Session can not be created with such parameters");
    }

    const joinGame = () => {
        if(playerNickname.trim() === ""){
            alert("Invalid Player Name");
        }
        else {
            const ServerConn = new WebSocket(serverUrl);
    
            const getGameSessionsNamesMessage = {
                action: "GetGameSessionsNames"
            };
    
            ServerConn.onopen = () => {
                ServerConn.send(JSON.stringify(getGameSessionsNamesMessage));
            }
    
            ServerConn.onmessage = (event) => {
                const received_data = JSON.parse(event.data);
                if(received_data.action == "SendingGameSessions"){
                    setGameSessions(received_data.sessions);
                }
                ServerConn.close();
            }
            setShowGamesNamesBox(true);
        }
    }

    const playGame = (session_name) => {
        const ServerConn = new WebSocket(serverUrl);
        const pass_value = sessionPasswords[session_name] || "none";

        let playSessionMessage = {
            action: "PlayGame",
            sessionName: session_name,
            sessionPassword: pass_value,
            playerNickname: playerNickname
        };

        ServerConn.onopen = () => {
            ServerConn.send(JSON.stringify(playSessionMessage));
        }

        ServerConn.onmessage = function(event) {
            const receivedData = JSON.parse(event.data);
            if(receivedData.action == "CorrectSessionData"){
                    localStorage.setItem("playerNickname", playerNickname);
                    localStorage.setItem("sessionName", session_name);
                    localStorage.setItem("playerIDKey", receivedData.playerKey);
                    localStorage.setItem("sessionIDKey", receivedData.sessionKey);
                    ServerConn.close();
                    navigate('/searching_opponent');
                }
            else if(receivedData.action == "IncorrectSessionData"){
                alert("Wrong password!");
            }
        }
    };

    const handlePasswordChange = (sessionName, value) => {
        setSessionPasswords(prev => ({ ...prev, [sessionName]: value }));
    };    

    const renderGameSessionBox = (element, index) => {
        return (
            <div className='w-[80%] h-[80px] bg-slate-500 border-2 border-solid border-black rounded-[8px] overflow-x-auto sessionBox'>
                <div className='w-[85%] h-[40%] flex justify-between pl-[10px] pt-[2px]'>
                    <span>Session: {index + 1}</span>
                    <span>{element.session_name}</span>
                    {element.is_protected ? (<img className = "w-[25px] h-[25px] object-cover" src = "icons/lock_icon.png"/>) : (<img className = "w-[25px] h-[25px] object-cover" src = "icons/open_icon.png"/>)}
                </div>
                <div className='flex flex-row gap-[5px] ml-[10px]'>
                    {
                        element.is_protected && <input type = "text" onChange = {(e) => handlePasswordChange(element.session_name, e.target.value)} className='passwordInput' placeholder='password'></input>
                    }
                    <button type = "button" className='playBtn' onClick = {() => playGame(element.session_name)}>PLAY</button>
                </div>
            </div>
        )
    }

    return (
        <>
            {
                showGamesNamesBox && (
                    <div className='w-[100vw] h-[100vh] fixed top-0 left-0 backdrop-blur-md'>
                        <div className='w-[25%] h-[60%] relative top-[50%] left-[50%] -translate-x-2/4 -translate-y-2/4 flex flex-col items-center sessionBoxesPopup'>
                            <div className='w-[100%] h-[80px] sessionBoxesPopupBlueMetal'>
                                <img className = "w-[40px] h-[40px] object-cover float-right mr-[10px] mt-[10px] mb-[10px]" 
                                    src = "icons/close_btn.png" 
                                    onClick={() => setShowGamesNamesBox(false)}
                                    alt="Close Button"
                                />
                            </div>
                            <div className='w-[100%] h-auto mt-[20px] gap-[10px] overflow-y-auto flex flex-col items-center mb-[10px]'>
                                {gameSessions?.map((element, index) => renderGameSessionBox(element, index))}
                            </div>
                        </div>
                    </div>
                )
            }

            <div id="gameMenu">
                <div className="menu-header"></div> {/* Blue line on top of menu */}
                <div className="menu-main"> {/* Main container of menu site */}
                    <img className="menu-image" src="assets/menu_image1.jpg" alt="Menu Image 1" />
                    <div className="menu-panel"> {/* Container with main elements such play btn */}
                        <div className="gameTitle">
                            <span className='gameTitle'>MULTIPLAYER BATTLESHIP GAME</span>
                        </div>
                        <div className="menu-form">
                            <span className='enterNickText'>Enter your nickname</span>
                            <input 
                                defaultValue={playerNickname} 
                                onChange={(e) => setPlayerNickname(e.target.value)} 
                                type="text" 
                                className="menu-input text-center" 
                                placeholder='nick'
                            />
                            <div className="menu-buttons">
                                <button type="button" onClick={() => joinGame()} className='menuBtn'>JOIN GAME</button>
                                <button type="button" onClick={() => createGame()} className="menuBtn">CREATE GAME</button>
                            </div>
                        </div>
                    </div>
                    <img className="menu-image" src="assets/menu_image2.jpg" alt="Menu Image 2" />
                </div>
                <div className="menu-footer"></div> {/* Blue line on bottom of menu */}
            </div>
        </>
    )
}

export default GameMenu;