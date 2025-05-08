// Constants
const NUM_BRICKS = 60; // Number of bricks to spawn
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
const BRICK_COLOR = "brown"; // Color for bricks

const ITEM_TYPES = {
    INCREASE_BOMB_RANGE: 0,
    INCREASE_BOMB_COUNT: 1,
    SMALL_COIN: 2,
    BIG_COIN: 3
};

const ITEM_COLORS = {
    [ITEM_TYPES.INCREASE_BOMB_RANGE]: "blue",
    [ITEM_TYPES.INCREASE_BOMB_COUNT]: "purple",
    [ITEM_TYPES.SMALL_COIN]: "yellow",
    [ITEM_TYPES.BIG_COIN]: "yellow"
};

const ITEM_SIZES = {
    [ITEM_TYPES.INCREASE_BOMB_RANGE]: TILE_SIZE / 4,
    [ITEM_TYPES.INCREASE_BOMB_COUNT]: TILE_SIZE / 4,
    [ITEM_TYPES.SMALL_COIN]: TILE_SIZE / 4,
    [ITEM_TYPES.BIG_COIN]: TILE_SIZE / 3
};

const MAX_ITEMS = {
    [ITEM_TYPES.INCREASE_BOMB_RANGE]: 10,
    [ITEM_TYPES.INCREASE_BOMB_COUNT]: 10
};

const bricks = [];
const items = [];
let bombRangeItems = 0;
let bombCountItems = 0;

// Place bricks randomly on the map
function placeBricks() {
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
        bricks.push({ row, col });
        placedBricks++;
    }
}

// Draw bricks on the map
function drawBricks() {
    bricks.forEach(brick => {
        const { x, y } = tileToPixel(brick.row, brick.col);
        ctx.fillStyle = BRICK_COLOR;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    });
}

// Place items randomly within bricks
function placeItems() {
    // Shuffle the bricks array to randomize item placement
    const shuffledBricks = [...bricks].sort(() => Math.random() - 0.5);

    // Place bomb range and bomb count items first
    shuffledBricks.forEach(brick => {
        if (bombRangeItems < MAX_ITEMS[ITEM_TYPES.INCREASE_BOMB_RANGE]) {
            items.push({
                row: brick.row,
                col: brick.col,
                type: ITEM_TYPES.INCREASE_BOMB_RANGE
            });
            bombRangeItems++;
        } else if (bombCountItems < MAX_ITEMS[ITEM_TYPES.INCREASE_BOMB_COUNT]) {
            items.push({
                row: brick.row,
                col: brick.col,
                type: ITEM_TYPES.INCREASE_BOMB_COUNT
            });
            bombCountItems++;
        }
    });

    // Place coins in the remaining bricks
    shuffledBricks.forEach(brick => {
        // Skip bricks that already have an item
        if (items.some(item => item.row === brick.row && item.col === brick.col)) {
            return;
        }

        const random = Math.random();

        if (random < 0.5) {
            // 50% chance of small coin
            items.push({
                row: brick.row,
                col: brick.col,
                type: ITEM_TYPES.SMALL_COIN
            });
        } else if (random < 0.6) {
            // 10% chance of big coin
            items.push({
                row: brick.row,
                col: brick.col,
                type: ITEM_TYPES.BIG_COIN
            });
        }
        // 40% chance of nothing (do nothing)
    });
}

// Draw items on the map
function drawItems() {
    items.forEach(item => {
        const { x, y } = tileToPixel(item.row, item.col);
        const size = ITEM_SIZES[item.type];
        ctx.fillStyle = ITEM_COLORS[item.type];
        ctx.fillRect(
            x + TILE_SIZE / 2 - size / 2,
            y + TILE_SIZE / 2 - size / 2,
            size,
            size
        );
    });
}

// Handle item collection by the player
function collectItems() {
    items.forEach((item, index) => {
        // Check if the player's collision tile matches the item's tile
        if (player.collision.row === item.row && player.collision.col === item.col) {
            // Handle item effects
            if (item.type === ITEM_TYPES.INCREASE_BOMB_RANGE && player.bombRange < 10) {
                player.bombRange++;
            } else if (item.type === ITEM_TYPES.INCREASE_BOMB_COUNT && player.maxBombs < 10) {
                player.maxBombs++;
            } else if (item.type === ITEM_TYPES.SMALL_COIN) {
                player.coins += 1;
            } else if (item.type === ITEM_TYPES.BIG_COIN) {
                player.coins += 5;
            }

            // Remove the item from the array
            items.splice(index, 1);

            console.log(`Collected item: ${item.type}, Player coins: ${player.coins}`);
            console.log(`Player bomb range: ${player.bombRange}, Player max bombs: ${player.maxBombs}`);
        }
    });
}

// Initialize bricks and items
placeBricks();
placeItems();