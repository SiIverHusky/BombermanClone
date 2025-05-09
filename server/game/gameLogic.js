const { addPlayer, removePlayer, processPlayerMove, processPlaceBomb } = require('./playerManager');
const { placeItems, handleItemCollection } = require('./itemManager');

const TILE_ROWS = 11; // Number of rows in the arena
const TILE_COLS = 13; // Number of columns in the arena

const TILE_EMPTY = 0;
const TILE_BLOCK = 1; // Indestructible blocks
const TILE_BRICK = 2; // Destructible bricks
const TILE_PICKUP = 3;
const TILE_BOMB = 4;

const TILE_SIZE = 16; // Size of each tile in pixels

// Game states for each room
const gameStates = new Map(); // Map to store game states for each room

const NUM_BRICKS = 60; // Number of bricks to place in the arena
const EXEMPTED_TILES = [
    { row: 0, col: 0 },
	{ row: 0, col: 1 },
	{row: 0, col: 2 },
	{ row: 1, col: 0 },
	{ row: 2, col: 0 },
	{ row: 9, col: 12 },
	{ row: 10, col: 12 },
    { row: 10, col: 10 },
	{ row: 10, col: 11 },
	{ row: 10, col: 12}
];

function initializeTilemap() {
    let tilemap = Array.from({ length: 11 }, () => Array(13).fill(TILE_EMPTY));
    
    // Block placement
    for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 13; col++) {
            if (row % 2 === 1 && col % 2 === 1) {
                tilemap[row][col] = TILE_BLOCK; // Indestructible blocks
            }
        }
    };

    // Brick placement
    let placedBricks = 0;

    while (placedBricks < NUM_BRICKS) {
        const row = Math.floor(Math.random() * TILE_ROWS);
        const col = Math.floor(Math.random() * TILE_COLS);

        // Ensure bricks do not spawn on exempted tiles or non-walkable tiles
        if (
            EXEMPTED_TILES.some(tile => tile.row === row && tile.col === col) ||
            tilemap[row][col] !== TILE_EMPTY
        ) {
            continue;
        }

        // Place a brick
        tilemap[row][col] = TILE_BRICK; // Mark the tile as a destructible brick
        placedBricks++;
    }

    return tilemap;
}

// Function to initialize the game state for a room
function initializeGameState(roomCode, players) {
    console.log(`Initializing game state for room ${roomCode}...`);

    const tilemap = initializeTilemap();

    // Initialize players
    const playerStates = {};
    players.forEach((player) => addPlayer(playerStates, player));

    console.log("Player states initialized:", playerStates);

    // Create the game state
    const gameState = {
        tilemap,
        players: playerStates,
        items: [],
        bombs: [],
        gameEnded: false,
        gameStartTime: Date.now()
    };

    // Place items inside bricks
    placeItems(gameState);

    gameStates.set(roomCode, gameState);
    return gameState;
}

// Function to destroy the game state for a room
function destroyGameState(roomCode) {
    if (gameStates.has(roomCode)) {
        gameStates.delete(roomCode);
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

module.exports = {
    initializeGameState,
    destroyGameState,
    handleBombExplosions
};