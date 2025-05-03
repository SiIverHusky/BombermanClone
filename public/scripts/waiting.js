$(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("roomCode");

    if (!roomCode) {
        alert("Error: No room code provided.");
        window.location.href = "/home.html";
        return;
    }

    // UI 업데이트
    $("#room-code-display").text(roomCode);

    // Socket.io 연결
    const socket = io({ query: { roomCode } });

    socket.on("connect", () => {
        console.log("Connected to room: " + roomCode);
        socket.emit("getRoomStatus");
    });

    socket.on("roomStatus", (data) => {
        // 플레이어 목록 업데이트
        $("#player-list").empty();
        data.players.forEach(player => {
            $("#player-list").append(`<li>${player.username}</li>`);
        });
        $("#player-count").text(data.players.length);
        $("#game-status").text(data.status);
    });

    socket.on("gameStarted", () => {
        // 게임 시작
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


// Socket connect, 

// on("joined")