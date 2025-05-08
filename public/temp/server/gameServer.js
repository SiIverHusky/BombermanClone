const WebSocket = require('ws');
const { initializeGame, handleBombExplosions } = require('./gameLogic');
const { placeItems, handleItemCollection, broadcastItemState } = require('./itemManager');
const { addPlayer, removePlayer, processPlayerMove, processPlaceBomb, broadcastPlayerState } = require('./playerManager');

// Initialize the game state
initializeGame();
placeItems(); // Place items on the map

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

console.log("Server started on ws://localhost:8080");

// Game timer (3 minutes in milliseconds)
const GAME_DURATION = 3 * 60 * 1000; // 3 minutes
let gameStartTime = Date.now();
let gameEnded = false;

// Handle new client connections
wss.on('connection', (ws) => {
    const playerId = `player-${Date.now()}`; // Generate a unique player ID
    addPlayer(playerId);

    // Send initial game state to the new player
    ws.send(JSON.stringify({
        type: 'initialize',
        playerId,
        tilemap: gameState.tilemap,
        items: gameState.items,
        players: gameState.players,
        timer: GAME_DURATION - (Date.now() - gameStartTime) // Remaining time
    }));

    console.log(`Player ${playerId} connected.`);

    // Handle messages from the client
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (gameEnded) return; // Ignore messages if the game has ended

        switch (data.type) {
            case 'playerMove':
                processPlayerMove(data.id, data.x, data.y);
                break;
            case 'placeBomb':
                processPlaceBomb(data.id);
                break;
            case 'itemCollected':
                handleItemCollection(data.id, data.item);
                break;
            default:
                console.log(`Unknown message type: ${data.type}`);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        removePlayer(playerId);
        console.log(`Player ${playerId} disconnected.`);
    });
});

// Periodically handle game updates and broadcast state to all clients
const gameInterval = setInterval(() => {
    if (gameEnded) {
        clearInterval(gameInterval); // Stop the game loop if the game has ended
        return;
    }

    // Handle bomb explosions
    handleBombExplosions();

    // Broadcast player and item updates
    broadcastPlayerState(wss);
    broadcastItemState(wss);

    // Broadcast the remaining time
    const remainingTime = GAME_DURATION - (Date.now() - gameStartTime);
    broadcastTimer(wss, remainingTime);

    // Check for end game conditions
    checkEndGameCondition(wss, remainingTime);
}, 100); // Run every 100ms

// Function to broadcast the remaining time to all clients
function broadcastTimer(wsServer, remainingTime) {
    wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'updateTimer',
                remainingTime
            }));
        }
    });
}

// Function to check for end game conditions
function checkEndGameCondition(wsServer, remainingTime) {
    // Check if the timer has run out
    if (remainingTime <= 0) {
        endGame(wsServer, "Time's up! The game is a draw.");
        return;
    }

    // Check if one player is dead
    const alivePlayers = Object.values(gameState.players).filter(player => !player.isDead);
    if (alivePlayers.length <= 1) {
        const winner = alivePlayers[0] ? alivePlayers[0].id : null;
        const message = winner ? `Player ${winner} wins!` : "No players left alive. The game is a draw.";
        endGame(wsServer, message);
    }
}

// Function to end the game and broadcast the result
function endGame(wsServer, message) {
    gameEnded = true;

    // Broadcast the end game message to all clients
    wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'endGame',
                message
            }));
        }
    });

    console.log("Game ended:", message);
}