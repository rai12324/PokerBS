const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let game = new Game();

// function logDebugState() {
//     console.log("=== GAME STATE ===");
//     console.dir(game.getDebugState(), { depth: null });
//     console.log("==================");
// }

// Debug endpoint in browser
app.get('/debug', (req, res) => {
    res.send(`
        <h1>Game Debug State</h1>
        <pre>${JSON.stringify(game.getDebugState(), null, 2)}</pre>
    `);
});

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Add player to game
    socket.on('join', (name) => {
        const player = game.addPlayer(socket.id, name);
        socket.emit('hand', player.hand);
        io.emit('players', game.getPlayerStatus());
        // logDebugState();
    });

    // Player makes a claim
    socket.on('claim', (combo) => {
        const result = game.makeClaim(socket.id, combo);
        io.emit('claimMade', result);
        // logDebugState();
    });

    // Player calls BS on a claim
    socket.on('callBS', (claimantId) => {
        const result = game.callBS(socket.id, claimantId);
        io.emit('bsResult', result);
        // logDebugState();
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        game.removePlayer(socket.id);
        io.emit('players', game.getPlayerStatus());
    });
});

server.listen(3001, () => {
    console.log('Server listening on port 3001');
    console.log('Debug state available at http://localhost:3001/debug');
});
