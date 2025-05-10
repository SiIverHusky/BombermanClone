const SPEED = 2;



function updateTilePosition(player) {
	const tilePos = pixelToTile(player.position.x, player.position.y);
	player.tilePos.row = tilePos.row;
	player.tilePos.col = tilePos.col;
}

function receivePlayer(player, data) {
	player.position = data.position;
	player.tilePos = data.tilePos;
	player.color = data.color;
	player.keys = data.keys;
	player.alive = data.alive;
	player.coins = data.coins;
}

function checkCollision(newX, newY) {
	const newTile = pixelToTile(newX, newY);
	if (newTile.row < 0 || newTile.row >= TILE_ROWS || newTile.col < 0 || newTile.col >= TILE_COLS) {
		return false; // Out of bounds
	}

	if (isTileWalkable(newTile.row, newTile.col)) {
		return true; // Walkable tile
	}
}

function movePlayer(player) {
    let dx = 0;
    let dy = 0;

    if (player.keys.includes("w")) dy -= SPEED;
    if (player.keys.includes("s")) dy += SPEED;
    if (player.keys.includes("a")) dx -= SPEED;
    if (player.keys.includes("d")) dx += SPEED;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        const normalizationFactor = Math.sqrt(2) / 2;
        dx *= normalizationFactor;
        dy *= normalizationFactor;
    }

    const newX = player.position.x + dx;
    const newY = player.position.y + dy;

    if (checkCollision(newX, newY)) {
        player.position.x = newX;
        player.position.y = newY;
        updateTilePosition(player);
    }
}


function spritePlayer(player, animationState = "stillDown", frameIndex = 0) {
	// console.log("Drawing sprite for player:", player);
    let spritesheet = new Image();
    spritesheet.src = "../../images/Sprites/player4.png";

	// console.log(spritesheet)

    
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
        console.error(`Invalid or missing color for player: ${player.color}`);
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
    // console.log(`Player: ${player.username}, Animation: ${animationState}, Frame: ${frameIndex}`);
    ctx.drawImage(
        spritesheet,
        frameX, frameY, // Source X, Y
        player.width, player.height, // Source width, height
        player.position.x - player.width/2, player.position.y - player.height+4, // Destination X, Y
        player.width, player.height // Destination width, height
    );
}