const ws = io("/game", { query: { roomCode } });


// WebSocket 연결 성공
ws.on("connect", () => {
    console.log("Connected to the server!");
    ws.emit("playerReady", { roomCode }); // Notify the server that the player is ready
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
    updatePlayers(data.players); // Sync players' positions
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

ws.on("updateBombs", (data) => {
    bombs.length = 0; // Clear the local bombs array
    bombs.push(...data.bombs); // Update bombs with the server's data
});

ws.on("updateExplosions", (data) => {
    explosions.push(...data.explosions); // Add new explosions from the server
});

// 초기화 함수
function initializeGame(data) {
    player1.id = data.players[0].id;
    player1.x = data.players[0].x;
    player1.y = data.players[0].y;

    player2.id = data.players[1].id;
    player2.x = data.players[1].x;
    player2.y = data.players[1].y;

    updateTilemap(data.tilemap); // Initialize the tilemap
    updateItems(data.items); // Initialize items
}

function updatePlayers(serverPlayers) {
    if (serverPlayers[player1.id]) {
        Object.assign(player1, serverPlayers[player1.id]);
    }
    if (serverPlayers[player2.id]) {
        Object.assign(player2, serverPlayers[player2.id]);
    }
}

// 플레이어 피격 처리
// function handlePlayerHit(playerId) {
//     if (player.id === playerId) {
//         player.isDead = true;
//         player.color = "red";
//         console.log("You were hit by an explosion!");
//     } else if (otherPlayers[playerId]) {
//         otherPlayers[playerId].isDead = true;
//         otherPlayers[playerId].color = "red";
//         console.log(`Player ${playerId} was hit by an explosion!`);
//     }
// }

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fixed
    drawBounds();
    drawFloor();
    drawGrid();
    drawTilemap(); // Draw the updated tilemap
    drawItems(); // Draw items on the map
    updatePlayerPosition(); // Update the local player's position
    drawPlayers(); // Draw both players
    drawBombs(); // Draw bombs
    drawExplosions(); // Draw explosions

    requestAnimationFrame(gameLoop); // Continue the game loop
}
