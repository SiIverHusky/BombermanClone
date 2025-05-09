const { addPlayer, removePlayer, processPlayerMove } = require('./playerManager');
const { placeBomb, handleBombExplosions } = require('./bombManager');
const { placeItems, handleItemCollection } = require('./itemManager');

const TILE_ROWS = 11;
const TILE_COLS = 13;
const TILE_EMPTY = 0;
const TILE_BLOCK = 1;
const TILE_BRICK = 2;
const TILE_PICKUP = 3;
const TILE_BOMB = 4;

const gameStates = new Map();

function initializeGameState(roomCode) {
    const tilemap = Array.from({ length: TILE_ROWS }, () => Array(TILE_COLS).fill(TILE_EMPTY));

    for (let row = 0; row < TILE_ROWS; row++) {
        for (let col = 0; col < TILE_COLS; col++) {
            if (row % 2 === 1 && col % 2 === 1) {
                tilemap[row][col] = TILE_BLOCK;
            }
        }
    }

    const gameState = {
        tilemap,
        players: {},
        bombs: [],
        items: []
    };

    placeItems(gameState);
    gameStates.set(roomCode, gameState);
    return gameState;
}

function updateGameState(roomCode, action, data) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    switch (action) {
        case 'playerMove':
            processPlayerMove(gameState, data);
            break;
        case 'placeBomb':
            placeBomb(gameState, data);
            break;
        case 'collectItem':
            handleItemCollection(gameState, data.playerId, data.item);
            break;
    }
}

module.exports = {
    initializeGameState,
    updateGameState
};
