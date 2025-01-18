import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../components_styles/SearchingOpponent.css'

const SearchingOpponent = () => {

    const serverUrl = import.meta.env.VITE_SERVER_URL;
    const serverConn = new WebSocket(serverUrl);
    const navigate = useNavigate();

    serverConn.onmessage = (event) => {
        const receivedData = JSON.parse(event.data);
        if(receivedData.action == "ExpectedReconnectionDone"){
            // some intructions
        }
        else if(receivedData.action == "PlayerNotFoundInPlayersArray"){
            alert("Player not found | cannot reconnect");
        }
        else if(receivedData.action == "GameSessionNotFoundInSessionsArray"){
            alert("Game not found | cannot recconect");
        }
        if(receivedData.action == "ReadyForGame"){
            serverConn.close();
            navigate("/game");
        }
    }

    const playerNickname = localStorage.getItem("playerNickname");
    const sessionName = localStorage.getItem("sessionName");
    const playerIDKey = localStorage.getItem("playerIDKey");
    const sessionIDKey = localStorage.getItem("sessionIDKey");

    const reconnectMsg = {
        action: "ExpectedReconnection",
        playerNickname: playerNickname,
        sessionName: sessionName,
        playerIDKey: playerIDKey,
        sessionIDKey: sessionIDKey
    };

    serverConn.onopen = () => {
        serverConn.send(JSON.stringify(reconnectMsg));
    }

    useEffect(() => {
        RenderRadar();
    }, [])

    return (
        <div className="searching_opponent">
            <div className="wait_box">
                <span className="wait_info">Waiting for opponent...</span>
                <canvas id="radarCanvas"></canvas>
            </div>
        </div>
    )
}

export default SearchingOpponent;

function RenderRadar(){
    const canvas = document.getElementById('radarCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 400;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;
    let angle = 0;

    // Funkcja rysująca siatkę radaru
    function drawRadarGrid() {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Rysowanie okręgów
        for (let i = 1; i <= 4; i++) {
            ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Rysowanie linii krzyżowych
        for (let i = 0; i < 360; i += 45) {
            const rad = (i * Math.PI) / 180;
            const x = centerX + Math.cos(rad) * radius;
            const y = centerY + Math.sin(rad) * radius;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    // Funkcja rysująca zielony skaner
    function drawScanner() {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.4)'; // Poświata z wyższą przezroczystością
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + Math.PI / 4); // Szerszy wycinek (45 stopni)
        ctx.closePath();
        ctx.fill();
    }

    // Funkcja do animacji
    function animateRadar() {
        // Stopniowe czyszczenie canvasu z delikatnym zanikiem poprzednich rysunków
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Delikatne czyszczenie z poświatą
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawRadarGrid(); // Rysowanie siatki
        drawScanner(); // Rysowanie skanera

        angle += 0.015; // Obrót skanera
        if (angle > Math.PI * 2) {
            angle = 0;
        }

        requestAnimationFrame(animateRadar); // Pętla animacji
    }

    animateRadar(); // Uruchomienie animacji
}