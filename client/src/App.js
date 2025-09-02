import React, { useState } from 'react';
import io from 'socket.io-client';
import Game from './Game';

const socket = io('http://localhost:3001');

function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);

  const joinGame = () => {
    if (!name.trim()) return; // prevent empty names
    socket.emit('join', name);
    setJoined(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      joinGame();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      {!joined ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder="Enter your name" 
            style={{ padding: '10px', fontSize: '16px', width: '200px' }}
          />
          <button onClick={joinGame} style={{ padding: '10px 20px', fontSize: '16px' }}>Join Game</button>
        </div>
      ) : (
        <Game socket={socket} />
      )}
    </div>
  );
}

export default App;
