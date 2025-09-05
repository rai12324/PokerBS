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

    // Start Game event
    socket.on("startGame", () => {
        console.log("Start game triggered");

        game.redealHands();   // reset deck, deal cards, pick first player
        game.isFirstRound = false;  // after first start, don’t reset again

        // Send hands to each player individually
        game.players.forEach(p => {
        io.to(p.id).emit("hand", p.hand);
        });

        // Send player status
        io.emit("players", game.getPlayerStatus());

        // Send whose turn it is
        io.emit("turn", game.players[game.currentTurnIndex].id);
    });

    // Add player to game
    socket.on('join', (name) => {
        const player = game.addPlayer(socket.id, name);
        socket.emit('hand', player.hand);
        socket.emit('yourName', player.name);
        io.emit('players', game.getPlayerStatus());
    });

    // Player makes a claim
    socket.on('claim', (combo) => {
        const result = game.makeClaim(socket.id, combo);
        io.emit('claimMade', result);
        io.emit('turn', game.getDebugState().currentTurn); // send whose turn it is
    });

    // Player calls BS on a claim
    socket.on('callBS', (claimantId) => {
        const result = game.callBS(socket.id, claimantId);
        io.emit('bsResult', result);
        io.emit('players', game.getPlayerStatus()); // update player info
        io.emit('turn', game.getDebugState().currentTurn);
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
