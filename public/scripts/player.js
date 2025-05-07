player = {
	x: arenaX + 2*scale,
	y: arenaY + arenaWidth / 4,
	width: 16*scale,
	height: 24*scale,
	speed: 0.5*scale,
	color: "white"
};

const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

const FOOT_COLLISION_SIZE = 4 * scale; // Define the size of the square for collision detection

// Collision detection functions

function isCollidingWithArena(x, y) {
    const footX = x + player.width / 2 - FOOT_COLLISION_SIZE / 2;
    const footY = y + player.height - FOOT_COLLISION_SIZE;

    return (
        footX < arenaBounds.x ||
        footX + FOOT_COLLISION_SIZE > arenaBounds.x + arenaBounds.width ||
        footY < arenaBounds.y ||
        footY + FOOT_COLLISION_SIZE > arenaBounds.y + arenaBounds.height
    );
}

function isCollidingWithBlocks(x, y) {
    const footX = x + player.width / 2 - FOOT_COLLISION_SIZE / 2;
    const footY = y + player.height - FOOT_COLLISION_SIZE;

    return blocks.some(block => (
        footX < block.x + block.width &&
        footX + FOOT_COLLISION_SIZE > block.x &&
        footY < block.y + block.height &&
        footY + FOOT_COLLISION_SIZE > block.y
    ));
}

// Bomb Functions
const bombs = []; // Array to store active bombs

// Drop a bomb at the player's current position
function dropBomb() {
    const { row, col } = pixelToTile(player.x + player.width / 2, player.y + player.height);

    // Check if the tile is empty before placing the bomb
    if (tilemap[row][col] === TILE_EMPTY) {
        // Place the bomb in the tilemap
        tilemap[row][col] = TILE_BOMB;
		console.log("Bomb placed at: ", row, col);
        // Add the bomb to the bombs array
        bombs.push({
            row,
            col,
            x: arenaX + col * TILE_SIZE + TILE_SIZE / 4, // Center the bomb in the tile
            y: arenaY + row * TILE_SIZE + TILE_SIZE / 4,
            size: TILE_SIZE / 2, // Bomb size
            placedAt: Date.now(),
			timer: Date.now() + 3000
        });

        // Move the player to the next available tile
        movePlayerToNextTile(row, col);
    }
}

// Move the player to the next available tile
function movePlayerToNextTile(bombRow, bombCol) {
    const directions = [
        { row: -1, col: 0 }, // Up
        { row: 1, col: 0 },  // Down
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 }   // Right
    ];

    let closestTile = null;
    let minDistance = Infinity;

    // Calculate the player's foot position
    const playerFootX = player.x + player.width / 2;
    const playerFootY = player.y + player.height;

    for (const { row: dRow, col: dCol } of directions) {
        const newRow = bombRow + dRow;
        const newCol = bombCol + dCol;

        if (isTileWalkable(newRow, newCol)) {
            const { x, y } = tileToPixel(newRow, newCol);
            const tileCenterX = x + TILE_SIZE / 2;
            const tileCenterY = y + TILE_SIZE / 2;

            // Calculate distance from the player's feet to the tile center
            const distance = Math.hypot(playerFootX - tileCenterX, playerFootY - tileCenterY);

            if (distance < minDistance) {
                minDistance = distance;
                closestTile = { x, y, row: newRow, col: newCol };
            }
        }
    }

    if (closestTile) {
        // Determine the axis of movement
        if (closestTile.row !== bombRow) {
            // Move vertically (y-axis)
            player.y = closestTile.y + TILE_SIZE / 4 - player.height;
        } else if (closestTile.col !== bombCol) {
            // Move horizontally (x-axis)
            player.x = closestTile.x + TILE_SIZE / 4 - player.width / 2;
        }
    }
}

// Update bombs (handle explosion logic)
function updateBombs() {
    const now = Date.now();

    bombs.forEach((bomb, index) => {
        if (now >= bomb.timer) {
            // Bomb explodes
			console.log("Bomb exploded at: ", bomb.row, bomb.col);
            tilemap[bomb.row][bomb.col] = TILE_EMPTY; // Clear the bomb from the tilemap
            bombs.splice(index, 1); // Remove the bomb from the array
            // TODO: Add explosion effects and damage logic
        }
    });
}

// Draw bombs
function drawBombs() {
    ctx.fillStyle = "red";
    bombs.forEach(bomb => {
        ctx.fillRect(bomb.x, bomb.y, bomb.size, bomb.size);
    });
}

// Listen for the space key to drop a bomb
window.addEventListener("keydown", (e) => {
    if (e.key === " ") {
        dropBomb();
    }
});

function updatePlayer() {
    let newX = player.x;
    let newY = player.y;

    if (keys['w']) newY -= player.speed;
    if (keys['s']) newY += player.speed;
    if (keys['a']) newX -= player.speed;
    if (keys['d']) newX += player.speed;

    // Convert new positions to tile coordinates
    const newTileX = pixelToTile(newX + player.width / 2, player.y + player.height).col;
    const newTileY = pixelToTile(player.x + player.width / 2, newY + player.height).row;

    // Check collisions with unwalkable tiles before updating position
    if (isTileWalkable(pixelToTile(newX + player.width / 2, player.y + player.height).row, newTileX) &&
        !isCollidingWithArena(newX, player.y) && !isCollidingWithBlocks(newX, player.y)) {
        player.x = newX;
    }
    if (isTileWalkable(newTileY, pixelToTile(player.x + player.width / 2, newY + player.height).col) &&
        !isCollidingWithArena(player.x, newY) && !isCollidingWithBlocks(player.x, newY)) {
        player.y = newY;
    }

    updateBombs();
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

	drawBombs();
}

