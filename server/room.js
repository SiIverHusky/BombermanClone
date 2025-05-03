
const rooms = new Map(); // roomCode -> { players: [], status: 'waiting' }

function createRoom(req, res) {
	let roomCode;
    do {
        roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    } while (rooms.has(roomCode));
    rooms.set(roomCode, { players: [ { id: req.session.id, username: req.session.user.username || 'Host' } ], status: 'waiting' });

    console.log(req.session.id, req.session.user, "created room", roomCode);
    
    res.status(200).json({ roomCode });
}

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
    res.status(200).json({ message: 'Join-room successful' });
}

function destroyRoom(roomCode){
    //TODO
    
}

function setupRoomWebSocket(server) {
    const { Server } = require("socket.io");
    const io = new Server(server);

    io.on("connection", (socket) => {
        const roomCode = socket.handshake.query.roomCode;
        if (!rooms.has(roomCode)) {
            socket.emit("error", { message: "Room does not exist" });
            socket.disconnect();
            return;
        }

        const room = rooms.get(roomCode);
        socket.join(roomCode); // Add socket to room

        // Client request to get room status
        socket.on("getRoomStatus", () => {
            socket.emit("roomStatus", { players: room.players, status: room.status });
        });

        // Broadcast room status 
        io.to(roomCode).emit("roomStatus", { players: room.players, status: room.status });

        // Game start condition
        if (room.players.length === 2 && room.status === "waiting") {
            room.status = "started";
            io.to(roomCode).emit("gameStarted");
        }

        socket.on("disconnect", () => {
            if (room.players.length < 2 && room.status === "started") {
                room.status = "waiting";
                io.to(roomCode).emit("error", { message: "Opponent disconnected" });
                rooms.delete(roomCode);
            }
        });
    });
}

module.exports = { createRoom, joinRoom, setupRoomWebSocket, destroyRoom };