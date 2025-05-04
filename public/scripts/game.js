
$(document).ready(function () {


    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("roomCode");
    const socket = io("/game", { query: { roomCode } });

    socket.on("connect", () => {
        console.log("Connected to room: " + roomCode);


    });

    socket.on("updateGameState", (state) => {
        
        // TODO: update game state on the client side

    });

    socket.on("explodeBomb", (data) => {
        
        // TODO: show bomb explosion animation

    });

    socket.on("gameOver", (data) => {

        // Handle game over event
        console.log("Game Over:", data);
        window.location.href = `/waiting.html?roomCode=${encodeURIComponent(roomCode)}`;
    });
    socket.on("error", (data) => {
        alert("Error: " + data.message);
        window.location.href = "/home.html";
    });

});

