// Constants for item types
const ITEM_TYPES = {
    INCREASE_BOMB_RANGE: 0,
    INCREASE_BOMB_COUNT: 1,
    SMALL_COIN: 2,
    BIG_COIN: 3
};

// Colors for rendering items
const ITEM_COLORS = {
    [ITEM_TYPES.INCREASE_BOMB_RANGE]: "blue",
    [ITEM_TYPES.INCREASE_BOMB_COUNT]: "purple",
    [ITEM_TYPES.SMALL_COIN]: "yellow",
    [ITEM_TYPES.BIG_COIN]: "orange"
};

// Sizes for rendering items
const ITEM_SIZES = {
    [ITEM_TYPES.INCREASE_BOMB_RANGE]: TILE_SIZE / 4,
    [ITEM_TYPES.INCREASE_BOMB_COUNT]: TILE_SIZE / 4,
    [ITEM_TYPES.SMALL_COIN]: TILE_SIZE / 4,
    [ITEM_TYPES.BIG_COIN]: TILE_SIZE / 3
};

// Local copy of items (received from the server)
let items = [];

// Function to collect an item (notify the server)
function collectItem(item) {
    ws.send(JSON.stringify({
        type: "collectItem",
        item
    }));

    console.log(`Requested to collect item at (${item.row}, ${item.col})`);
}

// Update the items array and synchronize with the server
function updateItems(serverItems) {
    items = serverItems; // Replace local items with the server's items

    // Redraw items on the map
    drawItems();
}

// Function to draw items on the map
function drawItems() {
    items.forEach(item => {
        const { x, y } = tileToPixel(item.row, item.col);
        const size = ITEM_SIZES[item.type];
        ctx.fillStyle = ITEM_COLORS[item.type];
        ctx.fillRect(
            x + TILE_SIZE / 2 - size / 2,
            y + TILE_SIZE / 2 - size / 2,
            size,
            size
        );
    });
}

// Function to check if the player collects an item
function checkItemCollection() {
    items.forEach((item, index) => {
        // Check if the player's collision tile matches the item's tile
        if (player.collision.row === item.row && player.collision.col === item.col) {
            // Notify the server that the item has been collected
            sendItemCollected(item);

            // Remove the item locally (it will be updated by the server)
            items.splice(index, 1);
        }
    });
}

// Function to notify the server about item collection
function sendItemCollected(item) {
    ws.send(JSON.stringify({
        type: 'itemCollected',
        item
    }));
}