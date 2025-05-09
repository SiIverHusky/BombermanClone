const TILE_EMPTY = 0;
const TILE_BOMB = 4; // Define the tile type for bombs

// Store active bombs and explosions
const bombs = [];
const explosions = [];

// Function to place a bomb
function placeBomb(roomCode, bombData, gameState, io) {
    const { row, col, playerId } = bombData;

    // Determine which player placed the bomb
    const player = gameState.players.player1.id === playerId
        ? gameState.players.player1
        : gameState.players.player2;

    if (!player || player.maxBombs <= 0) {
        console.log(`Player ${playerId} has no bombs available.`);
        return;
    }

    // Check if the tile is already occupied
    if (gameState.tilemap[row][col] !== TILE_EMPTY) {
        console.log(`Cannot place a bomb on a non-empty tile at (${row}, ${col}).`);
        return;
    }

    // Add the bomb to the bombs array
    const bomb = {
        row,
        col,
        timeToExplode: Date.now() + 3000, // 3 seconds until explosion
        range: player.bombRange,
        playerId
    };
    bombs.push(bomb);

    // Mark the tile as unwalkable (TILE_BOMB)
    gameState.tilemap[row][col] = TILE_BOMB;

    // Decrease the player's available bombs
    player.maxBombs--;

    // Check if the player is on the bomb's tile
    const playerTile = pixelToTile(player.x + player.width / 2, player.y + player.height);
    if (playerTile.row === row && playerTile.col === col) {
        console.log(`Player ${playerId} is on the bomb's tile. Pushing to the closest walkable tile...`);
        pushPlayerToClosestWalkableTile(player, gameState.tilemap);
    }

    // Broadcast the updated tilemap and bombs to all clients
    io.to(roomCode).emit("updateTilemap", { tilemap: gameState.tilemap });
    io.to(roomCode).emit("updateBombs", { bombs });

    console.log(`Bomb placed by player ${playerId} at (${row}, ${col}).`);
}

// Function to handle bomb explosions
function handleBombExplosions(roomCode, gameState, io) {
    const now = Date.now();

    bombs.forEach((bomb, index) => {
        if (now >= bomb.timeToExplode) {
            console.log(`Bomb at (${bomb.row}, ${bomb.col}) exploded!`);

            // Calculate explosion tiles
            const explosionTiles = calculateExplosionTiles(bomb, gameState.tilemap);

            // Add the explosion to the explosions array
            explosions.push({
                tiles: explosionTiles,
                expiresAt: now + 500 // Explosion lasts 500ms
            });

            // Remove the bomb from the bombs array
            bombs.splice(index, 1);

            // Broadcast the explosion to all clients
            io.to(roomCode).emit("updateExplosions", { explosions });

            // Restore the player's bomb capacity
            const player = gameState.players[bomb.playerId];
            if (player) {
                player.maxBombs++;
            }
        }
    });
}

// Function to calculate explosion tiles
function calculateExplosionTiles(bomb, tilemap) {
    const explosionTiles = [];

    // Add the bomb's tile as the center of the explosion
    explosionTiles.push({ row: bomb.row, col: bomb.col });

    // Calculate explosion tiles in each cardinal direction
    const directions = [
        { row: -1, col: 0 }, // Up
        { row: 1, col: 0 },  // Down
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 }   // Right
    ];

    directions.forEach(direction => {
        for (let i = 1; i <= bomb.range; i++) {
            const newRow = bomb.row + direction.row * i;
            const newCol = bomb.col + direction.col * i;

            // Stop if the explosion hits a non-empty tile (e.g., walls or blocks)
            if (!tilemap[newRow] || tilemap[newRow][newCol] !== TILE_EMPTY) {
                break;
            }

            explosionTiles.push({ row: newRow, col: newCol });
        }
    });

    return explosionTiles;
}

// Function to update bombs and explosions periodically
function updateBombManager(roomCode, gameState, io) {
    handleBombExplosions(roomCode, gameState, io);

    // Remove expired explosions
    const now = Date.now();
    explosions.forEach((explosion, index) => {
        if (now >= explosion.expiresAt) {
            explosions.splice(index, 1);
        }
    });
}

// Function to push the player to the closest walkable tile
function pushPlayerToClosestWalkableTile(player, tilemap) {
    const { row, col } = pixelToTile(player.x + player.width / 2, player.y + player.height);

    // Define directions to check (up, down, left, right)
    const directions = [
        { row: -1, col: 0 }, // Up
        { row: 1, col: 0 },  // Down
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 }   // Right
    ];

    for (const direction of directions) {
        const newRow = row + direction.row;
        const newCol = col + direction.col;

        // Check if the new tile is walkable
        if (tilemap[newRow] && tilemap[newRow][newCol] === TILE_EMPTY) {
            // Move the player to the new tile
            const { x, y } = tileToPixel(newRow, newCol);
            player.x = x + TILE_SIZE / 2 - player.width / 2;
            player.y = y + TILE_SIZE - player.height;
            player.collisionPoint = {
                x: player.x + player.width / 2,
                y: player.y + player.height
            };
            console.log(`Player moved to walkable tile at (${newRow}, ${newCol}).`);
            return;
        }
    }

    console.log("No walkable tile found nearby. Player remains in place.");
}

// Utility function to convert pixel coordinates to tile coordinates
function pixelToTile(x, y) {
    return {
        row: Math.floor(y / TILE_SIZE),
        col: Math.floor(x / TILE_SIZE)
    };
}

// Utility function to convert tile coordinates to pixel coordinates
function tileToPixel(row, col) {
    return {
        x: col * TILE_SIZE,
        y: row * TILE_SIZE
    };
}

module.exports = {
    placeBomb,
    updateBombManager
};