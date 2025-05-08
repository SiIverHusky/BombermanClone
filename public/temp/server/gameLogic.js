const TILE_EMPTY = 0;
const TILE_BLOCK = 1; // Indestructible blocks
const TILE_BRICK = 2; // Destructible bricks
const TILE_PICKUP = 3; // Items
const TILE_BOMB = 4; // Bombs

// Game state
const gameState = {
    tilemap: Array.from({ length: 11 }, () => Array(13).fill(TILE_EMPTY)), // 11x13 grid
    players: {}, // Player states
    items: [], // Items on the map
    bombs: [] // Active bombs
};

// Function to initialize the game state
function initializeGame() {
    // Place indestructible blocks and bricks
    for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 13; col++) {
            if (Math.random() < 0.1) {
                gameState.tilemap[row][col] = TILE_BLOCK; // 10% chance of block
            } else if (Math.random() < 0.2) {
                gameState.tilemap[row][col] = TILE_BRICK; // 20% chance of brick
            }
        }
    }

    // Place items inside bricks
    placeItems();
}

// Function to place items randomly inside bricks
function placeItems() {
    gameState.tilemap.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === TILE_BRICK) {
                const random = Math.random();
                if (random < 0.5) {
                    // 50% chance of small coin
                    gameState.items.push({ row: rowIndex, col: colIndex, type: 2 });
                } else if (random < 0.6) {
                    // 10% chance of big coin
                    gameState.items.push({ row: rowIndex, col: colIndex, type: 3 });
                }
            }
        });
    });
}

// Function to handle player movement
function handlePlayerMove(playerId, newX, newY) {
    const player = gameState.players[playerId];
    if (!player) return;

    const { row, col } = pixelToTile(newX + player.width / 2, newY + player.height);

    // Check if the new position is walkable
    if (isTileWalkable(row, col)) {
        player.x = newX;
        player.y = newY;
        player.collision = { row, col };
    }
}

// Function to handle bomb placement
function handlePlaceBomb(playerId) {
    const player = gameState.players[playerId];
    if (!player || player.maxBombs <= 0) return;

    const { row, col } = player.collision;

    // Check if the tile is empty
    if (gameState.tilemap[row][col] === TILE_EMPTY) {
        // Place the bomb
        gameState.tilemap[row][col] = TILE_BOMB;
        gameState.bombs.push({
            row,
            col,
            timer: Date.now() + 3000, // Bomb explodes after 3 seconds
            range: player.bombRange
        });

        // Decrease the player's available bombs
        player.maxBombs--;
    }
}

// Function to handle bomb explosions
function handleBombExplosions() {
    const now = Date.now();

    gameState.bombs = gameState.bombs.filter(bomb => {
        if (now >= bomb.timer) {
            explodeBomb(bomb);
            return false; // Remove the bomb after it explodes
        }
        return true;
    });
}

// Function to handle a bomb explosion
function explodeBomb(bomb) {
    const directions = [
        { dRow: -1, dCol: 0 }, // Up
        { dRow: 1, dCol: 0 },  // Down
        { dRow: 0, dCol: -1 }, // Left
        { dRow: 0, dCol: 1 }   // Right
    ];

    // Clear the bomb tile
    gameState.tilemap[bomb.row][bomb.col] = TILE_EMPTY;

    // Check all directions for explosion range
    directions.forEach(({ dRow, dCol }) => {
        for (let i = 1; i <= bomb.range; i++) {
            const newRow = bomb.row + dRow * i;
            const newCol = bomb.col + dCol * i;

            // Stop if out of bounds
            if (newRow < 0 || newRow >= 11 || newCol < 0 || newCol >= 13) break;

            const tile = gameState.tilemap[newRow][newCol];

            if (tile === TILE_BLOCK) {
                // Stop at indestructible block
                break;
            } else if (tile === TILE_BRICK) {
                // Break the brick and stop the explosion
                gameState.tilemap[newRow][newCol] = TILE_EMPTY;

                // Remove any item inside the brick
                gameState.items = gameState.items.filter(item => !(item.row === newRow && item.col === newCol));
                break;
            } else {
                // Continue the explosion
                // Notify players if they are hit
                Object.values(gameState.players).forEach(player => {
                    if (player.collision.row === newRow && player.collision.col === newCol) {
                        player.isDead = true;
                    }
                });
            }
        }
    });
}

// Function to check if a tile is walkable
function isTileWalkable(row, col) {
    const tile = gameState.tilemap[row][col];
    return tile === TILE_EMPTY || tile === TILE_PICKUP;
}

// Utility function to convert pixel coordinates to tile coordinates
function pixelToTile(x, y) {
    return {
        row: Math.floor(y / TILE_SIZE),
        col: Math.floor(x / TILE_SIZE)
    };
}

// Export functions for use in server.js
module.exports = {
    gameState,
    initializeGame,
    handlePlayerMove,
    handlePlaceBomb,
    handleBombExplosions
};