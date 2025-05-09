const { initializeGame, handleBombExplosions } = require('./gameLogic');
const { placeItems } = require('./itemManager');
const { rooms } = require("../room");

// Game constants
const GAME_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds
const activeGames = new Map(); // Map to track active games by roomCode

function setupGameWebSocket(io, authSession) {

    io.use((socket, next) => {
        authSession(socket.request, {}, next);
    });

    io.on("connection", (socket) => {
        const roomCode = socket.handshake.query.roomCode;
        const session = socket.request.session;
        console.log("Game socket connected to room:", roomCode);

        //Check if the user is authenticated
        if (!session.user) {
            socket.emit("error", { message: "User not authenticated" });
            socket.disconnect();
            return;
        }
        
        //Check if the roomCode is valid
        if (!rooms.has(roomCode)) {
            socket.emit("error", { message: "Room does not exist" });
            socket.disconnect();
            return;
        }
        //Check if the player is in the room
        if(!rooms.get(roomCode).players.some(player => player.username === session.user.username)) {
            console.log("User not in room:", session.user.username, rooms.get(roomCode).players );
            socket.emit("error", { message: "User not in room" });
            socket.disconnect();
            return;
        }
        const room = rooms.get(roomCode);
        socket.join(roomCode); // Add socket to room

        /* Main Game logic */
        const players = room.players;
        console.log("Players in the room:", players);
        startGameForRoom(roomCode, players, io);


        socket.on("disconnect", () => {
            console.log(`Players disconnected from game: ${socket.id}, Room: ${roomCode}`);
        });

    });

}

function startGameForRoom(roomCode, players, wss) {
    if (activeGames.has(roomCode)) {
        console.log(`Game for room ${roomCode} is already running.`);
        return;
    }

    console.log(`Starting game for room ${roomCode}...`);

    // Initialize the game state for this room
    const gameState = {
        tilemap: Array.from({ length: 11 }, () => Array(13).fill(0)), // Example tilemap
        players: {},
        items: [],
        bombs: [],
        gameEnded: false,
        gameStartTime: Date.now()
    };

    // Add players to the game state
    players.forEach((player, index) => {
        const startPositions = [
            { row: 0, col: 0 },
            { row: 10, col: 12 }
        ];
        const startPosition = startPositions[index];

        gameState.players[player.id] = {
            id: player.id,
            x: startPosition.col * 16 * 4, // TILE_SIZE * scale
            y: startPosition.row * 16 * 4,
            width: 16 * 4,
            height: 24 * 4,
            speed: 0.5 * 4,
            color: index === 0 ? "red" : "blue",
            isDead: false,
            maxBombs: 3,
            bombRange: 3,
            coins: 0,
            collision: { row: startPosition.row, col: startPosition.col }
        };
    });

    // Place items on the map
    placeItems(gameState); ///////////////////////// Error

    // Store the game state in the activeGames map
    activeGames.set(roomCode, gameState);

    // Start the game loop for this room
    const gameInterval = setInterval(() => {
        if (gameState.gameEnded) {
            clearInterval(gameInterval);
            activeGames.delete(roomCode);
            console.log(`Game for room ${roomCode} has ended.`);
            return;
        }

        // Handle game logic (e.g., bomb explosions, timer updates)
        handleBombExplosions(gameState);
        broadcastGameState(roomCode, gameState, wss);
        checkEndGameCondition(roomCode, gameState, wss);
    }, 100); // Run every 100ms
}

function broadcastGameState(roomCode, gameState, wss) {
    if (!wss) {
        console.error("WebSocket namespace (wss) is not defined.");
        return;
    }

    wss.to(roomCode).emit('updateGameState', {
        tilemap: gameState.tilemap,
        players: gameState.players,
        items: gameState.items
    });
}

function checkEndGameCondition(roomCode, gameState, wss) {
    const remainingTime = GAME_DURATION - (Date.now() - gameState.gameStartTime);

    if (remainingTime <= 0) {
        endGame(roomCode, gameState, "Time's up! The game is a draw.", wss);
        return;
    }

    const alivePlayers = Object.values(gameState.players).filter(player => !player.isDead);
    if (alivePlayers.length <= 1) {
        const winner = alivePlayers[0] ? alivePlayers[0].id : null;
        const message = winner ? `Player ${winner} wins!` : "No players left alive. The game is a draw.";
        endGame(roomCode, gameState, message, wss);
    }
}

function endGame(roomCode, gameState, message, wss) {
    if (!wss) {
        console.error("WebSocket namespace (wss) is not defined.");
        return;
    }

    gameState.gameEnded = true;

    
    wss.to(roomCode).emit('gameOver', { message });
    const room = rooms.get(roomCode);
    if (room) {
        room.status = "gameover";
    }
    console.log(`Game for room ${roomCode} ended: ${message}`);

}

module.exports = { setupGameWebSocket };