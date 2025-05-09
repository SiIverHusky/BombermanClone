const { initializeGameState, handleBombExplosions } = require('./gameLogic');
const { addPlayer, removePlayer, processPlayerMove } = require('./playerManager');
const { placeItems, handleItemCollection } = require('./itemManager');
const { placeBomb, updateBombManager } = require('./bombManager');

const { rooms } = require("../room");

// Game constants
const GAME_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds
const activeGames = new Map(); // Map to track active games by roomCode
const playerReadiness = new Map(); // Track readiness for each room

function setupGameWebSocket(io, authSession) {
    io.use((socket, next) => {
        authSession(socket.request, {}, next);
    });

    io.on("connection", (socket) => {
        const roomCode = socket.handshake.query.roomCode;
        const session = socket.request.session;
        console.log("Game socket connected to room:", roomCode);

        if (!session.user) {
            socket.emit("error", { message: "User not authenticated" });
            socket.disconnect();
            return;
        }

        if (!rooms.has(roomCode)) {
            socket.emit("error", { message: "Room does not exist" });
            socket.disconnect();
            return;
        }

        const room = rooms.get(roomCode);

        // Prevent duplicate connections
        if (room.sockets && room.sockets.includes(socket.id)) {
            console.log(`Duplicate connection detected for socket ${socket.id} in room ${roomCode}`);
            socket.disconnect();
            return;
        }

        room.sockets = room.sockets || [];
        room.sockets.push(socket.id);

        // Assign player ownership
        if (!room.players.some(player => player.key === "player1")) {
            socket.playerKey = "player1";
        } else if (!room.players.some(player => player.key === "player2")) {
            socket.playerKey = "player2";
        } else {
            console.log("Room is full. Disconnecting socket:", socket.id);
            socket.emit("error", { message: "Room is full" });
            socket.disconnect();
            return;
        }

        console.log(`Player ${session.user.username} assigned as ${socket.playerKey}`);
        socket.join(roomCode);

        socket.on("playerReady", () => {
            if (!playerReadiness.has(roomCode)) {
                playerReadiness.set(roomCode, new Set());
            }

            const readyPlayers = playerReadiness.get(roomCode);
            readyPlayers.add(socket.id);

            console.log(`Player ${socket.id} is ready in room ${roomCode}`);

            // Check if all players are ready
            if (readyPlayers.size === room.players.length) {
                if (activeGames.has(roomCode)) {
                    console.log(`Game for room ${roomCode} is already running.`);
                    return;
                }

                console.log(`All players are ready in room ${roomCode}. Starting the game...`);
                startGameForRoom(roomCode, room.players, io);
            }
        });

        // Check if the player is in the room
        if (!room.players.some(player => player.username === session.user.username)) {
            console.log("User not in room:", session.user.username, room.players);
            socket.emit("error", { message: "User not in room" });
            socket.disconnect();
            return;
        }

        /* Main Game logic */
        console.log("Players in the room:", room.players);

        socket.on("playerMove", (data) => {
            console.log("Player move event received:", data);
            const gameState = activeGames.get(roomCode);
            if (!gameState) return;

            // Process the player's movement
            const moveSuccessful = processPlayerMove(gameState, data.id, data.direction, data.speed);

            if (moveSuccessful) {
                // Broadcast the updated player state to all clients
                broadcastPlayerUpdate(roomCode, gameState, io);
            } else {
                // Send the corrected position back to the player
                const player = gameState.players[data.id];
                socket.emit("updatePlayerPosition", { x: player.x, y: player.y });
            }
        });

        socket.on("placeBomb", (data) => {
            const gameState = activeGames.get(roomCode);
            if (!gameState) return;

            placeBomb(roomCode, data, gameState, io); // Call the placeBomb function
        });

        socket.on("playerHit", (data) => {
            const gameState = activeGames.get(roomCode);
            if (!gameState) return;

            handlePlayerHit(roomCode, gameState, data.playerId, io);
        });

        socket.on("playerInput", (data) => {
            console.log("Player input event received:", data);
            const gameState = activeGames.get(roomCode);
            if (!gameState) return;

            const { username, input } = data;
            const player = gameState.players[username];
            if (!player || player.isDead) return;

            // Process movement inputs (W, A, S, D)
            const directionMap = {
                W: { x: 0, y: -1 },
                A: { x: -1, y: 0 },
                S: { x: 0, y: 1 },
                D: { x: 1, y: 0 }
            };

            if (directionMap[input]) {
                const moved = processPlayerMove(gameState, username, directionMap[input]);
                if (moved) {
                    console.log(`${username} moved`);
                    // Broadcast updated positions of all players
                    io.to(roomCode).emit("updatePlayers", {
                        players: gameState.players
                    });
                }
            }

            // Handle special inputs (Spacebar and G)
            if (input === "Spacebar") {
                console.log(`${username} pressed Spacebar`);
                placeBomb(roomCode, { username }, gameState, io);
            } else if (input === "G") {
                console.log(`${username} pressed G`);
                // Add logic for G action (e.g., special ability)
            }
        });

        socket.on("disconnect", () => {
            console.log(`Player disconnected from game: ${socket.id}, Room: ${roomCode}`);
            if (playerReadiness.has(roomCode)) {
                playerReadiness.get(roomCode).delete(socket.id);
            }
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
    const gameState = initializeGameState(roomCode, players);

    activeGames.set(roomCode, gameState);

    console.log("Players in the game:", gameState.players);


    // Broadcast the initial game state to all clients in the room
    wss.to(roomCode).emit('initialize', {
        tilemap: gameState.tilemap,
        players: {
            player1: Object.values(gameState.players)[0], // Map the first player
            player2: Object.values(gameState.players)[1]  // Map the second player
        },
        items: gameState.items
    });

    // Start the game loop
    const gameInterval = setInterval(() => {
        if (gameState.gameEnded) {
            clearInterval(gameInterval);
            activeGames.delete(roomCode);
            console.log(`Game for room ${roomCode} has ended.`);

            // Notify all players about the game end
            wss.to(roomCode).emit('gameOver', {
                message: 'Game Over',
                username: Object.keys(gameState.players) // Send usernames of players
            });
            return;
        }

        updateBombManager(roomCode, gameState, wss);
        broadcastTilemapUpdate(roomCode, gameState, wss);
        broadcastPlayerUpdate(roomCode, gameState, wss);
        broadcastItemUpdate(roomCode, gameState, wss);
        broadcastTimerUpdate(roomCode, GAME_DURATION - (Date.now() - gameState.gameStartTime), wss);
        checkEndGameCondition(roomCode, gameState, wss);
    }, 100);
}

function broadcastTilemapUpdate(roomCode, gameState, wss) {
    wss.to(roomCode).emit('updateTilemap', { tilemap: gameState.tilemap });
}

function broadcastPlayerUpdate(roomCode, gameState, wss) {
    wss.to(roomCode).emit('updatePlayers', {
        players: {
            player1: gameState.players.player1,
            player2: gameState.players.player2
        }
    });
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
    gameState.gameEnded = true;

    wss.to(roomCode).emit('gameOver', { message });
    const room = rooms.get(roomCode);
    if (room) {
        room.status = "gameover";
    }
    console.log(`Game for room ${roomCode} ended: ${message}`);
}

module.exports = { setupGameWebSocket };