const TILE_BOMB = 4;

function placeBomb(gameState, { username, row, col }) {
    const player = gameState.players[username];
    if (!player || player.maxBombs <= 0) return;

    gameState.bombs.push({
        row,
        col,
        range: player.bombRange,
        owner: username,
        timer: Date.now() + 3000
    });

    player.maxBombs--;
    gameState.tilemap[row][col] = TILE_BOMB;
}

function handleBombExplosions(gameState) {
    const now = Date.now();
    gameState.bombs = gameState.bombs.filter(bomb => {
        if (now >= bomb.timer) {
            // Handle explosion logic here
            return false;
        }
        return true;
    });
}

module.exports = {
    placeBomb,
    handleBombExplosions
};
