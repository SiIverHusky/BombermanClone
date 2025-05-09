const TILE_SIZE = 16; // Size of each tile in pixels
const TILE_EMPTY = 0; // Represents an empty tile
const TILE_BOMB = 4; // Represents a bomb tile

// Store active bombs
const bombs = [];

// Function to place a bomb
function placeBomb(roomCode, bombData, gameState, io) {
    const { username, tile, range } = bombData;
    const { row, col } = tile;

    // Add the bomb to the bombs array
    const bomb = {
        row,
        col,
        range,
        playerUsername: username
    };
    bombs.push(bomb);

    // Mark the tile as a bomb in the tilemap
    gameState.tilemap[row][col] = TILE_BOMB;

    // Broadcast the updated tilemap and bombs to all clients
    io.to(roomCode).emit("updateTilemap", { tilemap: gameState.tilemap });
    io.to(roomCode).emit("updateBombs", { bombs });

    console.log(`Bomb placed by player ${username} at (${row}, ${col}).`);
}

// Function to remove the earliest placed bomb
function popBomb(roomCode, gameState, io) {
    if (bombs.length > 0) {
        const bomb = bombs.shift(); // Remove the earliest placed bomb

        // Clear the bomb tile from the tilemap
        gameState.tilemap[bomb.row][bomb.col] = TILE_EMPTY;

        // Sync the updated tilemap and bombs with all clients
        io.to(roomCode).emit("updateTilemap", { tilemap: gameState.tilemap });
        io.to(roomCode).emit("updateBombs", { bombs });

        console.log(`Bomb at (${bomb.row}, ${bomb.col}) removed.`);
    } else {
        console.log("No bombs to remove.");
    }
}

module.exports = {
    placeBomb,
    popBomb
};