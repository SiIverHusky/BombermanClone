const TILE_SIZE = 16 * scale; // Size of each tile in pixels
const TILE_ROWS = 11; // Number of rows in the arena
const TILE_COLS = 13; // Number of columns in the arena

// Initialize the tilemap as a 2D array
const tilemap = Array.from({ length: TILE_ROWS }, () => Array(TILE_COLS).fill(0));

// Tile types
const TILE_EMPTY = 0;
const TILE_BLOCK = 1; // Indestructible blocks
const TILE_BRICK = 2; // Destructible bricks
const TILE_PICKUP = 3;
const TILE_BOMB = 4;

// Populate the tilemap based on blocks from arena.js
blocks.forEach(block => {
    const { row, col } = pixelToTile(block.x, block.y);
    if (row >= 0 && row < TILE_ROWS && col >= 0 && col < TILE_COLS) {
        tilemap[row][col] = TILE_BLOCK;
    }
});

// Convert tile coordinates to pixel coordinates
function tileToPixel(row, col) {
    return {
        x: arenaX + col * TILE_SIZE,
        y: arenaY + row * TILE_SIZE
    };
}

// Convert pixel coordinates to tile coordinates
function pixelToTile(x, y) {
    return {
        row: Math.floor((y - arenaY) / TILE_SIZE),
        col: Math.floor((x - arenaX) / TILE_SIZE)
    };
}

// Check if a tile is walkable
function isTileWalkable(row, col) {
    return tilemap[row] && (tilemap[row][col] === TILE_EMPTY || tilemap[row][col] === TILE_PICKUP);
}

// Draw the tilemap (optional, for debugging or visualization)
function drawTilemap() {
    for (let row = 0; row < TILE_ROWS; row++) {
        for (let col = 0; col < TILE_COLS; col++) {
            const { x, y } = tileToPixel(row, col);
            if (tilemap[row][col] === TILE_BLOCK) {
                ctx.fillStyle = "gray"; // Indestructible blocks
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            } else if (tilemap[row][col] === TILE_BRICK) {
                ctx.fillStyle = "brown"; // Destructible bricks
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}