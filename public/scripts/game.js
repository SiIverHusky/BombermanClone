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

    // Update and draw the player
    updatePlayer();
    drawPlayer();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();