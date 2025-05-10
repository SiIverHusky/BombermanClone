const {rooms} = require('../room.js');
const {initializeGameState} = require('./gameInitialize.js');

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

		if (room.sockets && room.sockets.includes(socket.id)) {
			console.log("Socket already in room:", socket.id);
			socket.disconnect();
			return;
		}

		rooms.sockets = rooms.sockets || [];
		room.sockets.push(socket.id);

		if (!rooms.players.some(player => player.key === "player1")) {
			socket.playerKey = "player1";
		} else if (!rooms.players.some(player => player.key === "player2")) {
			socket.playerKey = "player2";
		} else {
			console.log("Room is full");
			socket.emit("error", {message: "Room is full"});
			socket.disconnect();
			return;
		}

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
		function handleUpdate(eventName, dataKey, room, session, socket, roomCode, callback) {
			const player = room.players.find(player => player.username === session.user.username);
			if (player) {
				socket.to(roomCode).emit(eventName, {
					[dataKey]: data[dataKey],
					player: player.username
				});

				if (callback) {
					callback({ success: true, message: `${eventName} processed successfully` });
				}
			} else {
				if (callback) {
					callback({ success: false, message: "Player not found" });
				}
			}
		}

		socket.on("updatePlayer", (data, callback) => {
			const player = room.players.find(player => player.username === session.user.username);
			if (player) {
				Object.assign(player, {
					position: data.position,
					tilePos: data.tilePos,
					keys: data.keys,
					latestKey: data.latestKey,
					alive: data.alive,
					coins: data.coins
				});

				socket.to(roomCode).emit("updatePlayer", {
					username: player.username,
					position: player.position,
					tilePos: player.tilePos,
					color: player.color,
					keys: player.keys,
					alive: player.alive,
					coins: player.coins
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
			handleUpdate("updateTilemap", "tilemap", room, session, socket, roomCode, callback);
		});

		socket.on("updateBombs", (data, callback) => {
			handleUpdate("updateBombs", "bombs", room, session, socket, roomCode, callback);
		});

		socket.on("updateItems", (data, callback) => {
			handleUpdate("updateItems", "items", room, session, socket, roomCode, callback);
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

	const gameState = initializeGameState(roomCode, players, io);
	activeGames.set(roomCode, gameState);

	io.to(roomCode).emit("initialize", {
		tilemap: gameState.tilemap,
		players: gameState.players,
		items: gameState.items,
		bombs: gameState.bombs
	});

	const gameInterval = setInterval(() => {
		if (gameState.gameEnded) {
			clearInterval(gameInterval);
			activeGames.delete(roomCode);
			console.log(`Game ended for room ${roomCode}`);
			
			return;
		}

		// TODO: Game logic updates
		broadcastTilemapUpdate(roomCode, gameState, io);
		broadcastItemUpdate(roomCode, gameState, io);
		broadcastPlayerUpdate(roomCode, gameState, io);
		broadcastBombUpdate(roomCode, gameState, io);
		broadcastTimerUpdate(roomCode, GAME_DURATION - (Date.now() - gameState.gameStartTime), io);
		checkEndGame(roomCode, gameState, io);
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
		io.to(roomCode).emit('gameOver', { winner: alivePlayers[0] });
	}

	const elapsedTime = Date.now() - gameState.gameStartTime;
	if (elapsedTime >= GAME_DURATION) {
		gameState.gameEnded = true;
		const maxCoins = Math.max(...players.map(player => player.coins));
		let playerWithMaxCoins = players.filter(player => player.coins === maxCoins);
		if (playerWithMaxCoins.length === 1) {
			io.to(roomCode).emit('gameOver', { winner: playerWithMaxCoins[0] });
		} else {
			io.to(roomCode).emit('gameOver', { winner: null });
		}
	}
}
function endGame(roomCode, gameState, message, io) {
	gameState.gameEnded = true;
	io.to(roomCode).emit('gameOver', { message });
	activeGames.delete(roomCode);
	console.log(`Game ended for room ${roomCode}`);
}