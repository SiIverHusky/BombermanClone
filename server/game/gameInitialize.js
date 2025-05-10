const TILE_ROWS = 11; // Number of rows in the arena
const TILE_COLS = 13; // Number of columns in the arena

const TILE_EMPTY = 0;
const TILE_BLOCK = 1; // Indestructible blocks
const TILE_BRICK = 2; // Destructible bricks
const TILE_PICKUP = 3;
const TILE_BOMB = 4;

const INCREASE_BOMB_RANGE = 0;
const INCREASE_BOMB_COUNT = 1;
const SMALL_COIN = 2;
const BIG_COIN = 3;

const NUM_BOMB_UPGRADES = 8; // Number of bomb

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

function addPlayer(playerStates, username) {
    const startPositions = [
        { row: 0, col: 0, color: "red" },
        { row: 10, col: 12, color: "blue" }
    ];

    const existingPlayers = Object.keys(playerStates).length;
    if (existingPlayers >= startPositions.length) {
        console.error("Cannot add more players. Maximum player limit reached.");
        return;
    }

    const startPosition = startPositions[existingPlayers];

    // Add the player to the playerStates object
    playerStates[username] = {
        username: username,
		position: {x: 0, y: 0},
		tilePos: { row: startPosition.row, col: startPosition.col },
		color: startPosition.color,
		keys: [],
		latestKey: null,
		alive: true,
		coins: 0,
        bombRange: 1,
        bombCount: 1,
        width: 16 * 4,
        height: 24 * 4
    };


    console.log(`Player ${username} added at tile (${startPosition.row}, ${startPosition.col})`);
}

function initializePlayerStates(roomCode, players) {

	const playerStates = {};
	players.forEach(player => {
		addPlayer(playerStates, player.username); //
	});

	return playerStates;
}

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function initializeItems(gameState) {
	const brickTiles = [];

    // Collect all brick tiles
    gameState.tilemap.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === TILE_BRICK) {
                brickTiles.push({ row: rowIndex, col: colIndex });
            }
        });
    });

	// Shuffle the brick tiles
    shuffleArray(brickTiles);

	for (let i = 0; i < NUM_BOMB_UPGRADES && i < brickTiles.length; i++) {
		const { row, col } = brickTiles[i];
		gameState.items.push({ row, col, type: INCREASE_BOMB_RANGE });
	}

	for (let i = NUM_BOMB_UPGRADES; i < NUM_BOMB_UPGRADES*2 && i < brickTiles.length; i++) {
		const { row, col } = brickTiles[i];
		gameState.items.push({ row, col, type: INCREASE_BOMB_COUNT });
	}

	for (let i = NUM_BOMB_UPGRADES*2; i < brickTiles.length; i++) {
		const { row, col } = brickTiles[i];
		const random = Math.random();

		if (random < 0.1) {
			gameState.items.push({ row, col, type: SMALL_COIN });
		} else if (random < 0.5) {
			gameState.items.push({ row, col, type: BIG_COIN });
		}
	}
}

function initializeGameState(roomCode, players) { 
	const tilemap = initializeTilemap();

	const playerStates = initializePlayerStates(roomCode, players);

	const gameState = {
		tilemap,
		players: playerStates,
		items: [],
		bombs: [],
        gameStartTime: Date.now()
	};

	initializeItems(gameState);

	gameStates.set(roomCode, gameState);
	return gameState;
}

module.exports = {
    initializeGameState
}