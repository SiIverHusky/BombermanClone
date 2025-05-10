$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("roomCode");

    if (!roomCode) {
        alert("Error: No room code provided.");
        window.location.href = "/home.html";
        return;
    }

    const username = urlParams.get("username");
    if (!username) {
        alert("Error: Username is required.");
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
            console.log("Required Lastgame data");
            socket.emit("lastGame");
            socket.emit("ranking");
        } else {
            $("#start-game-button").text("Start Game");
            $("#gameover-info").hide();
        }
    });

socket.on("lastGame", (data) => {
    const $gameResult = $("#game-result");
    const $coins = $("#coins");

    if (data.data) {
        // 게임 결과 표시
        if (data.data.winner !== null) {
            $gameResult.text(`${data.data.winner} Win!`);
        } else {
            $gameResult.text("It's a draw!");
        }

        // 코인 정보 표시
        const coinsText = data.data.players
            .map(player => `${player.username}: ${player.coins}`)
            .join(" | ");
        $coins.text(`Collected coins: ${coinsText}`);
    } else {
        $gameResult.text("No last game data available.");
        $coins.text("");
    }
});

// ranking 이벤트 처리
socket.on("ranking", (data) => {
    console.log(data.data[0])
    const $rankingList = $("#ranking-list");
    $rankingList.empty();
    //const players = Array.isArray(data.data.players) ? data.data.players : [];
    // 승률 계산 및 정렬
    const rankedPlayers = data.data
        .map(player => {
            const wins = player.wins || 0;
            const losses = player.losses || 0;
            const draws = player.draws || 0;
            // 승률: 무승부 제외, 승/패 모두 0이면 0
            const winRate = wins + losses === 0 ? 0 : wins / (wins + losses);
            return { ...player, winRate };
        })
        .sort((a, b) => {
            // 승률 내림차순, 동일 승률 시 승수 내림차순
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return b.wins - a.wins;
        })
        .slice(0, 5); // 최대 5명

    // 랭킹 표시
    rankedPlayers.forEach(player => {
        $rankingList.append(
            `<li>${player.username}: ${player.wins}/${player.losses}/${player.draws}</li>`
        );
    });
});

    // Handle game start event
    socket.on("gameStarted", () => {
        window.location.href = `/game.html?roomCode=${encodeURIComponent(roomCode)}&username=${encodeURIComponent(username)}`;
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

    $("#copy-room-code").on("click", function () {
        const roomCode = $("#room-code-display").text();
        navigator.clipboard.writeText(roomCode).then(() => {
            //alert("Room code copied to clipboard!");
            //Disable the button for 2 seconds and turn into "copied"
            $(this).prop("disabled", true);
            $(this).text("Copied!");
        }).catch(err => {
            console.error("Failed to copy: ", err);
        });
    });
});