// Player object for the local player
const player = {
    id: null, // Unique player ID assigned by the server
    x: 0,
    y: 0,
    width: 16 * scale,
    height: 24 * scale,
    speed: 0.5 * scale,
    color: "white",
    isDead: false,
    maxBombs: 3,
    bombRange: 3,
    coins: 0,
    collision: { row: 0, col: 0 } // Player's collision tile (feet position)
};

// Object to store other players
const otherPlayers = {};

// Key state tracking
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// Function to update the local player's position
function updatePlayerPosition() {
    if (player.isDead) return;

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
    if (isTileWalkable(newTileY, newTileX) &&
        !isCollidingWithArena(newX, player.y) &&
        !isCollidingWithBlocks(newX, player.y)) {
        player.x = newX;
    }
    if (isTileWalkable(newTileY, newTileX) &&
        !isCollidingWithArena(player.x, newY) &&
        !isCollidingWithBlocks(player.x, newY)) {
        player.y = newY;
    }

    // Update the player's collision attribute
    updatePlayerCollision();

    // Send the updated position to the server
    sendPlayerMove();
}

// Function to update the player's collision attribute
function updatePlayerCollision() {
    const footX = player.x + player.width / 2;
    const footY = player.y + player.height;
    const { row, col } = pixelToTile(footX, footY);
    player.collision = { row, col };
}

// Function to send the player's movement to the server
function sendPlayerMove() {
    ws.send(JSON.stringify({
        type: 'playerMove',
        id: player.id,
        x: player.x,
        y: player.y,
        collision: player.collision
    }));
}

// Function to render the local player
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Function to render other players
function drawOtherPlayers() {
    Object.values(otherPlayers).forEach(otherPlayer => {
        ctx.fillStyle = otherPlayer.color;
        ctx.fillRect(otherPlayer.x, otherPlayer.y, otherPlayer.width, otherPlayer.height);
    });
}

// Function to update other players based on server data
function updateOtherPlayers(serverPlayers) {
    Object.keys(serverPlayers).forEach(id => {
        if (id !== player.id) {
            otherPlayers[id] = serverPlayers[id];
        }
    });
}

function isTileWalkable(newTileY, newTileX){
    //console.log(newTileX, newTileY); //int, int
    return true;
}

function isCollidingWithArena(newX, y){
    //console.log(newX, y); //int, int
    return true;
}

function isCollidingWithBlocks(newX, y){
    //console.log(newX, y); //int, int
    return true;
}