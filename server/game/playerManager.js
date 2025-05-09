const TILE_SIZE = 16;

// Function to add a new player
function addPlayer(playerStates, player, playerKey) {
    const startPositions = {
        player1: { row: 0, col: 0 }, // Top-left corner for Player 1
        player2: { row: 10, col: 12 } // Bottom-right corner for Player 2
    };

    const startPosition = startPositions[playerKey];

    // Convert tile coordinates to pixel coordinates
    const x = startPosition.col * TILE_SIZE;
    const y = startPosition.row * TILE_SIZE;

    // Add the player to the playerStates object
    playerStates[playerKey] = {
        id: player.id,
        x: x,
        y: y,
        width: TILE_SIZE * 4, // Adjusted for scaling
        height: TILE_SIZE * 6, // Adjusted for scaling
        speed: 0.5 * 4, // Adjusted for scaling
        color: playerKey === "player1" ? "red" : "blue",
        isDead: false,
        maxBombs: 3,
        bombRange: 3,
        coins: 0,
        collisionPoint: { x: x + (TILE_SIZE * 4) / 2, y: y + TILE_SIZE * 6 }
    };

    console.log(`${playerKey} added at (${x}, ${y})`);
}

// Function to remove a player
function removePlayer(playerStates, playerId) {
    delete playerStates[playerId];
}

// Function to process player movement
function processPlayerMove(state, playerId, direction, speed) {
    const player = state.players[playerId];
    if (!player || player.isDead) return false; // Return false if movement is invalid

    const newX = player.x + direction.x * speed;
    const newY = player.y + direction.y * speed;

    const collisionX = newX + player.width / 2;
    const collisionY = newY + player.height;

    let moved = false;

    // Check horizontal movement
    if (
        isTileWalkable(state.tilemap, collisionX, player.y + player.height) &&
        !isCollidingWithArena(collisionX, player.y + player.height)
    ) {
        player.x = newX;
        moved = true;
    }

    // Check vertical movement
    if (
        isTileWalkable(state.tilemap, player.x + player.width / 2, collisionY) &&
        !isCollidingWithArena(player.x + player.width / 2, collisionY)
    ) {
        player.y = newY;
        moved = true;
    }

    // Update collision point
    player.collisionPoint = {
        x: player.x + player.width / 2,
        y: player.y + player.height
    };

    if (moved) {
        console.log(`Player ${playerId} moved to (${player.x}, ${player.y})`);
    }

    return moved; // Return true if the player moved
}

// Utility function to convert pixel coordinates to tile coordinates
function pixelToTile(x, y) {
    return {
        row: Math.floor(y / TILE_SIZE),
        col: Math.floor(x / TILE_SIZE)
    };
}

// Function to check if a tile is walkable
function isTileWalkable(tilemap, x, y) {
    const { row, col } = pixelToTile(x, y);

    if (row < 0 || row >= TILE_ROWS || col < 0 || col >= TILE_COLS) {
        return false; // Out of bounds
    }

    const tile = tilemap[row][col];
    return tile === TILE_EMPTY || tile === TILE_PICKUP;
}

// Function to check if the player is colliding with the arena boundaries
function isCollidingWithArena(x, y) {
    return (
        x < arenaBounds.x ||
        x > arenaBounds.x + arenaBounds.width ||
        y < arenaBounds.y ||
        y > arenaBounds.y + arenaBounds.height
    );
}

module.exports = {
    addPlayer,
    removePlayer,
    processPlayerMove
};