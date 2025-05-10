const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username");
const roomCode = urlParams.get("roomCode");

window.addEventListener("keydown", inputHandler);
window.addEventListener("keyup", inputHandler);

let player1 = {
	username: null,
	position: { x: 0, y: 0 },
	tilePos: { row: 0, col: 0 },
	color: null,
	keys: [],
	alive: false,
	coins: 0,
	maxRange: 1,
	bombCount: 10,
	width: 16 * scale,
	height: 24 * scale
}

let player2 = {
	username: null,
	position: { x: 0, y: 0 },
	tilePos: { row: 0, col: 0 },
	color: null,
	keys: [],
	alive: false,
	coins: 0,
	maxRange: 1,
	bombCount: 10,
    width: 16 * scale,
	height: 24 * scale
}

// WebSocket connection
const ws = io("/game", { query: { roomCode } });

ws.on("connect", () => {
	console.log("Connected to the server!");
	ws.emit("playerReady", { roomCode }); // Notify the server that the player is ready
});

ws.on("timerUpdate", (data) => {
    updateTimerDisplay(data.seconds);
});

//io.to(roomCode).emit('timerUpdate', { seconds: Math.floor(remainingTime / 1000) });

ws.on("initialize", (data) => {
    initializeGame(data);
})

ws.on("error", (error) => {
	console.error("WebSocket error:", error);
});

ws.on("disconnect", () => {
	console.log("Disconnected from the server.");
});

ws.on("updatePlayer", (data) => {
    const player = data.username === player1.username ? player1 : player2;
    player.position = data.position;
    player.tilePos = data.tilePos;
    player.keys = data.keys;
    player.latestKey = data.latestKey;
    player.alive = data.alive;
    player.coins = data.coins;
});

function sendPlayerUpdate(player) {
    ws.emit("updatePlayer", {
        username: player.username,
        position: player.position,
        tilePos: player.tilePos,
        keys: player.keys,
        latestKey: player.latestKey,
        alive: player.alive,
        coins: player.coins
    });
}

ws.on("updateTilemap", (data) => {
    tilemap = data.tilemap;
    // console.log("Tilemap updated:", tilemap);
});

function sendTilemapUpdate(tilemap) {
    ws.emit("updateTilemap", { tilemap }, (response) => {
        if (response.success) {
            console.log("Tilemap update processed successfully:", response.message);
        } else {
            console.error("Tilemap update failed:", response.message);
        }
    });
}

ws.on("updateBombs", (data) => {
    bombs = data.bombs;
    // console.log("Bombs updated:", bombs);
});

function sendBombsUpdate(bombs) {
    ws.emit("updateBombs", { bombs }, (response) => {
        if (response.success) {
            // console.log("Bombs update processed successfully:", response.message);
        } else {
            console.error("Bombs update failed:", response.message);
        }
    });
}

ws.on("updateItems", (data) => {
    items = data.items;
    // console.log("Items updated:", items);
});

ws.on("gameOver", (data)=>{
    alert(data.message);
    window.location.href = `waiting.html?roomCode=${encodeURIComponent(roomCode)}&username=${encodeURIComponent(username)}`;
})

function sendItemsUpdate(items) {
    ws.emit("updateItems", { items }, (response) => {
        if (response.success) {
            // console.log("Items update processed successfully:", response.message);
        } else {
            console.error("Items update failed:", response.message);
        }
    });
}

function initializeGame(data) {
	console.log("Game initialized with data:", data);

	tilemap = data.tilemap;
	items = data.items;
    
	const playersArray = Object.values(data.players);
    player1 = playersArray.find(player => player.color === "red");
    player1.color = "red";
    player2 = playersArray.find(player => player.color === "blue");
    player2.color = "blue";

	player1.position = tileToPixel(player1.tilePos.row, player1.tilePos.col, true)
	player2.position = tileToPixel(player2.tilePos.row, player2.tilePos.col, true);

	gameLoop();
}

function inputHandler(event) {
    const currentPlayer = username === player1.username ? player1 : player2;

    if (!currentPlayer.keys) {
        currentPlayer.keys = [];
    }

    const keyMap = [
        "w", "a", "s", "d", // WASD
        " ",                // Space
        "g"                 // God Key
    ];

    if (keyMap.includes(event.key.toLowerCase())) {
        if (event.type === 'keydown' && !currentPlayer.keys.includes(event.key)) {
            currentPlayer.keys.push(event.key);
            if (["w", "a", "s", "d"].includes(event.key.toLowerCase())) {
                currentPlayer.latestKey = event.key.toLowerCase();
            } else if (event.key === ' ') {
                console.log("Space key pressed");
                placeBomb(currentPlayer, tilemap); // Call placeBomb for Space key
            }
			sendPlayerUpdate(currentPlayer);
        } else if (event.type === 'keyup') {
            const index = currentPlayer.keys.indexOf(event.key);
            if (index > -1) {
                currentPlayer.keys.splice(index, 1);
            }

            // Update latestKey if the released key was the latest
            if (currentPlayer.latestKey === event.key.toLowerCase()) {
                currentPlayer.latestKey = currentPlayer.keys.find(key => ["w", "a", "s", "d"].includes(key)) || null;
            }
			sendPlayerUpdate(currentPlayer);
        }
    }
}

function drawPlayer(player) {
    // Determine the animation state based on player movement
    let animationState = "stillDown";
    if (player.keys.includes("w")) {
        animationState = "walkUp";
    } else if (player.keys.includes("s")) {
        animationState = "walkDown";
    } else if (player.keys.includes("a")) {
        animationState = "walkLeft";
    } else if (player.keys.includes("d")) {
        animationState = "walkRight";
    } else {
        if (player.latestKey === "w") animationState = "stillUp";
        else if (player.latestKey === "s") animationState = "stillDown";
        else if (player.latestKey === "a") animationState = "stillLeft";
        else if (player.latestKey === "d") animationState = "stillRight";
    }

    // Update the frame index for animations
    const frameIndex = Math.floor(Date.now() / 200) % 3; // Cycle through frames every 200ms

    // Draw the player sprite
    spritePlayer(player, animationState, frameIndex);
}


function drawAllPlayers() {
	drawPlayer(player1);
	drawPlayer(player2);
}

// function drawPlayer2(player) {
//     ctx.fillStyle = player.color;
//     console.log("Drawing player:", player);
//     console.log(player.position.x-player.width/2, player.position.y-player.height, player.width, player.height)
//     ctx.fillRect(player.position.x-player.width/2, player.position.y-player.height, player.width, player.height);
// }

function updateTimerDisplay(seconds) {
    $("#timer").text(`Timer: ${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2, '0')}`);
}

function gameLoop() {
    // console.log("Game loop running...");
	ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

	if (player1.keys) {
        player1.keys.forEach(key => {
            if (["w", "a", "s", "d"].includes(key.toLowerCase())) {
                console.log(`Player ${player1.username} pressed ${key}`);
                movePlayer(player1, key.toLowerCase());
            }
        });
    }

    if (player2.keys) {
        player2.keys.forEach(key => {
            if (["w", "a", "s", "d"].includes(key.toLowerCase())) {
                console.log(`Player ${player2.username} pressed ${key}`);
                movePlayer(player2, key.toLowerCase());
            }
        });
    }

	checkItemCollection(player1);
    checkItemCollection(player2);

    drawBounds();
	drawFloor();
	drawGrid();

	drawTilemap();
	drawItems();
	drawAllPlayers();
	drawBombs();
    drawExplosions();

	requestAnimationFrame(gameLoop);
}