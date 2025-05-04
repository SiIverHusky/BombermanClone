const { rooms } = require("./room");

gameStates = new Map(); // Map to store game states for each room
//example: gameStates.set("roomNo", { players: [] });
//Elements: timer, players, items, bombs, etc.
const itemSpawnRate = 6; // 1/itemSpawnRate chance to place an item every second

function initializeGameState(roomCode) {

    if (!gameStates.has(roomCode)) {
            const room = rooms.get(roomCode);
            gameStates.set(roomCode, {
                timer: null,
                bombs: [],
                items: [],
                players: room.players.map(p => ({ ...p, x: 0, y: 0, coins: 0, alive : true })),
            });
        }
}
function destroyGameState(roomCode) {

    if (gameStates.has(roomCode)) {
            //destroy the game state
            gameStates.delete(roomCode);
        }
}

function updateGameState(io, roomCode) {

    const state = gameStates.get(roomCode);
    if (!state) return false; // No game state found for the room

    //TODO1: check the game state 
    //TODO2: emit the game state to all players in the room

    // Bomb explosion, collision detection, item collection, player movement


    // Handle bomb explosion
    // Check if the player died by bomb explosion

    // Check if the player collected an item


    // Check if the player moved to a new position

    // state.players = ...; // Update player positions
    // state.items = ...; // Update item positions
    // state.bombs = ...; // Update


    // socket.emit("updateGameState", state );

}

function placeItemsRandomly(io, roomCode) {
    //This function will be called in startGame function every second

    if (Math.random() > 1/itemSpawnRate ) { // 1/itemSpawnRate chance to place an item every second
        return;
    }

    //TODO: place items randomly in the game area
}

function saveGameStats(roomCode, players) {
    
    //TODO: save game stats to the database
    return;
}


// Main logic of the game
function startGame(io, roomCode) {
    
    initializeGameState(roomCode); // Initialize game state if not already done

    const state = gameStates.get(roomCode);
    if (state.timer) 
        return; // Timer already running, no need to start again

    const timerDuration = 3 * 60 * 1000; // 3 minutes in ms
    let timeLeft = timerDuration;

    const gameLoop = setInterval(() => {
        
        const gameOvered =  updateGameState(io, roomCode);
        if (gameOvered) {
            clearInterval(gameLoop);
            clearInterval(state.timer); // Clear the timer
            state.timer = null; // Reset the timer
            const room = rooms.get(roomCode);
            if (room) {
                destroyGameState(roomCode); // Destroy the game state
                room.status = "gameover"; // Modify the room status after game over
                io.to(roomCode).emit("gameOver", { message: "Game Over!" });
                
            }
        }
    }, 16);

    state.timer = setInterval(() => {
        timeLeft -= 1000; // Decrease time left by 1 second
        /*==========Test code for gameover logic==========*/ 
        timeLeft-= timerDuration/4;
        /*================================================*/ 
        const seconds = Math.floor(timeLeft / 1000);
        io.to(roomCode).emit("timerUpdate", { seconds });

        // Do something every second
        console.log(`Time left: ${seconds} seconds`);

        // TODO:  place items randomly
        placeItemsRandomly(io, roomCode);
        
        /* Gameover Condition */
        if (timeLeft <= 0) {
            clearInterval(state.timer);
            const room = rooms.get(roomCode);
            if (room) {

                //TODO: Save Game stats
                saveGameStats(roomCode, room.players);
                destroyGameState(roomCode); // Destroy the game state
                room.status = "gameover"; // Modify the room after game over
                io.to(roomCode).emit("gameOver", { message: "Game Over! Time's up!" }); 
                //if server emit "gameOver", clients will disconnect their socket safely
                
            }
        }
    }, 1000);

}

// Function to set up the game WebSocket server
// io: namespace for io.of("/game")
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
        startGame(io, roomCode);


        socket.on("updatePos",(data)=>{
            //TODO: update player position
        });

        socket.on("placeBomb",(data)=>{
            //TODO: place bomb
        });

        socket.on("collectItem",(data)=>{
            //TODO: collect item
        });

        socket.on("useItem",(data)=>{
            //TODO: use item

        });


        socket.on("disconnect", () => {
            console.log(`Players disconnected from game: ${socket.id}, Room: ${roomCode}`);
        });

    });

}


module.exports = { setupGameWebSocket };