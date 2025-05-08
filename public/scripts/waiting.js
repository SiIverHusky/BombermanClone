$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("roomCode");

    if (!roomCode) {
        alert("Error: No room code provided.");
        window.location.href = "/home.html";
        return;
    }

    // Update UI with room code
    $("#room-code-display").text(roomCode);

    // Connect to the room namespace via Socket.io
    const socket = io("/room", { query: { roomCode } });

    // Handle successful connection
    socket.on("connect", () => {
        console.log("Connected to room: " + roomCode);
        socket.emit("getRoomStatus");
    });

    // Handle room status updates
    socket.on("roomStatus", (data) => {
        // Update player list and room status
        $("#player-list").empty();
        data.players.forEach(player => {
            $("#player-list").append(`<li>${player.username}</li>`);
        });
        $("#player-count").text(data.players.length);
        $("#game-status").text(data.status);

        // Enable or disable the "Start Game" button
        if (data.players.length === 2 && data.status !== "started") {
            $("#start-game-button").show();
        } else {
            $("#start-game-button").hide();
        }

        // Handle game over state
        if (data.status === "gameover") {
            $("#gameover-info").show();
            $("#start-game-button").text("Rematch");
        } else {
            $("#start-game-button").text("Start Game");
            $("#gameover-info").hide();
        }
    });

    // Handle game start event
    socket.on("gameStarted", () => {
        // Redirect to the game page
        window.location.href = `/game.html?roomCode=${encodeURIComponent(roomCode)}`;
    });

    // Handle errors from the server
    socket.on("error", (data) => {
        alert("Error: " + data.message);
        window.location.href = "/home.html";
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
        console.error("Socket.io error:", error);
        alert("Error connecting to room.");
        window.location.href = "/home.html";
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Disconnected from room.");
    });

    // Sign-out button functionality
    $("#signout-button").on("click", function () {
        $.ajax({
            url: "/signout",
            method: "POST",
            success: function () {
                window.location.href = "/home.html";
            },
            error: function (err) {
                alert("Error logging out: " + err.responseText);
            }
        });
    });

    // Exit room button functionality
    $("#exit-room-button").on("click", function () {
        socket.disconnect();
        window.location.href = "/home.html";
    });

    // Start game or rematch button functionality
    $("#start-game-button").on("click", function () {
        socket.emit("startGame");
    });
});