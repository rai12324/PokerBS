const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let game = new Game();

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

server.listen(3001, () => {
    console.log('Server listening on port 3001');
});
