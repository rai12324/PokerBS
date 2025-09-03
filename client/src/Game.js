import React, { useEffect, useState } from 'react';
import './styles.css';

function Game({ socket }) {
  const [hand, setHand] = useState([]);
  const [players, setPlayers] = useState([]);
  const [claim, setClaim] = useState('');
  const [lastClaimHistory, setLastClaimHistory] = useState([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    socket.on('hand', (h) => setHand(h));
    socket.on('players', (p) => setPlayers(p));
    socket.on('claimMade', (c) => {
      setLastClaimHistory(prev => [...prev, c]);
      alert(`Player made claim: ${c.combo}`);
    });

    socket.on('bsResult', (r) => {
      alert(`BS result: player ${r.loserId} got extra card!`);

      const newHands = {};
      r.hands.forEach(h => {
        newHands[h.id] = h.hand;
      });

      if (newHands[socket.id]) setHand(newHands[socket.id]);
      if (r.playerStatus) setPlayers(r.playerStatus);

      setLastClaimHistory([]);
    });

    socket.on('yourName', (name) => setUserName(name));

    return () => {
      socket.off('hand');
      socket.off('players');
      socket.off('claimMade');
      socket.off('bsResult');
      socket.off('yourName');
    };
  }, [socket]);

  const makeClaim = () => {
    if (!claim.trim()) return;
    socket.emit('claim', claim);
    setClaim('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') makeClaim();
  };

  const callBS = (playerId) => {
    socket.emit('callBS', playerId);
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="top-bar">Logged in as: {userName}</div>

      {/* Claim input */}
      <div className="claim-input">
        <input
          value={claim}
          onChange={e => setClaim(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Combo claim"
        />
        <button onClick={makeClaim}>Make Claim</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Hand */}
        <div className="section hand-section">
          <h4>Your Hand</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {hand.map(c => (
              <li key={c.rank + c.suit}>{c.rank}{c.suit}</li>
            ))}
          </ul>
        </div>

        {/* Players */}
        <div className="section players-section">
          <h4>Players</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.map(p => (
              <li key={p.id} style={{ marginBottom: '8px' }}>
                {p.name} ({p.cards} cards)
                <button onClick={() => callBS(p.id)} style={{ marginLeft: '5px' }}>
                  Call BS
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Claim Log */}
        <div className="claim-log">
          <h4>Claim Log</h4>
          {lastClaimHistory.length > 0 ? (
            lastClaimHistory.map((c, idx) => (
              <div key={idx} className="claim-item">
                <strong>{c.claimantName}</strong>: {c.combo}
              </div>
            ))
          ) : (
            <p>No claims yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;
