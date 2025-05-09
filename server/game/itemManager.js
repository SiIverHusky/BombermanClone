const { gameStates } = require('./gameLogic');

// Function to place items randomly inside bricks
function placeItems(gameState) {
    
    gameState.tilemap.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === 2) { // TILE_BRICK
                const random = Math.random();
                if (random < 0.5) {
                    // 50% chance of small coin
                    gameState.items.push({ row: rowIndex, col: colIndex, type: 2 }); // SMALL_COIN
                } else if (random < 0.6) {
                    // 10% chance of big coin
                    gameState.items.push({ row: rowIndex, col: colIndex, type: 3 }); // BIG_COIN
                }
            }
        });
    });
}

// Function to handle item collection by a player
function handleItemCollection(playerId, item) {
    const player = gameState.players[playerId];
    if (!player) return;

    // Check if the item exists in the game state
    const itemIndex = gameState.items.findIndex(
        (i) => i.row === item.row && i.col === item.col && i.type === item.type
    );

    if (itemIndex !== -1) {
        // Apply the item's effect to the player
        if (item.type === 2) {
            // SMALL_COIN
            player.coins += 1;
        } else if (item.type === 3) {
            // BIG_COIN
            player.coins += 5;
        } else if (item.type === 0) {
            // INCREASE_BOMB_RANGE
            if (player.bombRange < 10) player.bombRange++;
        } else if (item.type === 1) {
            // INCREASE_BOMB_COUNT
            if (player.maxBombs < 10) player.maxBombs++;
        }

        // Remove the item from the game state
        gameState.items.splice(itemIndex, 1);

        console.log(`Player ${playerId} collected item:`, item);
    }
}

// Function to broadcast the updated item state to all clients
function broadcastItemState(wsServer) {
    wsServer.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({
                type: 'updateItems',
                items: gameState.items
            }));
        }
    });
}

// Export functions for use in server.js
module.exports = {
    placeItems,
    handleItemCollection,
    broadcastItemState
};