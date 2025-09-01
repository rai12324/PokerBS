import React, { useEffect, useState } from 'react';

function Game({ socket }) {
    const [hand, setHand] = useState([]);
    const [players, setPlayers] = useState([]);
    const [claim, setClaim] = useState('');

    useEffect(() => {
        socket.on('hand', (h) => setHand(h));
        socket.on('players', (p) => setPlayers(p));
        socket.on('claimMade', (c) => alert(`Player made claim: ${c.combo}`));
        socket.on('bsResult', (r) => alert(`BS result: player ${r.loserId} drew a card`));
    }, [socket]);

    const makeClaim = () => {
        socket.emit('claim', claim);
    }

    const callBS = (playerId) => {
        socket.emit('callBS', playerId);
    }

    return (
        <div>
            <h3>Your hand:</h3>
            <ul>{hand.map(c=><li key={c.rank+c.suit}>{c.rank}{c.suit}</li>)}</ul>
            <input value={claim} onChange={e=>setClaim(e.target.value)} placeholder="Combo claim"/>
            <button onClick={makeClaim}>Make Claim</button>
            <h3>Players:</h3>
            <ul>
                {players.map(p=><li key={p.name}>{p.name} ({p.cards} cards) <button onClick={()=>callBS(p.id)}>Call BS</button></li>)}
            </ul>
        </div>
    );
}

export default Game;
