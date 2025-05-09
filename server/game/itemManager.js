function placeItems(gameState) {
    gameState.tilemap.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === 2) { // TILE_BRICK
                const random = Math.random();
                if (random < 0.5) {
                    gameState.items.push({ row: rowIndex, col: colIndex, type: 2 }); // SMALL_COIN
                } else if (random < 0.6) {
                    gameState.items.push({ row: rowIndex, col: colIndex, type: 3 }); // BIG_COIN
                }
            }
        });
    });
}

function handleItemCollection(gameState, playerId, item) {
    const player = gameState.players[playerId];
    if (!player) return;

    const itemIndex = gameState.items.findIndex(
        (i) => i.row === item.row && i.col === item.col && i.type === item.type
    );

    if (itemIndex !== -1) {
        if (item.type === 2) {
            player.coins += 1;
        } else if (item.type === 3) {
            player.coins += 5;
        }

        gameState.items.splice(itemIndex, 1);
    }
}

module.exports = {
    placeItems,
    handleItemCollection
};