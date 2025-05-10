// Extract username from the URL query
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username");

// Extract roomCode from the URL query
const roomCode = urlParams.get("roomCode");



const ws = io("/game", { query: { roomCode } });


// WebSocket 연결 성공
ws.on("connect", () => {
    console.log("Connected to the server!");
    ws.emit("playerReady", { roomCode }); // Notify the server that the player is ready
});

// WebSocket 에러
ws.on("error", (error) => {
    console.error("WebSocket error:", error);
});

// WebSocket 연결 종료
ws.on("disconnect", () => {
    console.log("Disconnected from the server.");
});

// 서버로부터 수신된 이벤트 처리
ws.on("initialize", (data) => {
    initializeGame(data);
    gameLoop(); // Start the game loop
});

ws.on("updateTilemap", (data) => {
    updateTilemap(data.tilemap); // Update the local tilemap with server data
});

ws.on("updatePlayers", (data) => {
    updatePlayers(data.players); // Sync players' positions
});

ws.on("updateItems", (data) => {
    updateItems(data.items); // Sync items on the map
});

ws.on("timerUpdate", (data) => {
    updateTimerDisplay(data.seconds * 1000); // 서버는 초 단위로 보냄
});

ws.on("gameOver", (data) => {
    console.log("Game over event received:", data);
    const redirectUrl = `/waiting.html?roomCode=${roomCode}&username=${username}`;
    window.location.href = redirectUrl;
});

ws.on("updateBombs", (data) => {
    updateBombs(data.bombs); // Update bombs with the server's data
});

ws.on("updateExplosions", (data) => {
    explosions.push(...data.explosions); // Add new explosions from the server
});

// Function to handle input and send to server
function handleInput(key) {
    const validKeys = ["W", "A", "S", "D", " ", "G"];
    if (validKeys.includes(key.toUpperCase())) {
        console.log("Key pressed:", key.toUpperCase());
        if (username === player1.username) {
            ws.emit("playerInput", { input: key.toUpperCase(), username: username, tile: pixelToTile(player1.collisionPoint.x, player1.collisionPoint.y) });
        }
        else {
            ws.emit("playerInput", { input: key.toUpperCase(), username: username, tile: pixelToTile(player2.collisionPoint.x, player2.collisionPoint.y) });
        }
    }
}

// Map to track key states
const keyState = {};

// Event listener for keydown
window.addEventListener("keydown", (event) => {
    if (!keyState[event.key]) {
        keyState[event.key] = true;
        handleInput(event.key);
    }
});

// Event listener for keyup
window.addEventListener("keyup", (event) => {
    keyState[event.key] = false;
});

// Initializing function
function initializeGame(data) {
    console.log("Initializing game with data:", data);

    player1.username = data.players.player1.username;
    row = data.players.player1.row;
    col = data.players.player1.col;
    player1.x = tileToPixel(row, col).x + arenaX ;
    player1.y = tileToPixel(row, col).y + arenaY;
    
    player2.username = data.players.player2.username;
    row = data.players.player2.row;
    col = data.players.player2.col;
    player2.x = tileToPixel(row, col).x + arenaX - player2.width / 4;
    player2.y = tileToPixel(row, col).y + arenaY - player2.height / 4;


    updateTilemap(data.tilemap); // Initialize the tilemap
    updateItems(data.items); // Initialize items
}

function updatePlayers(serverPlayers) {
    // Update player1's position if it exists in the server data
    if (serverPlayers[player1.username]) {
        player1.x = serverPlayers[player1.username].x * scale + arenaX;
        player1.y = serverPlayers[player1.username].y * scale + arenaY;
    }

    // Update player2's position if it exists in the server data
    if (serverPlayers[player2.username]) {
        player2.x = serverPlayers[player2.username].x * scale + arenaX;
        player2.y = serverPlayers[player2.username].y * scale + arenaY;
    }

    // Redraw players after updating their positions
    drawPlayers();
}

// Function to check if a player is hit by an explosion
function checkPlayerHit(player) {
    explosions.forEach(explosion => {
        const { row, col } = player.collisionPoint;
        if (explosion.row === row && explosion.col === col) {
            player.isDead = true;
            player.color = "red";
            console.log(`${player.username} was hit by an explosion!`);

            // Emit the player hit event to the server
            ws.emit("playerHit", { playerUsername: player.username });
        }
    });
}

// 타이머 디스플레이 업데이트
function updateTimerDisplay(remainingTime) {
    const timerElement = document.getElementById("timer");
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    timerElement.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// 게임 종료 처리
function handleEndGame(message) {
    alert(message);
    window.location.href = "/waiting.html" + `?roomCode=${roomCode}`;
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

// Function to update bombs from server data
function updateBombs(serverBombs) {
    bombs.length = 0;
    bombs.push(...serverBombs);
}

// Updated game loop to integrate bomb logic and synchronize with the server
gameLoop = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBounds();
    drawFloor();
    drawGrid();
    drawTilemap();
    drawItems();
    updatePlayerPosition();
    drawPlayers();
    drawBombs();
    drawExplosions();

    // Update bombs and explosions
    updateBombs();

    // Check if players are hit by explosions
    checkPlayerHit(player1);
    checkPlayerHit(player2);

    requestAnimationFrame(gameLoop);
};

// Add logic to handle exiting the room
function exitRoom() {
    const redirectUrl = `/home.html?username=${username}`;
    window.location.href = redirectUrl;
}

// Function to remove the earliest placed bomb (notify the server)
function popBomb() {
    ws.send(JSON.stringify({
        type: 'popBomb'
    }));

    console.log("Requested to remove the earliest placed bomb.");
}

// Function to render both players
function drawPlayers() {
    if (username === player1.username) {
        drawPlayerWithAnimation(player1, keyState);
        drawPlayerWithAnimation(player2);
    } else {
        drawPlayerWithAnimation(player2, keyState);
        drawPlayerWithAnimation(player1);
    }
}