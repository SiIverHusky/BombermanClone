// WebSocket connection to the server
const ws = new WebSocket('ws://localhost:8080');

// Handle WebSocket messages from the server
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'initialize':
            initializeGame(data);
            break;
        case 'updateTilemap':
            updateTilemap(data.tilemap);
            break;
        case 'updatePlayers':
            updateOtherPlayers(data.players);
            break;
        case 'updateItems':
            updateItems(data.items);
            break;
        case 'playerHit':
            handlePlayerHit(data.playerId);
            break;
    }
};

// Initialize the game state when the server sends the initial data
function initializeGame(data) {
    player.id = data.playerId; // Assign the player ID
    updateTilemap(data.tilemap); // Initialize the tilemap
    updateItems(data.items); // Initialize items
    updateOtherPlayers(data.players); // Initialize other players
}

// Handle when a player is hit by an explosion
function handlePlayerHit(playerId) {
    if (player.id === playerId) {
        player.isDead = true;
        player.color = "red"; // Change the player's color to red
        console.log("You were hit by an explosion!");
    } else if (otherPlayers[playerId]) {
        otherPlayers[playerId].isDead = true;
        otherPlayers[playerId].color = "red"; // Change their color to red
        console.log(`Player ${playerId} was hit by an explosion!`);
    }
}

// Main game loop
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the arena
    drawArena();

    // Draw the tilemap
    drawTilemap();

    // Draw items
    drawItems();

    // Update and draw the local player
    updatePlayerPosition();
    drawPlayer();

    // Draw other players
    drawOtherPlayers();

    // Check for item collection
    checkItemCollection();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop once the WebSocket connection is open
ws.onopen = () => {
    console.log("Connected to the server!");
    gameLoop();
};

// Handle WebSocket errors
ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};

// Handle WebSocket disconnection
ws.onclose = () => {
    console.log("Disconnected from the server.");
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'updateTimer':
            updateTimerDisplay(data.remainingTime);
            break;
        case 'endGame':
            handleEndGame(data.message);
            break;
        // Other cases...
    }
};

// Function to update the timer display
function updateTimerDisplay(remainingTime) {
    const timerElement = document.getElementById('timer');
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    timerElement.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Function to handle the end game message
function handleEndGame(message) {
    alert(message); // Display the end game message
    // Optionally, stop the game loop or redirect to a results screen
}