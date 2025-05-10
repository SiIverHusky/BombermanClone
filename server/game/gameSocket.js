const {rooms} = require('../room.js');
const {initializeGameState} = require('./gameInitialize.js');
const { updateGameLog, updateRanking } = require('./gameOver.js');

const GAME_DURATION = 3*60*1000; // 3 minutes
const activeGames = new Map(); // Store active games by room code
const playerReadiness = new Map(); // Track player readiness by room code

function setupGameWebSocket(io, authSession) {
	io.use((socket, next) => {
		authSession(socket.request, {}, next);	
	});

	io.on('connection', (socket) => { 
		const roomCode = socket.handshake.query.roomCode;
		const session = socket.request.session;
		console.log("Game socket connected:", roomCode);

		if (!session.user) {
			socket.emit("error", "User not authenticated");
			socket.disconnect();
		}

		if (!rooms.has(roomCode)) {
			socket.emit("error", "Room not found");
			socket.disconnect();
			return;
		}

		const room = rooms.get(roomCode);

		if (!room) {
            console.error(`Room with code ${roomCode} not found.`);
            socket.emit("error", "Room not found");
            socket.disconnect();
            return;
        }

        if (!room.sockets) {
            room.sockets = [];
        }

        room.sockets.push(socket.id);

		// if (!rooms.players.some(player => player.key === "player1")) {
		// 	socket.playerKey = "player1";
		// } else if (!rooms.players.some(player => player.key === "player2")) {
		// 	socket.playerKey = "player2";
		// } else {
		// 	console.log("Room is full");
		// 	socket.emit("error", {message: "Room is full"});
		// 	socket.disconnect();
		// 	return;
		// }

		console.log(`Player ${session.user.username} connected to room ${roomCode} with key ${socket.playerKey}`);
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

		if (!room.players.some(player => player.username === session.user.username)) {
            console.log("User not in room:", session.user.username, room.players);
            socket.emit("error", { message: "User not in room" });
            socket.disconnect();
            return;
        }

		// TODO:Game related events
		socket.on("updatePlayer", (data, callback) => {
			
			if (!activeGames.has(roomCode)) { return; }
			const player = activeGames.get(roomCode).players[data.username];
			
			
			if (player) {
				Object.assign(player, {
					position: data.position,
					tilePos: data.tilePos,
					keys: data.keys,
					latestKey: data.latestKey,
					alive: data.alive,
					coins: data.coins,
					bombCount: data.bombCount,
					bombRange: data.bombRange
				});

				socket.to(roomCode).emit("updatePlayer", {
					username: player.username,
					position: player.position,
					tilePos: player.tilePos,
					color: player.color,
					keys: player.keys,
					alive: player.alive,
					coins: player.coins,
					bombCount: player.bombCount,
					bombRange: player.bombRange
				});

				if (callback) {
					callback({ success: true, message: "Player update processed successfully" });
				}
			} else {
				if (callback) {
					callback({ success: false, message: "Player not found" });
				}
			}
		});

		socket.on("updateTilemap", (data, callback) => {
            try {
                activeGames.get(roomCode).tilemap = data.tilemap;
                socket.to(roomCode).emit("updateTilemap", { tilemap: data.tilemap });
                if (callback) callback({ success: true, message: "Tilemap updated successfully." });
            } catch (error) {
                console.error("Error updating tilemap:", error);
                if (callback) callback({ success: false, message: "Failed to update tilemap." });
            }
        });

        socket.on("updateBombs", (data, callback) => {
            try {
                activeGames.get(roomCode).bombs = data.bombs;
				console.log("gameSocket.js line 134 - Bombs updated:", data.bombs);
                //socket.to(roomCode).emit("updateBombs", { bombs: data.bombs });
                broadcastBombUpdate(roomCode, activeGames.get(roomCode), io);
				if (callback) callback({ success: true, message: "Bombs updated successfully." });
            } catch (error) {
                console.error("Error updating bombs:", error);
                if (callback) callback({ success: false, message: "Failed to update bombs." });
            }
        });

        socket.on("updateItems", (data, callback) => {
            try {
                activeGames.get(roomCode).items = data.items;
                socket.to(roomCode).emit("updateItems", { items: data.items });
                if (callback) callback({ success: true, message: "Items updated successfully." });
            } catch (error) {
                console.error("Error updating items:", error);
                if (callback) callback({ success: false, message: "Failed to update items." });
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

function startGameForRoom(roomCode, players, io) {
	if (activeGames.has(roomCode)) {
		console.log(`Game for room ${roomCode} is already running.`);
		return;
	}

	const gameState = initializeGameState(roomCode, players);

	activeGames.set(roomCode, gameState); 

	io.to(roomCode).emit("initialize", {
		tilemap: gameState.tilemap,
		players: gameState.players,
		items: gameState.items,
		bombs: gameState.bombs
	});

	const gameInterval = setInterval(() => {
		

		// TODO: Game logic updates
		broadcastTilemapUpdate(roomCode, gameState, io);
		broadcastItemUpdate(roomCode, gameState, io);
		broadcastPlayerUpdate(roomCode, gameState, io);
		broadcastBombUpdate(roomCode, gameState, io); // Won: Don't need this function here
		broadcastTimerUpdate(roomCode, GAME_DURATION - (Date.now() - gameState.gameStartTime), io);
		checkEndGame(roomCode, gameState, io);

		if (gameState.gameEnded) {
			clearInterval(gameInterval);
			activeGames.delete(roomCode); /////////////////////////
			console.log(`Game ended for room ${roomCode}`);
			
			return;
		}

	}, 100);
}

function broadcastTilemapUpdate(roomCode, gameState, io) {
    io.to(roomCode).emit('updateTilemap', { tilemap: gameState.tilemap });
}

function broadcastItemUpdate(roomCode, gameState, io) {
    io.to(roomCode).emit('updateItems', { items: gameState.items });
}

function broadcastTimerUpdate(roomCode, remainingTime, io) {
    io.to(roomCode).emit('timerUpdate', { seconds: Math.floor(remainingTime / 1000) });
}

function broadcastPlayerUpdate(roomCode, gameState, io) {
	io.to(roomCode).emit('updatePlayers', { players: gameState.players });
}

function broadcastBombUpdate(roomCode, gameState, io) {
	io.to(roomCode).emit('updateBombs', { bombs: gameState.bombs });
}

function checkEndGame(roomCode, gameState, io) {
	const players = Object.values(gameState.players);
	const alivePlayers = players.filter(player => player.alive);

	if (alivePlayers.length <= 1) {
		gameState.gameEnded = true;
		//io.to(roomCode).emit('gameOver', { winner: alivePlayers[0] });
		endGame(roomCode, gameState, alivePlayers[0], "Game Over!",io );
	}

	const elapsedTime = Date.now() - gameState.gameStartTime;
	if (elapsedTime >= GAME_DURATION) {
		gameState.gameEnded = true;
		const maxCoins = Math.max(...players.map(player => player.coins));
		let playerWithMaxCoins = players.filter(player => player.coins === maxCoins);
		if (playerWithMaxCoins.length === 1) {
			//io.to(roomCode).emit('gameOver', { winner: playerWithMaxCoins[0] });
			endGame(roomCode, gameState, playerWithMaxCoins[0], "Game Over!",io );
		} else {
			//io.to(roomCode).emit('gameOver', { winner: null });
			endGame(roomCode, gameState, null, "Game Over!",io ); // Coins are equal, draw.
		}
	}
}

function endGame(roomCode, gameState, winner, message, io) {
    gameState.gameEnded = true;

    io.to(roomCode).emit('gameOver', { message });
    const room = rooms.get(roomCode);
    if (room) {
        room.status = "gameover";
        const players = []
        room.players.forEach(playerInRoom => {
            const player = gameState.players[playerInRoom.username];
            players.push(player)
        })
        
        updateGameLog(roomCode, players, winner);
        updateRanking(roomCode, players, winner);
    }
    console.log(`Game for room ${roomCode} ended: ${message}`);
}

module.exports = {
	setupGameWebSocket
}