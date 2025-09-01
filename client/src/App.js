import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Game from './Game';

const socket = io('http://localhost:3001');

function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);

  const joinGame = () => {
    socket.emit('join', name);
    setJoined(true);
  }

  return (
    <div>
      {!joined ? (
        <div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
          <button onClick={joinGame}>Join Game</button>
        </div>
      ) : <Game socket={socket} />}
    </div>
  );
}

export default App;
