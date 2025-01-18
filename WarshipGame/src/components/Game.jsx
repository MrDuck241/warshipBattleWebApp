import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import "../components_styles/Game.css";

// Main game component
const Game = () => {
    // State hooks for game data
  const [opponentName, setOpponentName] = useState("Opponent");
  const [playerName, setPlayerName] = useState("You");
  const [sessionName, setSessionName] = useState("");
  const [playerIDKey, setPlayerIDKey] = useState("");
  const [playerSessionIDKey, setPlayerSessionIDKey] = useState("");

  const [hitPositions, setHitPositions] = useState([]);
  const [missedPositions, setMissedPositions] = useState([]);
  const [attackEnable, setAttackEnable] = useState(false);

  const [ships, setShips] = useState({
    ship3x1: { placed: 0, positions: [] },
    ship2x1_1: { placed: 0, positions: [] },
    ship2x1_2: { placed: 0, positions: [] },
  });  
  const [placedShipsNum, setPlacedShipNum] = useState(0);

  const [playerMapHoveredBlock, setPlayerMapHoveredBlock] = useState(null);
  const [opponentMapHoveredBlock, setOpponentMapHoveredBlock] = useState(null);
  
  const [showEndGamePopup, setShowEndGamePopup] = useState(false);
  const [endGameInfo, setEndGameInfo] = useState(null);

  const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const serverConnRef = useRef(null);

  const navigate = useNavigate();

  //Server conn received message handlers
  const attackMsgHandler = () => {
    setAttackEnable(true);
    alert("Weapon is ready, fire!");
  }

  const youAreHittedMsgHandler = () => {
    alert("You have been hitted");
  }

  const goodShootMsgHandler = (receivedData) => {
    alert("You took good shoot, enemy is hitted");

    setHitPositions((prev) => {
      const cord = { x: receivedData.cords.x, y: receivedData.cords.y };

      const updated = [...prev, cord];
      return updated;
    });
  }

  const missedShootMsgHandler = (receivedData) => {
    alert("Your shoot missed enemy ship");

    setMissedPositions((prev) => {
      const cord = { x: receivedData.cords.x, y: receivedData.cords.y };

      const updated = [...prev, cord];
      return updated;
    });
  }

  const endOfGameMsgHandler = (receivedData) => {
    setEndGameInfo({
      winner: receivedData.info.winner,
      loser: receivedData.info.loser,
      playerLeftShipsLives: receivedData.info.playerLeftShipsLives,
      opponentLeftShipsLives: receivedData.info.opponentLeftShipsLives,
      playerGoodShots: receivedData.info.playerGoodShots
    });
    setShowEndGamePopup(true);
  }

  const exitGame = () => {
    navigate("/");
  }

  useEffect(() => {
    // Load player data from localStorage or set default values
    const playerName_ = localStorage.getItem("playerNickname") || "You";
    const sessionName_ = localStorage.getItem("sessionName") || "SessionNotFound";
    const playerIDKey_ = localStorage.getItem("playerIDKey") || "KeyNotFoundInStorage";
    const playerSessionIDKey_ = localStorage.getItem("sessionIDKey") || "SessionKeyNotFoundInStorage";

    setPlayerName(playerName_);
    setPlayerIDKey(playerIDKey_);
    setSessionName(sessionName_);
    setPlayerSessionIDKey(playerSessionIDKey_);

    // Create WebSocket connection
    const serverConn = new WebSocket(serverUrl);
    serverConnRef.current = serverConn;

    // Sending message to get opponent's nickname when the WebSocket opens
    const GetOpponentNicknameMsg = {
        action: "GetOpponentNickname",
        playerNickname: playerName_,
        PlayerIDKey: playerIDKey_,
        sessionName: sessionName_
    };

    serverConnRef.current.onopen = () => {
      serverConnRef.current.send(JSON.stringify(GetOpponentNicknameMsg))
    }

    // WebSocket onmessage handler to process incoming data
    serverConnRef.current.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
    
      switch (receivedData.action) {
        case "SendingOpponentNick": setOpponentName(receivedData.opponent); break;
        case "Attack": attackMsgHandler(); break;
        case "YouAreHit": youAreHittedMsgHandler(); break;
        case "GoodShoot": goodShootMsgHandler(receivedData); break;
        case "MissedShot": missedShootMsgHandler(receivedData); break;
        case "EndOfGame": endOfGameMsgHandler(receivedData); break;
        default: alert(`Unhandled action: ${receivedData.action}`);
      }
    };
    
    alert("Place your ships on map");

    return () => {
      if (serverConnRef.current) {
        serverConnRef.current.close();
        serverConnRef.current = null;
        console.log("WebSocket connection closed");
      }
    };

  }, []); // Empty dependency array to run this effect only once

  // Function to check if ship block to place is next to another ship block with same color
  const isAdjacent = (x, y, positions) => {
    return positions.some((pos) => {
      const isHorizontalAdjacent = pos.x === x && (pos.y === y - 1 || pos.y === y + 1);
      const isVerticalAdjacent = pos.y === y && (pos.x === x - 1 || pos.x === x + 1);
      return isHorizontalAdjacent || isVerticalAdjacent;
    });
  };

  // Function for handling player block click to place ships
  const handlePlayerBlockClick = (x, y, reserved) => {
    if (!reserved && placedShipsNum < 7) {
      setShips((prevShips) => {
        const newShips = { ...prevShips };

        if (newShips.ship3x1.placed < 3) {
          if (
            newShips.ship3x1.placed === 0 ||
            isAdjacent(x, y, newShips.ship3x1.positions)
          ) {
            newShips.ship3x1.positions.push({ x, y });
            newShips.ship3x1.placed++;
          } else {
            alert("Blok musi być obok istniejącego bloku tego statku!");
            return prevShips;
          }
        } else if (newShips.ship2x1_1.placed < 2) {
          if (
            newShips.ship2x1_1.placed === 0 ||
            isAdjacent(x, y, newShips.ship2x1_1.positions)
          ) {
            newShips.ship2x1_1.positions.push({ x, y });
            newShips.ship2x1_1.placed++;
          } else {
            alert("Blok musi być obok istniejącego bloku tego statku!");
            return prevShips;
          }
        } else if (newShips.ship2x1_2.placed < 2) {
          if (
            newShips.ship2x1_2.placed === 0 ||
            isAdjacent(x, y, newShips.ship2x1_2.positions)
          ) {
            newShips.ship2x1_2.positions.push({ x, y });
            newShips.ship2x1_2.placed++;
          } else {
            alert("Blok musi być obok istniejącego bloku tego statku!");
            return prevShips;
          }
        } else {
          return prevShips;
        }

        const newPlacedShipsNum = placedShipsNum + 1;
        setPlacedShipNum(newPlacedShipsNum);

        if (newPlacedShipsNum === 7) {
          // Sending positions to server where all ships are placed
          const SavePositionsMsg = {
            action: "SaveShipsPositions",
            playerNickname: playerName,
            playerIDKey: playerIDKey,
            sessionName: sessionName,
            playerSessionIDKey: playerSessionIDKey,
            ships: {
              ship3x1: newShips.ship3x1.positions,
              ship2x1_1: newShips.ship2x1_1.positions,
              ship2x1_2: newShips.ship2x1_2.positions,
            },
            positions: [
              ...newShips.ship3x1.positions,
              ...newShips.ship2x1_1.positions,
              ...newShips.ship2x1_2.positions,
            ],
          };

          // Sedning positions to server via WebSocket
          if (serverConnRef.current && serverConnRef.current.readyState === WebSocket.OPEN) {
            serverConnRef.current.send(JSON.stringify(SavePositionsMsg));
          } else {
            console.error("WebSocket is not open");
          }
        }
        return newShips;
      });
    }
  };
  
  // Function to handle mouse hover on player map block
  const handlePlayerMouseEnter = (x, y, reserved) => {
    if (!reserved) {
        setPlayerMapHoveredBlock({ x, y });
    }
  };  
  
  // Function to handle mouse leave from player map block
  const handlePlayerMouseLeave = () => {
    setPlayerMapHoveredBlock(null);
  };

  // Function to render the player's map with blocks
  const renderPlayerMap = (mapId) => {
    const blocks = [];
    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const isReserved = col === 0 || row === 0;

      const isHovered =
      playerMapHoveredBlock &&
      playerMapHoveredBlock.x === col &&
      playerMapHoveredBlock.y === row;   

      const getBlockColor = (x, y) => {
        if (ships.ship3x1.positions.some(pos => pos.x === x && pos.y === y)) {
          return "orange";
        }
        if (ships.ship2x1_1.positions.some(pos => pos.x === x && pos.y === y)) {
          return "pink";
        }
        if (ships.ship2x1_2.positions.some(pos => pos.x === x && pos.y === y)) {
          return "white";
        }
        return "grey";
      };

      const blockStyle = {
        backgroundColor: isReserved
          ? "bisque"
          : getBlockColor(col, row),
        color: "black",
      };  

      blocks.push(
        <div
          key={`${col}-${row}-${mapId}`}
          className="block"
          style={blockStyle}
          data-x={col}
          data-y={row}
          onMouseEnter={() => handlePlayerMouseEnter(col, row, isReserved)}
          onMouseLeave={handlePlayerMouseLeave}
          onClick={() => handlePlayerBlockClick(col, row, isReserved)}
        >
          {col === 0 && row > 0 ? LETTERS[row - 1] : row === 0 && col > 0 ? col : ""}
        </div>
      );
    }

    return (
      <div className="flex flex-col w-[40%] mt-[30px]">
        <div className="player_name_holder text-green-700">{ playerName }</div>
        <div className="map">{ blocks }</div>
      </div>
    );
}

const handleOpponentMouseEnter = (x, y, reserved) => {
    if (!reserved && attackEnable) {
      setOpponentMapHoveredBlock({ x, y });
    }
  };  
  
  const handleOpponentMouseLeave = () => {
    setOpponentMapHoveredBlock(null);
  };

  const handleOpponentMapClick = (x, y, reserved) => {
    if (!reserved && attackEnable) {
      const firePosition = { x, y };
      setAttackEnable(false);
  
      const checkShotMsg = {
        action: "CheckShot",
        sessionName: sessionName,
        playerSessionIDKey: playerSessionIDKey,
        playerNickname: playerName,
        playerIDKey: playerIDKey,
        placeToCheck: firePosition,
      };
  
      if (serverConnRef.current && serverConnRef.current.readyState === WebSocket.OPEN) {
        serverConnRef.current.send(JSON.stringify(checkShotMsg));
      } else {
        console.error("WebSocket is not open, cannot send message.");
      }
    }
  };
  

const renderOpponentMap = (mapId) => {
    const blocks = [];
    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const isReserved = col === 0 || row === 0;

      const isHovered =
      opponentMapHoveredBlock &&
      opponentMapHoveredBlock.x === col &&
      opponentMapHoveredBlock.y === row; 

      const isHit = hitPositions.some((pos) => pos && pos.x === col && pos.y === row);
      const isMissed = missedPositions.some((pos) => pos && pos.x === col && pos.y === row);

      const blockStyle = {
        backgroundColor: isReserved
          ? "bisque"
          : isHovered ? "lightgreen" : "grey",
          backgroundImage: isHit
          ? "url('assets/boom.png')"
          : isMissed ? "url('assets/target.png')" : "none",
        color: "black",
      };      

      blocks.push(
        <div
          key={`${col}-${row}-${mapId}`}
          className="block"
          style={blockStyle}
          data-x={col}
          data-y={row}
          onMouseEnter={() => handleOpponentMouseEnter(col, row, isReserved)}
          onMouseLeave={ handleOpponentMouseLeave }
          onClick={() => handleOpponentMapClick(col, row, isReserved)}
        >
          {col === 0 && row > 0 ? LETTERS[row - 1] : row === 0 && col > 0 ? col : ""}
        </div>
      );
    }

    return (
      <div className="flex flex-col w-[40%] mt-[30px]">
        <div className="player_name_holder text-red-700">{ opponentName }</div>
        <div className="map">{ blocks }</div>
      </div>
    );
  }

  const renderBackgroundBlur = () => {
    return (
      <div className="blur"></div>
    )
  }

  const renderEndGamePopup = () => {
    return (
      <div className="endGamePopup">
        <span className="text-3xl font-semibold text-rose-900 mt-[10px]">The game is over</span>
        <span className="text-2xl font-semibold text-blue-700 mt-[10px]">Battle report</span>
        <div className="gameInfo mt-[10px]">
          <span className="reportInfoLine">Your warship officer: {playerName}</span>
          <span className="reportInfoLine">Your opponent warship officer: {opponentName}</span>
          <span className="reportInfoLine">Winner: {endGameInfo.winner}</span>
          <span className="reportInfoLine">Loser: {endGameInfo.loser}</span>
          <span className="reportInfoLine">Your left lives: {endGameInfo.playerLeftShipsLives}</span>
          <span className="reportInfoLine">Opponent left lives: {endGameInfo.opponentLeftShipsLives}</span>
          <span className="reportInfoLine">Your precise shoot: {endGameInfo.playerGoodShots}</span>
        </div>
        <button type = "button" className="closeGameBtn" onClick={exitGame}>Close raport</button>
      </div>
    )
  }

  // What Game compoent returns ->
  return (
    <div className="game">
        {showEndGamePopup ? renderBackgroundBlur() : null}
        {showEndGamePopup ? renderEndGamePopup() : null}
        <div id="plansze">
            {renderPlayerMap("yourMap")}
            {renderOpponentMap("opponentMap")}
        </div>
    </div>
  );
};

export default Game;
