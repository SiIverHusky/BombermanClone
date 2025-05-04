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

    // Connect Socket.io 
    const socket = io("/room", { query: { roomCode } });

    socket.on("connect", () => {
        console.log("Connected to room: " + roomCode);
        socket.emit("getRoomStatus");
    });

    socket.on("roomStatus", (data) => {
        // Update Player List and Status
        $("#player-list").empty();
        data.players.forEach(player => {
            $("#player-list").append(`<li>${player.username}</li>`);
        });
        $("#player-count").text(data.players.length);
        $("#game-status").text(data.status);

        if (data.players.length === 2 && data.status != "started"){
            /*enable Game Start Button*/
            $("#start-game-button").show();
        }
        else {
            /*disable Game start Button*/
            $("#start-game-button").hide();
        }

        if (data.status === "gameover") {
            $("#gameover-info").show();
            $("#start-game-button").text("Rematch");
        }
        else{
            $("#start-game-button").text("Start Game");
            $("#gameover-info").hide();
        }

    });

    socket.on("gameStarted", () => {
        // Redirect to game page
        window.location.href = `/game.html?roomCode=${encodeURIComponent(roomCode)}`;
    });

    socket.on("error", (data) => {
        alert("Error: " + data.message);
        window.location.href = "/home.html";
    });

    socket.on("connect_error", (error) => {
        console.error("Socket.io error:", error);
        alert("Error connecting to room.");
        window.location.href = "/home.html";
    });
});

// Sign-out
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

// Sign-out
$("#exit-room-button").on("click", function () {

    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("roomCode");
    const socket = io("/room",{ query: { roomCode } });
    socket.disconnect();
    window.location.href = "/home.html";
});

// Start Game or Rematch
$("#start-game-button").on("click", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("roomCode");
    const socket = io("/room",{ query: { roomCode } });
    socket.emit("startGame");
});


