const TILE_SIZE = 16 * scale; // Size of each tile in pixels
const TILE_ROWS = 11; // Number of rows in the arena
const TILE_COLS = 13; // Number of columns in the arena

// Tile types
const TILE_EMPTY = 0;
const TILE_BLOCK = 1; // Indestructible blocks
const TILE_BRICK = 2; // Destructible bricks
const TILE_PICKUP = 3; // Items (e.g., coins, power-ups)
const TILE_BOMB = 4; // Bombs

// Initialize the tilemap (empty by default)
let tilemap = Array.from({ length: TILE_ROWS }, () => Array(TILE_COLS).fill(TILE_EMPTY));

// Function to update the tilemap based on server data
function updateTilemap(serverTilemap) {
    tilemap = serverTilemap; // Replace the local tilemap with the server's tilemap
    // console.log("Tilemap updated from server:", tilemap); // Log the updated tilemap for debugging
}

// Function to draw the tilemap
function drawTilemap() {
    for (let row = 0; row < TILE_ROWS; row++) {
        for (let col = 0; col < TILE_COLS; col++) {
            const tileType = tilemap[row][col];
            const { x, y } = tileToPixel(row, col);

            if (tileType === TILE_BLOCK) {
                // Draw indestructible blocks
                ctx.fillStyle = "gray";
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            } else if (tileType === TILE_BRICK) {
                // Draw destructible bricks
                ctx.fillStyle = "brown";
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            } 
            // else if (tileType === TILE_PICKUP) {
            //     // Draw items (handled in items.js)
            //     drawItemAtTile(row, col);
            // } else if (tileType === TILE_BOMB) {
            //     // Draw bombs (handled in player.js or bombs.js)
            //     drawBombAtTile(row, col);
            // }
        }
    }
}

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