function placeItems(gameState) {
    gameState.tilemap.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === 2) { // TILE_BRICK
                if (Math.random() < 0.5) {
                    gameState.items.push({ row: rowIndex, col: colIndex, type: 'coin' });
                }
            }
        });
    });
}

function handleItemCollection(gameState, playerId, item) {
    const player = gameState.players[playerId];
    if (!player) return;

    const itemIndex = gameState.items.findIndex(
        i => i.row === item.row && i.col === item.col
    );

    if (itemIndex !== -1) {
        player.coins += 1;
        gameState.items.splice(itemIndex, 1);
    }
}

module.exports = {
    placeItems,
    handleItemCollection
};
