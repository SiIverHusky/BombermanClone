const { initializeGameState, handleBombExplosions } = require('./gameLogic');
const { addPlayer, removePlayer, processPlayerMove, processPlaceBomb } = require('./playerManager');
const { placeItems, handleItemCollection } = require('./itemManager');
const { rooms } = require("../room");

// Game constants
const GAME_DURATION = 3 * 2 * 1000; // 3 minutes in milliseconds
const activeGames = new Map(); // Map to track active games by roomCode

function setupGameWebSocket(io, authSession) {
    io.use((socket, next) => {
        authSession(socket.request, {}, next);
    });

    io.on("connection", (socket) => {
        const roomCode = socket.handshake.query.roomCode;
        const session = socket.request.session;
        console.log("Game socket connected to room:", roomCode);

        // Check if the user is authenticated
        if (!session.user) {
            socket.emit("error", { message: "User not authenticated" });
            socket.disconnect();
            return;
        }

        // Check if the roomCode is valid
        if (!rooms.has(roomCode)) {
            socket.emit("error", { message: "Room does not exist" });
            socket.disconnect();
            return;
        }

        // Check if the player is in the room
        const room = rooms.get(roomCode);
        if (!room.players.some(player => player.username === session.user.username)) {
            console.log("User not in room:", session.user.username, room.players);
            socket.emit("error", { message: "User not in room" });
            socket.disconnect();
            return;
        }

        socket.join(roomCode); // Add socket to room

        /* Main Game logic */
        console.log("Players in the room:", room.players);
        startGameForRoom(roomCode, room.players, io);

        socket.on("playerMove", (data) => {
            console.log("Player move event received:", data);
            const gameState = activeGames.get(roomCode);
            if (!gameState) return;

            // Process the player's movement
            const moveSuccessful = processPlayerMove(gameState, data.id, data.direction, data.speed);

            if (moveSuccessful) {
                // Broadcast the updated player state to other clients
                broadcastPlayerUpdate(roomCode, gameState, io);
            } else {
                // Send the corrected position back to the player
                const player = gameState.players[data.id];
                socket.emit("updatePlayerPosition", { x: player.x, y: player.y });
            }
        });

        socket.on("playerHit", (data) => {
            const gameState = activeGames.get(roomCode);
            if (!gameState) return;

            handlePlayerHit(roomCode, gameState, data.playerId, io);
        });

        socket.on("disconnect", () => {
            console.log(`Player disconnected from game: ${socket.id}, Room: ${roomCode}`);
        });
    });
}

function startGameForRoom(roomCode, players, wss) {
    if (activeGames.has(roomCode)) {
        console.log(`Game for room ${roomCode} is already running.`);
        return;
    }

    console.log(`Starting game for room ${roomCode}...`);

    // Initialize the game state for this room and store it in activeGames
    const gameState = initializeGameState(roomCode, players);
    console.log("Tilemap initialized:", gameState.tilemap);

    activeGames.set(roomCode, gameState);

    //console.log("Players in the game:", gameState.players);

    // Broadcast the initial game state to all clients in the room
    wss.to(roomCode).emit('initialize', {
        tilemap: gameState.tilemap,
        players: gameState.players,
        items: gameState.items,
        playerId: players[0].id // Assuming the first player is the one starting the game
    });

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

        // Broadcast updates
        broadcastTilemapUpdate(roomCode, gameState, wss);
        broadcastPlayerUpdate(roomCode, gameState, wss);
        broadcastItemUpdate(roomCode, gameState, wss);

        // Update and broadcast the timer
        const remainingTime = GAME_DURATION - (Date.now() - gameState.gameStartTime);
        broadcastTimerUpdate(roomCode, remainingTime, wss);

        // Check end game condition
        checkEndGameCondition(roomCode, gameState, wss);
    }, 100); // Run every 100ms
}

function broadcastTilemapUpdate(roomCode, gameState, wss) {
    wss.to(roomCode).emit('updateTilemap', { tilemap: gameState.tilemap });
}

function broadcastPlayerUpdate(roomCode, gameState, wss) {
    wss.to(roomCode).emit('updatePlayers', { players: gameState.players });
}

function broadcastItemUpdate(roomCode, gameState, wss) {
    wss.to(roomCode).emit('updateItems', { items: gameState.items });
}

function handlePlayerHit(roomCode, gameState, playerId, wss) {
    const player = gameState.players[playerId];
    if (!player || player.isDead) return;

    player.isDead = true;
    console.log(`Player ${playerId} was hit!`);

    // Broadcast the player hit event
    wss.to(roomCode).emit('playerHit', { playerId });

    // Check if the game should end
    checkEndGameCondition(roomCode, gameState, wss);
}

function broadcastTimerUpdate(roomCode, remainingTime, wss) {
    wss.to(roomCode).emit('timerUpdate', { seconds: Math.floor(remainingTime / 1000) });
}

function checkEndGameCondition(roomCode, gameState, wss) {
    const remainingTime = GAME_DURATION - (Date.now() - gameState.gameStartTime);

    if (remainingTime <= 0) {
        endGame(roomCode, gameState, null, "Time's up! The game is a draw.", wss);
        return;
    }

    const alivePlayers = Object.values(gameState.players).filter(player => !player.isDead);
    if (alivePlayers.length <= 1) {
        const winner = alivePlayers[0] ? alivePlayers[0].id : null;
        const message = winner ? `Player ${winner} wins!` : "No players left alive. The game is a draw.";

        endGame(roomCode, gameState, winner, message, wss);
    }
}
function updateGameLog(roomCode, players, winner) {

    const gameLog = require("../database/gameLog.json");
    gameLog.push({
        roomCode: roomCode,
        winner: winner,
        players: players,
        timestamp: new Date().toISOString()
    });
    //write on the json file
    const fs = require('fs');
    fs.writeFileSync('./server/database/gameLog.json', JSON.stringify(gameLog, null, 2));
}


function updateRanking(roomCode,players, winner) {

    const ranking = require("../database/ranking.json");
    players.forEach(player => {
        const playerData = ranking.find(p => p.username === player.username);
        if (playerData) {
            if (winner === null) {
                playerData.draws += 1;
            }
            else if (player.id === winner) {
                playerData.wins += 1;
            } 
            else {
                playerData.losses += 1;
            }
        } else {
            ranking.push({
                username: player.username,
                wins: player.id === winner && winner != null? 1 : 0,
                losses: player.id === winner && winner != null ? 0 : 1,
                draws: winner === null ? 1 : 0
            });
        }
    });

    // Save the updated ranking to the file
    const fs = require('fs');
    fs.writeFileSync('./server/database/ranking.json', JSON.stringify(ranking, null, 2));


}


function endGame(roomCode, gameState, winner, message, wss) {
    gameState.gameEnded = true;

    wss.to(roomCode).emit('gameOver', { message });
    const room = rooms.get(roomCode);
    if (room) {
        room.status = "gameover";
        const players = []
        room.players.forEach(playerInRoom => {
            const player = gameState.players[playerInRoom.id];
            player["username"] = playerInRoom.username;
            players.push(player)
        })
        
        updateGameLog(roomCode, players, winner);
        updateRanking(roomCode, players, winner);
    }
    console.log(`Game for room ${roomCode} ended: ${message}`);
}

module.exports = { setupGameWebSocket };