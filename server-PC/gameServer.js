const { initializeGameState, updateGameState } = require('./gameLogic');
const { addPlayer, removePlayer } = require('./playerManager');

const activeGames = new Map();

function setupGameWebSocket(io) {
    io.on('connection', (socket) => {
        const { roomCode, username } = socket.handshake.query;

        if (!roomCode || !username) {
            socket.emit('error', { message: 'Missing roomCode or username' });
            socket.disconnect();
            return;
        }

        if (!activeGames.has(roomCode)) {
            const gameState = initializeGameState(roomCode);
            activeGames.set(roomCode, gameState);
        }

        const gameState = activeGames.get(roomCode);
        addPlayer(gameState, username, { row: 0, col: 0, color: 'red' });

        socket.join(roomCode);
        console.log(`${username} joined room ${roomCode}`);

        socket.emit('initialize', { players: gameState.players, tilemap: gameState.tilemap });

        socket.on('playerMove', (data) => {
            updateGameState(roomCode, 'playerMove', data);
            io.to(roomCode).emit('updatePlayers', { players: gameState.players });
        });

        socket.on('placeBomb', (data) => {
            updateGameState(roomCode, 'placeBomb', data);
            io.to(roomCode).emit('updateBombs', { bombs: gameState.bombs });
        });

        socket.on('disconnect', () => {
            removePlayer(gameState, username);
            io.to(roomCode).emit('updatePlayers', { players: gameState.players });
            console.log(`${username} disconnected from room ${roomCode}`);
        });
    });
}

module.exports = { setupGameWebSocket };