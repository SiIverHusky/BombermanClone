const { initializeGameState, updateGameState } = require('./game');

function initializeGameServer(io) {
    let gameState = initializeGameState();

    io.on('connection', (socket) => {
        console.log('A player connected:', socket.id);

        // Send the initial game state to the new player
        socket.emit('gameState', gameState);

        // Handle player movement
        socket.on('playerMove', (data) => {
            gameState = updateGameState(gameState, data);
            io.emit('gameState', gameState); // Broadcast updated state to all players
        });

        // Handle bomb placement
        socket.on('placeBomb', (data) => {
            gameState = updateGameState(gameState, data);
            io.emit('gameState', gameState); // Broadcast updated state to all players
        });

        // Handle player disconnection
        socket.on('disconnect', () => {
            console.log('A player disconnected:', socket.id);
        });
    });
}

module.exports = { initializeGameServer };