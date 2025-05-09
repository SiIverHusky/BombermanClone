// Player object for the local player
const player = {
    id: null,
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
    collisionPoint: { x: 0, y: 0 }
};

// Object to store other players
const otherPlayers = {};

// Key state tracking
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    console.log(`Key pressed: ${e.key}`); // Log key press
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    console.log(`Key released: ${e.key}`); // Log key release
});

// Function to update the local player's position
function updatePlayerPosition() {
    console.log("Updating player position..."); // Log position update

    if (player.isDead) return;

    let newX = player.x;
    let newY = player.y;

    if (keys['w']) newY -= player.speed;
    if (keys['s']) newY += player.speed;
    if (keys['a']) newX -= player.speed;
    if (keys['d']) newX += player.speed;

    // Check collision with the tilemap
    const { row, col } = pixelToTile(newX + player.width / 2, newY + player.height);
    if (tilemap[row] && tilemap[row][col] === TILE_EMPTY) {
        player.x = newX;
        player.y = newY;
    }

    updatePlayerCollision();
    sendPlayerMove();
}

// Function to update the player's collision attribute
function updatePlayerCollision() {
    const footX = player.x + player.width / 2;
    const footY = player.y + player.height;
    player.collisionPoint = { x: footX, y: footY };
}

// Function to send the player's movement to the server
function sendPlayerMove() {
    const direction = {
        x: keys['d'] - keys['a'], // 1 for right, -1 for left, 0 for no horizontal movement
        y: keys['s'] - keys['w']  // 1 for down, -1 for up, 0 for no vertical movement
    };

    ws.send(JSON.stringify({
        type: 'playerMove',
        id: player.id,
        x: player.x,
        y: player.y,
        speed: player.speed,
        direction: direction,
        collision: player.collisionPoint
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
            otherPlayers[id] = {
                ...serverPlayers[id], // Copy all attributes from the server
                color: serverPlayers[id].color || "white" // Default to white if color is missing
            };
        }
    });
}

function placeBomb() {
    const { x, y } = player.collisionPoint;
    const { row, col } = pixelToTile(x, y);

    ws.send(JSON.stringify({
        type: 'placeBomb',
        row,
        col
    }));
}