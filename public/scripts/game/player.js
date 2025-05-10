// Map to track the last pressed keys
const lastKeys = {
    w: false,
    a: false,
    s: true,
    d: false
};

// Player 1 and Player 2 objects
const player1 = {
    username: null,
    x: 0,
    y: 0,
    width: 16 * scale,
    height: 24 * scale,
    speed: 0.5 * scale,
    color: "red",
    isDead: false,
    maxBombs: 3,
    bombRange: 3,
    coins: 0,
    collisionPoint: { x: 0, y: 0 },
};

const player2 = {
    username: null,
    x: 0,
    y: 0,
    width: 16 * scale,
    height: 24 * scale,
    speed: 0.5 * scale,
    color: "blue",
    isDead: false,
    maxBombs: 3,
    bombRange: 3,
    coins: 0,
    collisionPoint: { x: 0, y: 0 },
};


// Function to update the position of the local player
function updatePlayerPosition() {
    if (player1.username === username) {
        movePlayer(player1);
    }
    if (player2.username === username) {
        movePlayer(player2);
    }
}

function isCollidingWithBlocks(x, y) {
    const footX = x + player.width / 2 - FOOT_COLLISION_SIZE / 2;
    const footY = y + player.height - FOOT_COLLISION_SIZE;

    for (row = 0; row < TILE_ROWS; row++) {
        for (col = 0; col < TILE_COLS; col++) {
            const { x: blockX, y: blockY } = tileToPixel(row, col);
            if (tilemap[row][col] === TILE_BLOCK) {
                if (footX < blockX + TILE_SIZE && footX + FOOT_COLLISION_SIZE > blockX &&
                    footY < blockY + TILE_SIZE && footY + FOOT_COLLISION_SIZE > blockY) {
                    return true; // Collision detected
                }
            }
        }
    }
    return false; // No collision
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

function movePlayer(player) {
    if (player.isDead) return;

    let newX = player.x;
    let newY = player.y;

    if (keyState['w']) newY -= player.speed;
    if (keyState['s']) newY += player.speed;
    if (keyState['a']) newX -= player.speed;
    if (keyState['d']) newX += player.speed;

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
    updatePlayerCollision(player);
    sendPlayerMove(player);
}

// Function to update the player's collision attribute
function updatePlayerCollision(player) {
    const footX = player.x + player.width / 2;
    const footY = player.y + player.height;
    player.collisionPoint = { x: footX, y: footY };
}

// Function to send the player's movement to the server
function sendPlayerMove(player) {
    ws.send(JSON.stringify({
        type: 'playerMove',
        id: player.id,
        x: player.x,
        y: player.y,
        speed: player.speed,
        collision: player.collisionPoint,
    }));
}

// Function to render a player
function drawPlayer(player) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}



// Bombs and explosions will now be managed by the server
const bombs = [];
const explosions = [];

// Function to place a bomb (notify the server)
function placeBomb(player) {

    if (player.maxBombs <= 0) {
        console.log("No bombs available to place.");
        return;
    }

    const { x, y } = player.collisionPoint;
    const { row, col } = pixelToTile(x, y);

    ws.send(JSON.stringify({
        type: 'placeBomb',
        row,
        col,
        playerUsername: player.username
    }));

    player.maxBombs--;
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

// Function to draw bombs
function drawBombs() {
    bombs.forEach(bomb => {
        const { x, y } = tileToPixel(bomb.row, bomb.col);
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Function to draw explosions
function drawExplosions() {
    const now = Date.now();
    explosions.forEach((explosion, index) => {
        if (now >= explosion.expiresAt) {
            explosions.splice(index, 1);
        } else {
            explosion.tiles.forEach(tile => {
                const { x, y } = tileToPixel(tile.row, tile.col);
                ctx.fillStyle = "orange";
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            });
        }
    });
}

// Sprites
function spritePlayer(player, animationState = "stillDown", frameIndex = 0) {
    const spritesheet = new Image();
    spritesheet.src = "images/Sprites/player4.png";

    
    const colorSheet = {
        "white": { x: 2*4, y: 46*4 },
        "black": { x: 195*4, y: 46*4 },
        "red": { x: 2*4, y: 304*4 },
        "blue": { x: 195*4, y: 304*4 },
    };

    
    const animationSheet = {
        "stillDown": { x: 19*4-1, y: 1*4, frame : 1 },
        "stillRight": { x: 19*4-1, y: 26*4, frame: 1 },
        "stillUp": { x: 19*4-1, y: 51*4, frame: 1 },
        "stillLeft": { x: 19*4-1, y: 76*4, frame: 1 },
        "walkDown": { x: 1*4+1, y: 1*4, frame: 3 },
        "walkRight": { x: 1*4+2, y: 26*4, frame: 3 },
        "walkUp": { x: 1*4+2, y: 51*4, frame: 3 },
        "walkLeft": { x: 1*4+2, y: 76*4, frame: 3 },
        "death": { x: 1*4, y: 114*4, frame: 7 },
    };

    // Get the origin for the player's color
    const colorOffset = colorSheet[player.color];
    if (!colorOffset) {
        console.error(`Invalid color: ${color}`);
        return;
    }
    
    frameIndex = frameIndex % animationSheet[animationState].frame;

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

function drawPlayerWithAnimation(player, keys = {}) {
    // Ensure keys is defined to avoid TypeError
    keys = keys || {};

    // Determine the animation state based on player movement
    let animationState = "stillDown";
    if (keys['w']){
        lastKeys['a']=false; lastKeys['s']=false; 
        lastKeys['d']=false; lastKeys['w']=true;
        animationState = "walkUp";
    } 
    else if (keys['s']){ 
        lastKeys['a']=false; lastKeys['s']=true; 
        lastKeys['d']=false; lastKeys['w']=false;
        animationState = "walkDown";
    }
    else if (keys['a']){
        lastKeys['a']=true; lastKeys['s']=false; 
        lastKeys['d']=false; lastKeys['w']=false;
        animationState = "walkLeft";

    } 
    else if (keys['d']){
        lastKeys['a']=false; lastKeys['s']=false; 
        lastKeys['d']=true; lastKeys['w']=false;
        animationState = "walkRight";
    } 
    else{
        if (lastKeys['w']) animationState = "stillUp";
        else if (lastKeys['s']) animationState = "stillDown";
        else if (lastKeys['a']) animationState = "stillLeft";
        else if (lastKeys['d']) animationState = "stillRight";
    }

    // Update the frame index for animations
    const frameIndex = Math.floor(Date.now() / 200) % 3; // Cycle through frames every 200ms

    // Draw the player sprite
    spritePlayer(player, animationState, frameIndex);
}