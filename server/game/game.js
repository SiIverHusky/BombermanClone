function initializeGameState() {
    return {
        players: {}, // Player positions and states
        bombs: [],   // Active bombs
        tilemap: []  // Tilemap state
    };
}

function updateGameState(gameState, action) {
    const { type, playerId, data } = action;

    switch (type) {
        case 'move':
            // Update player position
            if (gameState.players[playerId]) {
                gameState.players[playerId].x = data.x;
                gameState.players[playerId].y = data.y;
            }
            break;

        case 'placeBomb':
            // Add a bomb to the game state
            gameState.bombs.push({
                x: data.x,
                y: data.y,
                placedAt: Date.now()
            });
            break;

        default:
            console.error('Unknown action type:', type);
    }

    return gameState;
}

module.exports = { initializeGameState, updateGameState };