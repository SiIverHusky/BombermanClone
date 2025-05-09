const TILE_SIZE = 16;

// Function to add a new player
function addPlayer(playerStates, player) {
    const startPositions = [
        { row: 0, col: 0 },
        { row: 10, col: 12 }
    ];
    const startPosition = startPositions[Object.keys(playerStates).length % 2];

    playerStates[player.id] = {
        id: player.id,
        x: startPosition.col * TILE_SIZE * 4,
        y: startPosition.row * TILE_SIZE * 4,
        width: TILE_SIZE * 4,
        height: TILE_SIZE * 6,
        speed: 0.5 * 4,
        color: Object.keys(playerStates).length === 0 ? "red" : "blue",
        isDead: false,
        maxBombs: 3,
        bombRange: 3,
        coins: 0,
        collision: { row: startPosition.row, col: startPosition.col }
    };
}

// Function to remove a player
function removePlayer(playerStates, playerId) {
    delete playerStates[playerId];
}

// Function to process player movement
function processPlayerMove(state, playerId, newX, newY) {
    const player = state.players[playerId];
    if (!player) return;

    const { row, col } = pixelToTile(newX + player.width / 2, newY + player.height);

    if (isTileWalkable(state.tilemap, row, col)) {
        player.x = newX;
        player.y = newY;
        player.collision = { row, col };
    }
}

// Function to process bomb placement
function processPlaceBomb(state, playerId) {
    const player = state.players[playerId];
    if (!player || player.maxBombs <= 0) return;

    const { row, col } = player.collision;

    if (state.tilemap[row][col] === TILE_EMPTY) {
        state.tilemap[row][col] = TILE_BOMB;
        state.bombs.push({
            row,
            col,
            timer: Date.now() + 3000,
            range: player.bombRange
        });

        player.maxBombs--;
    }
}

// Utility function to convert pixel coordinates to tile coordinates
function pixelToTile(x, y) {
    return {
        row: Math.floor(y / TILE_SIZE),
        col: Math.floor(x / TILE_SIZE)
    };
}

// Function to check if a tile is walkable
function isTileWalkable(tilemap, row, col) {
    const tile = tilemap[row][col];
    return tile === TILE_EMPTY;
}

module.exports = {
    addPlayer,
    removePlayer,
    processPlayerMove,
    processPlaceBomb
};