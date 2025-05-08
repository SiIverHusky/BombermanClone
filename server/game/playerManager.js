const { gameState, handlePlayerMove, handlePlaceBomb } = require('./gameLogic');

// Function to add a new player
function addPlayer(playerId) {
    // Determine starting position based on the number of players already connected
    const playerCount = Object.keys(gameState.players).length;
    const startPositions = [
        { row: 0, col: 0 },
        { row: 10, col: 12 }
    ];

    // Assign the first player to (0,0) and the second to (10,12)
    const startPosition = startPositions[playerCount % 2];

    // Convert tile coordinates to pixel coordinates
    const startPixel = {
        x: startPosition.col * TILE_SIZE,
        y: startPosition.row * TILE_SIZE
    };

    // Initialize the player's state
    gameState.players[playerId] = {
        id: playerId,
        x: startPixel.x,
        y: startPixel.y,
        width: 16 * 4, // Scaled width
        height: 24 * 4, // Scaled height
        speed: 0.5 * 4, // Scaled speed
        color: getRandomColor(),
        isDead: false,
        maxBombs: 3,
        bombRange: 3,
        coins: 0,
        collision: { row: startPosition.row, col: startPosition.col } // Initial collision tile
    };

    console.log(`Player ${playerId} added at (${startPosition.row}, ${startPosition.col}).`);
}

// Function to remove a player
function removePlayer(playerId) {
    if (gameState.players[playerId]) {
        delete gameState.players[playerId];
        console.log(`Player ${playerId} removed.`);
    }
}

// Function to handle player movement
function processPlayerMove(playerId, newX, newY) {
    if (!gameState.players[playerId]) return;

    // Delegate movement validation to gameLogic.js
    handlePlayerMove(playerId, newX, newY);
}

// Function to handle bomb placement by a player
function processPlaceBomb(playerId) {
    if (!gameState.players[playerId]) return;

    // Delegate bomb placement to gameLogic.js
    handlePlaceBomb(playerId);
}

// Function to broadcast the updated player state to all clients
function broadcastPlayerState(wsServer) {
    const players = gameState.players;

    wsServer.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({
                type: 'updatePlayers',
                players
            }));
        }
    });
}

// Utility function to generate a random color for players
function getRandomColor() {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Export functions for use in server.js
module.exports = {
    addPlayer,
    removePlayer,
    processPlayerMove,
    processPlaceBomb,
    broadcastPlayerState
};