function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw the arena
    ctx.fillStyle = gray;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = green;
    ctx.fillRect(arenaX, arenaY, arenaWidth, arenaHeight);

    // Draw the tilemap
    drawTilemap();

    // Draw bricks and items
    drawBricks();
    drawItems();
    collectItems();

    // Update and draw the player
    updatePlayer();
    drawPlayer();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Setup
setPlayerPosition(0, 0); // Set initial player position (row, col)

// Start the game loop
gameLoop();