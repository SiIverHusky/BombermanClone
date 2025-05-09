const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get("roomCode");
const ws = io("/game", { query: { roomCode } });

// WebSocket 연결 성공
ws.on("connect", () => {
    console.log("Connected to the server!");
    gameLoop();
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
});

ws.on("updateTilemap", (data) => {
    updateTilemap(data.tilemap); // Update the local tilemap with server data
});

ws.on("updatePlayers", (data) => {
    updateOtherPlayers(data.players); // Sync other players' positions
});

ws.on("updateItems", (data) => {
    updateItems(data.items); // Sync items on the map
});

ws.on("playerHit", (data) => {
    handlePlayerHit(data.playerId); // Handle player hit events
});

ws.on("timerUpdate", (data) => {
    updateTimerDisplay(data.seconds * 1000); // 서버는 초 단위로 보냄
});

ws.on("gameOver", (data) => {
    handleEndGame(data.message); // Handle game over events
});

// 초기화 함수
function initializeGame(data) {
    player.id = data.playerId;
    player.x = data.players[player.id].x;
    player.y = data.players[player.id].y;
    player.color = data.players[player.id].color || "white"; // Default to white if color is missing

    updateTilemap(data.tilemap); // Initialize the tilemap
    updateItems(data.items); // Initialize items
    updateOtherPlayers(data.players); // Initialize other players
}

// 플레이어 피격 처리
function handlePlayerHit(playerId) {
    if (player.id === playerId) {
        player.isDead = true;
        player.color = "red";
        console.log("You were hit by an explosion!");
    } else if (otherPlayers[playerId]) {
        otherPlayers[playerId].isDead = true;
        otherPlayers[playerId].color = "red";
        console.log(`Player ${playerId} was hit by an explosion!`);
    }
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

// 게임 루프
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw the arena
    ctx.fillStyle = gray;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = green;
    ctx.fillRect(arenaX, arenaY, arenaWidth, arenaHeight);

    // Draw the tilemap
    drawTilemap();

    // Draw bricks and items
    drawBricks();
    drawItems();
    collectItems();

    // Update and draw the player
    updatePlayer();
    drawPlayer();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Setup
setPlayerPosition(0, 0); // Set initial player position (row, col)

// Start the game loop
gameLoop();