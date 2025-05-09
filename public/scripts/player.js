player = {
    x: 0,
    y: 0,
    width: 16 * scale,
    height: 24 * scale,
    speed: 0.5 * scale,
    color: "white",
    isDead: false, // Player starts alive
    maxBombs: 3, // Maximum number of bombs the player can drop
    bombRange: 3, // Default bomb explosion range
    coins: 0, // Player's coin count
    collision: { row: 0, col: 0 } // Player's collision tile (feet position)
};

const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

const FOOT_COLLISION_SIZE = 4 * scale; // Define the size of the square for collision detection

// Collision detection functions

function updatePlayerCollision() {
    const footX = player.x + player.width / 2;
    const footY = player.y + player.height;
    const { row, col } = pixelToTile(footX, footY);
    player.collision = { row, col };
}

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
const explosions = []; // Array to store active explosions

// Drop a bomb at the player's current position
function dropBomb() {
    // Check if the player has reached the maximum number of bombs
    if (bombs.length >= player.maxBombs) {
        console.log("Maximum number of bombs reached!");
        return;
    }

    const { row, col } = player.collision;

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
            timer: Date.now() + 3000,
            range: player.bombRange // Use the player's bomb range
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

        // Check if the tile is walkable
        if (isTileWalkable(newRow, newCol) && tilemap[newRow][newCol] !== TILE_BOMB) {
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
        // Move the player to the closest walkable tile
        player.x = closestTile.x + TILE_SIZE / 2 - player.width / 2; // Center horizontally
        player.y = closestTile.y + TILE_SIZE - player.height;        // Align feet vertically

        // Update the player's collision attribute
        updatePlayerCollision();
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
            createExplosion(bomb.row, bomb.col, bomb.range); // Trigger explosion
            bombs.splice(index, 1); // Remove the bomb from the array
        }
    });

    // Remove expired explosions
    explosions.forEach((explosion, index) => {
        if (now >= explosion.expiresAt) {
            explosions.splice(index, 1); // Remove the explosion
        }
    });
}

// Create an explosion in cardinal directions
function createExplosion(row, col, range) {
    const directions = [
        { dRow: -1, dCol: 0 }, // Up
        { dRow: 1, dCol: 0 },  // Down
        { dRow: 0, dCol: -1 }, // Left
        { dRow: 0, dCol: 1 }   // Right
    ];

    // Add the center of the explosion
    explosions.push({
        row,
        col,
        expiresAt: Date.now() + 500 // Explosion lasts for 0.5 seconds
    });

    // Add explosions in cardinal directions
    for (const { dRow, dCol } of directions) {
        for (let i = 1; i <= range; i++) {
            const newRow = row + dRow * i;
            const newCol = col + dCol * i;

            // Stop if the tile is out of bounds
            if (newRow < 0 || newRow >= TILE_ROWS || newCol < 0 || newCol >= TILE_COLS) break;

            // Stop if the tile is a block (indestructible)
            if (tilemap[newRow][newCol] === TILE_BLOCK) break;

            // If the tile is a brick, break it and stop the explosion
            if (tilemap[newRow][newCol] === TILE_BRICK) {
                tilemap[newRow][newCol] = TILE_EMPTY;

                // Remove the brick from the bricks array
                const brickIndex = bricks.findIndex(brick => brick.row === newRow && brick.col === newCol);
                if (brickIndex !== -1) {
                    bricks.splice(brickIndex, 1);
                }

                // Add the explosion to the array
                explosions.push({
                    row: newRow,
                    col: newCol,
                    expiresAt: Date.now() + 500 // Explosion lasts for 0.5 seconds
                });

                break; // Stop the explosion from continuing past the brick
            }

            // Add the explosion to the array
            explosions.push({
                row: newRow,
                col: newCol,
                expiresAt: Date.now() + 500 // Explosion lasts for 0.5 seconds
            });

            // Stop if the tile is not walkable
            if (!isTileWalkable(newRow, newCol)) break;
        }
    }
}

function drawExplosions() {
    ctx.fillStyle = "orange";
    explosions.forEach(explosion => {
        const { x, y } = tileToPixel(explosion.row, explosion.col);
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
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

// Check if the player is hit by an explosion
function checkPlayerHit() {
    if (player.isDead) return; // Skip if the player is already dead

    explosions.forEach(explosion => {
        // Check if the player's collision tile matches the explosion's tile
        if (player.collision.row === explosion.row && player.collision.col === explosion.col) {
            // Player is hit by the explosion
            player.isDead = true;
            player.color = "red"; // Change the player's color to red
            console.log("Player hit by explosion!");
        }
    });
}

// Function to set the player's position based on tile coordinates
function setPlayerPosition(row, col) {
    const { x, y } = tileToPixel(row, col);
    player.x = x + TILE_SIZE / 2 - player.width / 2; // Center horizontally
    player.y = y + TILE_SIZE - player.height;        // Align feet to the center of the tile
}

// Update player and draw bombs and explosions
function updatePlayer() {
    if (!player.isDead) {
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

        // Update the player's collision attribute
        updatePlayerCollision();
    }

    updateBombs();
    checkPlayerHit(); // Check if the player is hit by an explosion
}

function spritePlayer(color, animationState = "stillDown", frameIndex = 0) {
    const spritesheet = new Image();
    spritesheet.src = "images/Sprites/player.png";

    const colorSheet = {
        "white": { x: 2, y: 46 },
        "black": { x: 195, y: 46 },
        "red": { x: 2, y: 304 },
        "blue": { x: 195, y: 304 },
    };

    const animationSheet = {
        "stillDown": { x: 18, y: 1, frame: 1 },
        "stillRight": { x: 18, y: 26, frame: 1 },
        "stillUp": { x: 18, y: 51, frame: 1 },
        "stillLeft": { x: 18, y: 76, frame: 1 },
        "walkDown": { x: 1, y: 1, frame: 3 },
        "walkRight": { x: 1, y: 26, frame: 3 },
        "walkUp": { x: 1, y: 51, frame: 3 },
        "walkLeft": { x: 1, y: 76, frame: 3 },
        "death": { x: 1, y: 114, frame: 7 },
    };

    // Get the origin for the player's color
    const colorOffset = colorSheet[color];
    if (!colorOffset) {
        console.error(`Invalid color: ${color}`);
        return;
    }

    // Get the animation details
    const animation = animationSheet[animationState];
    if (!animation) {
        console.error(`Invalid animation state: ${animationState}`);
        return;
    }

    // Calculate the frame position
    const frameX = colorOffset.x + animation.x + frameIndex * (player.width + 1); // Add 1 for the gap
    const frameY = colorOffset.y + animation.y;

    // Draw the sprite
    ctx.drawImage(
        spritesheet,
        frameX, frameY, // Source X, Y
        player.width, player.height, // Source width, height
        player.x, player.y, // Destination X, Y
        player.width, player.height // Destination width, height
    );
}

function drawPlayer() {
    // Determine the animation state based on player movement
    let animationState = "stillDown";
    if (keys['w']) animationState = "walkUp";
    else if (keys['s']) animationState = "walkDown";
    else if (keys['a']) animationState = "walkLeft";
    else if (keys['d']) animationState = "walkRight";

    // Update the frame index for animations
    const frameIndex = Math.floor(Date.now() / 200) % 3; // Cycle through frames every 200ms

    // Draw the player sprite
    spritePlayer(player.color, animationState, frameIndex);

    // Draw bombs and explosions
    drawBombs();
    drawExplosions();
}

