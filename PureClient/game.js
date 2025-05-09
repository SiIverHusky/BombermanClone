import { player1, player2, updatePlayer, drawPlayer } from './player.js';

// Initialize WebSocket connection
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
    console.log('Connected to the server');
    ws.send(JSON.stringify({ type: 'playerReady', roomCode }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'initialize':
            initializeGame(data);
            gameLoop(); // Start the game loop
            break;
        case 'updatePlayers':
            updatePlayers(data.players);
            break;
        case 'updateBombs':
            updateBombs(data.bombs);
            break;
        case 'gameOver':
            handleGameOver(data);
            break;
        default:
            console.warn('Unknown message type:', data.type);
    }
};

ws.onclose = () => {
    console.log('Disconnected from the server');
};

function initializeGame(data) {
    player1.username = data.player1.username;
    player2.username = data.player2.username;
    setPlayerPosition(player1, data.player1.row, data.player1.col);
    setPlayerPosition(player2, data.player2.row, data.player2.col);
}

function updatePlayers(serverPlayers) {
    Object.assign(player1, serverPlayers.player1);
    Object.assign(player2, serverPlayers.player2);
}

function handleGameOver(data) {
    alert(`Game Over! Winner: ${data.winner}`);
    window.location.href = '/waiting.html';
}

function updateBombs(serverBombs) {
    bombs.length = 0;
    bombs.push(...serverBombs);
}

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

    // Update and draw both players
    updatePlayer(player1);
    updatePlayer(player2);
    drawPlayer(player1);
    drawPlayer(player2);

    // Request the next frame
    requestAnimationFrame(gameLoop);
}