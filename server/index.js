const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let game = new Game();

// ✅ serve static files from /public (debug.html, debug.css, debug.js)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ serve the debug page
app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'debug.html'));
});

// ✅ JSON endpoint for game state (used by debug.js)
app.get('/debug/state', (req, res) => {
    res.json(game.getDebugState());
});

// --- Socket.io setup ---
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Add player to game
    socket.on('join', (name) => {
        const player = game.addPlayer(socket.id, name);
        socket.emit('hand', player.hand);
        io.emit('players', game.getPlayerStatus());
    });

    // Player makes a claim
    socket.on('claim', (combo) => {
        const result = game.makeClaim(socket.id, combo);
        io.emit('claimMade', result);
    });

    // Player calls BS on a claim
    socket.on('callBS', (claimantId) => {
        const result = game.callBS(socket.id, claimantId);
        io.emit('bsResult', result);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        game.removePlayer(socket.id);
        io.emit('players', game.getPlayerStatus());
    });
});

// Start server
server.listen(3001, () => {
    console.log('Server listening on port 3001');
    console.log('Debug state available at http://localhost:3001/debug');
});
