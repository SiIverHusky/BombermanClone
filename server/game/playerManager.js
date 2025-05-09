const TILE_SIZE = 16;

// Function to add a new player
function addPlayer(playerStates, player) {
    const startPositions = [
        { row: 0, col: 0 },
        { row: 10, col: 12 }
    ];
    const startPosition = startPositions[Object.keys(playerStates).length % 2];

    const x = startPosition.col * TILE_SIZE * 4 + 40;
    const y = startPosition.row * TILE_SIZE * 4 + 60;

    playerStates[player.id] = {
        id: player.id,
        x: x,
        y: y,
        width: TILE_SIZE * 4,
        height: TILE_SIZE * 6,
        speed: 0.5 * 4,
        color: Object.keys(playerStates).length === 0 ? "red" : "blue",
        isDead: false,
        maxBombs: 3,
        bombRange: 3,
        coins: 0,
        collisionPoint: { x: x + (TILE_SIZE * 4) / 2, y: y + TILE_SIZE * 6 }
    };
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

// Function to process bomb placement
function processPlaceBomb(state, playerId) {
    const player = state.players[playerId];
    if (!player || player.maxBombs <= 0) return;

    const { x, y } = player.collisionPoint;
    const { row, col } = pixelToTile(x, y);

    if (state.tilemap[row][col] === TILE_EMPTY) {
        state.tilemap[row][col] = TILE_BOMB;
        state.bombs.push({
            row,
            col,
            timer: Date.now() + 3000,
            range: player.bombRange
        });

        player.maxBombs--;
    }
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
    processPlayerMove,
    processPlaceBomb
};