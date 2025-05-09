const TILE_EMPTY = 0;
const TILE_BLOCK = 1; // Indestructible blocks
const TILE_BRICK = 2; // Destructible bricks
const TILE_PICKUP = 3; // Items
const TILE_BOMB = 4; // Bombs

const TILE_SIZE = 16; // Size of each tile in pixels

// Game states for each room
const gameStates = new Map(); // Map to store game states for each room

// Function to initialize the game state for a room
function initializeGameState(roomCode, players) {
    const tilemap = Array.from({ length: 11 }, () => Array(13).fill(TILE_EMPTY));

    // Place indestructible blocks and bricks
    for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 13; col++) {
            if (Math.random() < 0.1) {
                tilemap[row][col] = TILE_BLOCK; // 10% chance of block
            } else if (Math.random() < 0.2) {
                tilemap[row][col] = TILE_BRICK; // 20% chance of brick
            }
        }
    }

    // Initialize players
    const playerStates = {};
    players.forEach((player, index) => {
        const startPositions = [
            { row: 0, col: 0 },
            { row: 10, col: 12 }
        ];
        const startPosition = startPositions[index];

        playerStates[player.id] = {
            id: player.id,
            x: startPosition.col * TILE_SIZE * 4, // TILE_SIZE * scale
            y: startPosition.row * TILE_SIZE * 4,
            width: TILE_SIZE * 4,
            height: TILE_SIZE * 6, // Adjusted for player height
            speed: 0.5 * 4,
            color: index === 0 ? "red" : "blue",
            isDead: false,
            maxBombs: 3,
            bombRange: 3,
            coins: 0,
            collision: { row: startPosition.row, col: startPosition.col }
        };
    });

    // Store the game state
    gameStates.set(roomCode, {
        tilemap,
        players: playerStates,
        items: [],
        bombs: [],
        gameEnded: false
    });

    // Place items inside bricks
    placeItems(roomCode);
}

// Function to destroy the game state for a room
function destroyGameState(roomCode) {
    if (gameStates.has(roomCode)) {
        gameStates.delete(roomCode);
    }
}

// Function to update the game state (e.g., handle bomb explosions, player movement)
function updateGameState(roomCode) {
    const state = gameStates.get(roomCode);
    if (!state) return false;

    // Handle bomb explosions
    handleBombExplosions(state);

    // Check if the game is over
    const alivePlayers = Object.values(state.players).filter(player => !player.isDead);
    return alivePlayers.length <= 1;
}

// Function to place items randomly inside bricks
function placeItems(roomCode) {
    const state = gameStates.get(roomCode);
    if (!state) return;

    state.tilemap.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === TILE_BRICK) {
                const random = Math.random();
                if (random < 0.5) {
                    // 50% chance of small coin
                    state.items.push({ row: rowIndex, col: colIndex, type: 2 });
                } else if (random < 0.6) {
                    // 10% chance of big coin
                    state.items.push({ row: rowIndex, col: colIndex, type: 3 });
                }
            }
        });
    });
}

// Function to handle player movement
function handlePlayerMove(roomCode, playerId, newX, newY) {
    const state = gameStates.get(roomCode);
    if (!state) return;

    const player = state.players[playerId];
    if (!player) return;

    const { row, col } = pixelToTile(newX + player.width / 2, newY + player.height);

    // Check if the new position is walkable
    if (isTileWalkable(state.tilemap, row, col)) {
        player.x = newX;
        player.y = newY;
        player.collision = { row, col };
    }
}

// Function to handle bomb placement
function handlePlaceBomb(roomCode, playerId) {
    const state = gameStates.get(roomCode);
    if (!state) return;

    const player = state.players[playerId];
    if (!player || player.maxBombs <= 0) return;

    const { row, col } = player.collision;

    // Check if the tile is empty
    if (state.tilemap[row][col] === TILE_EMPTY) {
        // Place the bomb
        state.tilemap[row][col] = TILE_BOMB;
        state.bombs.push({
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
function handleBombExplosions(state) {
    const now = Date.now();

    state.bombs = state.bombs.filter(bomb => {
        if (now >= bomb.timer) {
            explodeBomb(state, bomb);
            return false; // Remove the bomb after it explodes
        }
        return true;
    });
}

// Function to handle a bomb explosion
function explodeBomb(state, bomb) {
    const directions = [
        { dRow: -1, dCol: 0 }, // Up
        { dRow: 1, dCol: 0 },  // Down
        { dRow: 0, dCol: -1 }, // Left
        { dRow: 0, dCol: 1 }   // Right
    ];

    // Clear the bomb tile
    state.tilemap[bomb.row][bomb.col] = TILE_EMPTY;

    // Check all directions for explosion range
    directions.forEach(({ dRow, dCol }) => {
        for (let i = 1; i <= bomb.range; i++) {
            const newRow = bomb.row + dRow * i;
            const newCol = bomb.col + dCol * i;

            // Stop if out of bounds
            if (newRow < 0 || newRow >= 11 || newCol < 0 || newCol >= 13) break;

            const tile = state.tilemap[newRow][newCol];

            if (tile === TILE_BLOCK) {
                // Stop at indestructible block
                break;
            } else if (tile === TILE_BRICK) {
                // Break the brick and stop the explosion
                state.tilemap[newRow][newCol] = TILE_EMPTY;

                // Remove any item inside the brick
                state.items = state.items.filter(item => !(item.row === newRow && item.col === newCol));
                break;
            } else {
                // Continue the explosion
                // Notify players if they are hit
                Object.values(state.players).forEach(player => {
                    if (player.collision.row === newRow && player.collision.col === newCol) {
                        player.isDead = true;
                    }
                });
            }
        }
    });
}

// Function to check if a tile is walkable
function isTileWalkable(tilemap, row, col) {
    const tile = tilemap[row][col];
    return tile === TILE_EMPTY || tile === TILE_PICKUP;
}

// Utility function to convert pixel coordinates to tile coordinates
function pixelToTile(x, y) {
    return {
        row: Math.floor(y / TILE_SIZE),
        col: Math.floor(x / TILE_SIZE)
    };
}

// Function to save game stats (placeholder for database integration)
function saveGameStats(roomCode, players) {
    console.log(`Saving game stats for room ${roomCode}:`, players);
}

module.exports = {
    initializeGameState,
    destroyGameState,
    updateGameState,
    handlePlayerMove,
    handlePlaceBomb,
    handleBombExplosions,
    saveGameStats,
};