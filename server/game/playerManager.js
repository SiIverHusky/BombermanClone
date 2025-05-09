const TILE_SIZE = 16;

// Function to add a new player
function addPlayer(playerStates, player, username) {
    const startPositions = [
        { row: 0, col: 0, offsetY: -10, color: "red" }, // Top-left corner for the first player
        { row: 10, col: 12, offsetY: -10, color: "blue" } // Bottom-right corner for the second player
    ];

    const existingPlayers = Object.keys(playerStates).length;
    if (existingPlayers >= startPositions.length) {
        console.error("Cannot add more players. Maximum player limit reached.");
        return;
    }

    const startPosition = startPositions[existingPlayers];

    // Convert tile coordinates to pixel coordinates
    const x = startPosition.col * TILE_SIZE;
    const y = startPosition.row * TILE_SIZE + startPosition.offsetY;

    // Add the player to the playerStates object
    playerStates[username] = {
        username: username,
        x: x,
        y: y,
        width: TILE_SIZE * 4, // Adjusted for scaling
        height: TILE_SIZE * 6, // Adjusted for scaling
        speed: 0.5 * 4, // Adjusted for scaling
        color: startPosition.color,
        isDead: false,
        maxBombs: 3,
        bombRange: 3,
        coins: 0,
        collisionPoint: { x: x + (TILE_SIZE * 4) / 2, y: y + TILE_SIZE * 6 }
    };

    console.log(`Player ${username} added at (${x}, ${y})`);
}

// Function to remove a player
function removePlayer(playerStates, username) {
    if (playerStates[username]) {
        delete playerStates[username];
        console.log(`Player ${username} removed.`);
    } else {
        console.error(`Player ${username} not found.`);
    }
}

// Function to process player movement
function processPlayerMove(state, username, direction) {
    const player = state.players[username];
    if (!player || player.isDead) return false; // Return false if movement is invalid

    const speed = player.speed;
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
        console.log(`Player ${username} moved to (${player.x}, ${player.y})`);
    }
    console.log(moved)
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

    if (row < 0 || row >= tilemap.length || col < 0 || col >= tilemap[0].length) {
        return false; // Out of bounds
    }

    const tile = tilemap[row][col];
    return tile === 0 || tile === 3; // TILE_EMPTY or TILE_PICKUP
}

// Function to check if the player is colliding with the arena boundaries
function isCollidingWithArena(x, y) {
    const arenaBounds = { x: 0, y: 0, width: TILE_SIZE * 13, height: TILE_SIZE * 11 };
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