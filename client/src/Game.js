import React, { useEffect, useState } from 'react';
import './styles.css';

function Game({ socket }) {
  const [hand, setHand] = useState([]);
  const [players, setPlayers] = useState([]);
  const [claim, setClaim] = useState('');
  const [lastClaimHistory, setLastClaimHistory] = useState([]);
  const [userName, setUserName] = useState('');
  const [isActive, setIsActive] = useState(true); // 👈 track if YOU are active

  useEffect(() => {
    socket.on('hand', (h) => setHand(h));
    socket.on('players', (p) => {
      setPlayers(p);
      // update own active status
      const me = p.find(pl => pl.id === socket.id);
      if (me) setIsActive(me.active);
    });
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
      if (r.playerStatus) {
        setPlayers(r.playerStatus);
        const me = r.playerStatus.find(pl => pl.id === socket.id);
        if (me) setIsActive(me.active);
      }

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
      <div className="top-bar">
        Logged in as: {userName} {isActive ? '' : '(Spectator)'}
      </div>

      {/* Claim input (only for active players) */}
      {isActive && (
        <div className="claim-input">
            <input
            value={claim}
            onChange={e => setClaim(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Combo claim"
            />
            <button onClick={makeClaim}>Make Claim</button>

            {/* One global BS button */}
            {lastClaimHistory.length > 0 && (
            <button
                onClick={() => socket.emit('callBS')}
                style={{ marginLeft: '10px', background: 'red', color: 'white' }}
            >
                Call BS
            </button>
            )}
        </div>
      )}

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
            <li
                key={p.id}
                style={{
                marginBottom: '8px',
                opacity: p.active ? 1 : 0.5
                }}
            >
                {p.name} ({p.cards} cards)
                {!p.active && (
                <span
                    style={{
                    marginLeft: '5px',
                    fontStyle: 'italic',
                    color: '#888'
                    }}
                >
                    Spectator
                </span>
                )}
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