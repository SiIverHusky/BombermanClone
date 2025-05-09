const INCREASE_BOMB_RANGE = 0;
const INCREASE_BOMB_COUNT = 1;
const SMALL_COIN = 2;
const BIG_COIN = 3;

const TILE_BRICK = 2; // Destructible bricks

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Function to place items on the map
function placeItems(gameState) {
    const brickTiles = [];

    // Collect all brick tiles
    gameState.tilemap.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === TILE_BRICK) {
                brickTiles.push({ row: rowIndex, col: colIndex });
            }
        });
    });

    // Shuffle the brick tiles
    shuffleArray(brickTiles);

    // Place 8 bomb upgrades
    for (let i = 0; i < 8 && i < brickTiles.length; i++) {
        const { row, col } = brickTiles[i];
        const random = Math.random();
        if (random < 0.5) {
            gameState.items.push({ row, col, type: INCREASE_BOMB_RANGE });
        } else {
            gameState.items.push({ row, col, type: INCREASE_BOMB_COUNT });
        }
    }

    // Randomize coin placement for the remaining brick tiles
    for (let i = 8; i < brickTiles.length; i++) {
        const { row, col } = brickTiles[i];
        const random = Math.random();

        if (random < 0.4) {
            gameState.items.push({ row, col, type: SMALL_COIN });
        } else if (random < 0.5) {
            gameState.items.push({ row, col, type: BIG_COIN });
        }
        // 50% chance to place no item (do nothing)
    }

    console.log("Items placed on the map:", gameState.items);
}

// Function to handle item collection by a player
function handleItemCollection(gameState, playerId, item) {
    const player = gameState.players[playerId];
    if (!player) return;

    // Find and remove the item from the game state
    const itemIndex = gameState.items.findIndex(
        (i) => i.row === item.row && i.col === item.col && i.type === item.type
    );

    if (itemIndex !== -1) {
        const collectedItem = gameState.items.splice(itemIndex, 1)[0];

        // Update the player's attributes based on the item type
        switch (collectedItem.type) {
            case SMALL_COIN:
                player.coins += 1;
                break;
            case BIG_COIN:
                player.coins += 5;
                break;
            case INCREASE_BOMB_RANGE:
                player.bombRange += 1;
                break;
            case INCREASE_BOMB_COUNT:
                player.maxBombs += 1;
                break;
        }

        console.log(`Player ${playerId} collected item at (${collectedItem.row}, ${collectedItem.col})`);
    } else {
        console.log(`Item at (${item.row}, ${item.col}) not found.`);
    }
}

module.exports = {
    placeItems,
    handleItemCollection
};