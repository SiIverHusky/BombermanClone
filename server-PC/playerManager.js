const TILE_SIZE = 16;

function addPlayer(gameState, username, startPosition) {
    const { row, col, color } = startPosition;
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;

    gameState.players[username] = {
        username,
        x,
        y,
        width: TILE_SIZE,
        height: TILE_SIZE,
        speed: 2,
        color,
        isDead: false,
        maxBombs: 3,
        bombRange: 2,
        coins: 0
    };
}

function removePlayer(gameState, username) {
    delete gameState.players[username];
}

function processPlayerMove(gameState, { username, direction }) {
    const player = gameState.players[username];
    if (!player || player.isDead) return;

    const dx = direction === 'left' ? -player.speed : direction === 'right' ? player.speed : 0;
    const dy = direction === 'up' ? -player.speed : direction === 'down' ? player.speed : 0;

    const newX = player.x + dx;
    const newY = player.y + dy;

    // Collision detection logic here

    player.x = newX;
    player.y = newY;
}

module.exports = {
    addPlayer,
    removePlayer,
    processPlayerMove
};
