import React, { useEffect, useState } from 'react';

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
            setLastClaimHistory(prev => [...prev, c]); // append to history
            alert(`Player made claim: ${c.combo}`);
        });

        socket.on('bsResult', (r) => {
            alert(`BS result: player ${r.loserId} got extra card!`);
            
            // Update hands locally
            const newHands = {};
            r.hands.forEach(h => {
                newHands[h.id] = h.hand;
            });

            // Update the hand if it's your own
            if (newHands[socket.id]) setHand(newHands[socket.id]);

            if (r.playerStatus) setPlayers(r.playerStatus);

            // Reset claim log for new round
            setLastClaimHistory([]);
        });

        // Receive username after joining
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
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {/* Top Bar */}
            <div style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                Logged in as: {userName}
            </div>

            {/* Claim input */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    value={claim}
                    onChange={e => setClaim(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Combo claim"
                    style={{ padding: '8px', fontSize: '16px', width: '600px' }}
                />
                <button onClick={makeClaim} style={{ padding: '8px 16px', marginLeft: '10px', fontSize: '16px' }}>
                    Make Claim
                </button>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Hand */}
                <div style={{ border: '1px solid #ccc', padding: '10px', width: '150px', minHeight: '200px' }}>
                    <h4>Your Hand</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {hand.map(c => <li key={c.rank + c.suit} style={{ marginBottom: '5px' }}>{c.rank}{c.suit}</li>)}
                    </ul>
                </div>

                {/* Players */}
                <div style={{ border: '1px solid #ccc', padding: '10px', width: '200px', minHeight: '200px' }}>
                    <h4>Players</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {players.map(p =>
                            <li key={p.id} style={{ marginBottom: '8px' }}>
                                {p.name} ({p.cards} cards)
                                <button onClick={() => callBS(p.id)} style={{ marginLeft: '5px' }}>Call BS</button>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Claim Log */}
                <div
                    style={{
                        border: '2px solid #333',
                        padding: '10px',
                        flexGrow: 1,
                        minHeight: '200px',
                        maxHeight: '400px',
                        backgroundColor: '#f9f9f9',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}
                >
                    <h4>Claim Log</h4>
                    {lastClaimHistory.length > 0 ? (
                        lastClaimHistory.map((c, idx) => (
                            <div
                                key={idx}
                                style={{
                                    border: '1px solid #ccc',
                                    borderRadius: '6px',
                                    padding: '8px',
                                    backgroundColor: '#fff',
                                    fontSize: '14px'
                                }}
                            >
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
