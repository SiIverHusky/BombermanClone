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
    players.forEach(player => {
        const username = player.username;
        addPlayer(playerStates, player, username); // Use username as the key
    });

    console.log("Player states initialized:", playerStates);

    // Create the game state
    const gameState = {
        tilemap,
        players: playerStates, // Use usernames as keys
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


module.exports = {
    initializeGameState,
    destroyGameState
};