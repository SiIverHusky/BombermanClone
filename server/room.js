
const rooms = new Map(); // roomCode -> { players: [], status: 'waiting' }

function createRoom(req, res) {
	let roomCode;
    do {
        roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    } while (rooms.has(roomCode));
    rooms.set(roomCode, { players: [ { id: req.session.id, username: req.session.user.username || 'Host' } ], status: 'waiting' });

    //console.log(req.session.id, req.session.user, "created room", roomCode);
    
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
    rooms.delete(roomCode);
}

// io: namespace for io.of("/game")
function setupRoomWebSocket(io, authSession) {

    io.use((socket, next) => {
        authSession(socket.request, {}, next);
    });

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


        socket.on("startGame", () => {
            if (room.players.length < 2) {
                socket.emit("error", { message: "Not enough players to start the game" });
                return;
            }
            room.status = "started";
            io.to(roomCode).emit("gameStarted");
        });


        socket.on("disconnect", () => {

            if(room.status === "started"){
                return;
            }
            else{
                const user = socket.request.session.user;
                room.players = room.players.filter(item => item.username !== user.username);
                //console.log(user.username, "disconnected from room", roomCode);

                if(room.players.length == 0 && (room.status === "waiting" || room.status === "gameover")){
                    destroyRoom(roomCode);
                    return;
                }
                else if(room.players.length == 1 && (room.status === "waiting" || room.status === "gameover")){
                    
                    io.to(roomCode).emit("roomStatus", { players: room.players, status: room.status });
                    return;
                }
            }

        });
    });
}

module.exports = { createRoom, joinRoom, setupRoomWebSocket, destroyRoom, rooms };