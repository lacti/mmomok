import Context, { emptyContext } from './models/context';
import { getContext, sendMessage } from './game/gameLoop';
import { useEffect, useState } from 'react';

import Character from "./assets/char.png";
import GoBlack from "./assets/go-b.svg";
import GoWhite from "./assets/go-w.svg";

const renderIntervalMillis = 33;

export default function GameView() {
  const [context, setContext] = useState<Context>(emptyContext());
  
  async function keydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        await sendMessage({type: 'move', dir: 'l'});
        break;
      case 'ArrowRight':
        await sendMessage({type: 'move', dir: 'r'});
        break;
      case 'ArrowUp':
        await sendMessage({type: 'move', dir: 't'});
        break;
      case 'ArrowDown':
        await sendMessage({type: 'move', dir: 'b'});
        break;
      case ' ':
        await sendMessage({type: 'place'});
        break;
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", keydown);
    const timer = setInterval(() => {
      setContext(getContext());
    }, renderIntervalMillis);
    return () => {
      window.removeEventListener("keydown", keydown);
      clearInterval(timer)
    }
  }, [])

  const { lifetime, users, stones, width, height, winner } = context;
  const tileSize = Math.floor(Math.min(600 / width, 600 / height));

  return <div>
    {!winner && 
    (<h2>{lifetime > 0 ? `${lifetime}초 남았습니다.` : `로딩 중입니다.`}</h2>)}
    {winner && 
    (<h2>{winner.color === 'b' ? "흑" : "백"}색이 이겼습니다! {winner.names.join(", ")}</h2>)}
    <table>
      <tbody>
      {Array.from({length: height}, (_, i) => i).map((y) => 
      (<tr key={`row${y}`} style={{height: tileSize + "px"}}>
        {Array.from({length: width}, (_, i) => i).map((x) => 
        (<td key={`row${x}`} style={{width: tileSize + "px", border: "1px solid black"}}>
          <Tile y={y} x={x} stones={stones} users={users} tileSize={tileSize} />
        </td>)
        )}
      </tr>)
      )}
      <tr></tr>
      </tbody>
    </table>
  </div>
}

function Tile({
  stones, users, x, y, tileSize,
}:{ stones: Context['stones']; users: Context['users']; x: number; y: number; tileSize: number; }) {
  const stone = stones.find(s => s.x === x && s.y === y);
  const user = users.find(u => u.x === x && u.y === y);
  return <div style={{position: "relative"}}>
    {stone && (
    <img src={stone.color === 'b' ? GoBlack : GoWhite} alt="go" width={tileSize} height={tileSize} style={{position: "absolute", top: tileSize / 2, left: 0}} />
    )}
    {user && (
    <><img src={Character} alt={user.name} width={tileSize} height={tileSize} style={{position: "absolute", top: tileSize / 2, left: 0}} />
    <span style={{position: "absolute", top: tileSize / 2, left: 0, fontSize: 6}}>{user.name}</span></>
    )}
  </div>
}