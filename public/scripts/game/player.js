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

// Function to move a player
function movePlayer(player) {
    if (player.isDead) return;

    const direction = {
        x: keyState['d'] - keyState['a'], // 1 for right, -1 for left, 0 for no horizontal movement
        y: keyState['s'] - keyState['w']  // 1 for down, -1 for up, 0 for no vertical movement
    };

    let newX = player.x + direction.x * player.speed;
    let newY = player.y + direction.y * player.speed;

    // Check collision with the tilemap
    const { row, col } = pixelToTile(newX + player.width / 2, newY + player.height);
    if (tilemap[row] && tilemap[row][col] === TILE_EMPTY) {
        player.x = newX;
        player.y = newY;
    }

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
        arena: player.arena // Include arena sub-object
    }));
}

// Function to render a player
function drawPlayer(player) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Function to render both players
function drawPlayers() {
    drawPlayer(player1);
    drawPlayer(player2);
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