import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GameMenu from './components/GameMenu';
import SearchingOpponent from './components/SearchingOpponent';
import Game from './components/Game';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path = "/" element = {<GameMenu/>} />
        <Route path = "searching_opponent" element = {<SearchingOpponent/>} />
        <Route path = "game" element = {<Game/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
