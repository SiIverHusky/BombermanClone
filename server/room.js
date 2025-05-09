//const { startGameForRoom } = require('./game/gameServer'); // Import the function to start the game

// Map to store room data: roomCode -> { players: [], status: 'waiting' }
const rooms = new Map();

// Function to create a new room
function createRoom(req, res) {
    let roomCode;
    do {
        roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    } while (rooms.has(roomCode));

    rooms.set(roomCode, {
        players: [{ id: req.session.id, username: req.session.user.username || 'Host' }],
        status: 'waiting'
    });

    console.log(`Room ${roomCode} created by ${req.session.user.username || 'Host'}`);
    res.status(200).json({ roomCode });
}

// Function to join an existing room
function joinRoom(req, res) {
    const { roomCode } = req.body;

    if (!roomCode || !rooms.has(roomCode)) {
        return res.status(400).json({ status: 'error', message: 'Invalid or non-existent room code' });
    }

    const room = rooms.get(roomCode);

    if (room.players.length >= 2) {
        return res.status(400).json({ status: 'error', message: 'Room is full' });
    }

    room.players.push({ id: req.session.id, username: req.session.user.username || 'Guest' });
    console.log(`${req.session.user.username || 'Guest'} joined room ${roomCode}`);
    res.status(200).json({ message: 'Join-room successful' });
}

// Function to destroy a room
function destroyRoom(roomCode) {
    if (rooms.has(roomCode)) {
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} destroyed.`);
    }
}

// Function to set up WebSocket communication for room management
function setupRoomWebSocket(gameNamespace, authSession) {
    const io = gameNamespace;
    io.on("connection", (socket) => {
        const roomCode = socket.handshake.query.roomCode;

        if (!rooms.has(roomCode)) {
            socket.emit("error", { message: "Room does not exist" });
            socket.disconnect();
            return;
        }

        const room = rooms.get(roomCode);
        socket.join(roomCode); // Add the socket to the room

        console.log(`Socket connected to room ${roomCode}`);

        // Handle client request to get room status
        socket.on("getRoomStatus", () => {
            socket.emit("roomStatus", { players: room.players, status: room.status });
        });

        // Broadcast room status to all clients in the room
        io.to(roomCode).emit("roomStatus", { players: room.players, status: room.status });

        // Handle start game request
        socket.on("startGame", () => {
            if (room.players.length < 2) {
                socket.emit("error", { message: "Not enough players to start the game" });
                return;
            }

            room.status = "started";
            io.to(roomCode).emit("gameStarted");

            // Use the passed gameNamespace to start the game
            //startGameForRoom(roomCode, room.players, gameNamespace);
        });

        // Handle client disconnection
        socket.on("disconnect", () => {
            console.log(`Socket disconnected from room ${roomCode}`);

            if (room.status === "started") {
                return; // Do not destroy the room if the game has started
            }

            // Remove the player from the room
            room.players = room.players.filter(player => player.id !== socket.id);

            // If the room is empty, destroy it
            if (room.players.length === 0) {
                destroyRoom(roomCode);
            } else {
                // Otherwise, update the room status
                io.to(roomCode).emit("roomStatus", { players: room.players, status: room.status });
            }
        });
    });
}

module.exports = { createRoom, joinRoom, destroyRoom, setupRoomWebSocket, rooms };