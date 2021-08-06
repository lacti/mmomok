import './App.css';

import GameView from './GameView';
import gameLoop from './game/gameLoop';
import { useState } from 'react';

function App() {
  const [memberId, setMemberId] = useState<string>('');
  const [gameId, setGameId] = useState<string>('test');
  const [start, setStart] = useState<boolean>(false);

  function gameStart() {
    if (!memberId) {
      alert("MEMBER를 입력하세요");
      return;
    }
    if (!gameId) {
      alert("GAME ID를 입력하세요");
      return;
    }
    gameLoop({memberId, gameId});
    setStart(true);
  }
  
  return (
    <div className="App">
      {!start && <header className="App-header">
        <dl>
          <dt>MEMBER</dt><dd><input type="text" value={memberId} onChange={event => setMemberId(event.target.value)} /></dd>
          <dt>GAME ID</dt><dd><input type="text" value={gameId} onChange={event => setGameId(event.target.value)} /></dd>
        </dl>
        <button
          className="App-link"
          onClick={gameStart}
        >
          Start
        </button>
      </header>}
      {start && <GameView />}
    </div>
  );
}

export default App;
