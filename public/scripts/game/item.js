const ITEM_TYPES = {
    INCREASE_BOMB_RANGE: 0,
    INCREASE_BOMB_COUNT: 1,
    SMALL_COIN: 2,
    BIG_COIN: 3
};

const ITEM_COLORS = {
    [ITEM_TYPES.INCREASE_BOMB_RANGE]: "blue",
    [ITEM_TYPES.INCREASE_BOMB_COUNT]: "purple",
    [ITEM_TYPES.SMALL_COIN]: "yellow",
    [ITEM_TYPES.BIG_COIN]: "orange"
};

const ITEM_SIZES = {
    [ITEM_TYPES.INCREASE_BOMB_RANGE]: TILE_SIZE / 4,
    [ITEM_TYPES.INCREASE_BOMB_COUNT]: TILE_SIZE / 4,
    [ITEM_TYPES.SMALL_COIN]: TILE_SIZE / 4,
    [ITEM_TYPES.BIG_COIN]: TILE_SIZE / 3
};

// Local copy of items (received from the server)
let items = [];

function collectItem(player, item) {
	playSound("get-item");	
	switch (item.type) {
		case ITEM_TYPES.INCREASE_BOMB_RANGE:
			player.bombRange += 1;
			break;
		case ITEM_TYPES.INCREASE_BOMB_COUNT:
			player.bombCount += 1;
			break;
		case ITEM_TYPES.SMALL_COIN:
			player.coins += 1;
			break;
		case ITEM_TYPES.BIG_COIN:
			player.coins += 5;
			break;
	}
	items = items.filter(i => i.row !== item.row || i.col !== item.col); // Remove the collected item
}

function checkItemCollection(player) {
	debugItem = {
		0: "INCREASE_BOMB_RANGE",
		1: "INCREASE_BOMB_COUNT",
		2: "SMALL_COIN",
		3: "BIG_COIN"
	}

	items.forEach(item => {
		if (player.tilePos.row === item.row && player.tilePos.col === item.col) {
			console.log("Item collected:", debugItem[item.type], "by player:", player.username);
			collectItem(player, item);
			sendPlayerUpdate(player); // Send the updated player state to the server
			sendItemsUpdate(items); // Send the updated items to the server
		}
	});
}

function drawItems() {
	items.forEach(item => {
		if (item.type == 0) {
			ctx.fillStyle = ITEM_COLORS[item.type];
			const { x, y } = tileToPixel(item.row, item.col, true);
			ctx.beginPath();
			ctx.moveTo(x, y-TILE_SIZE/4-10);
			ctx.lineTo(x+TILE_SIZE/4, y+TILE_SIZE/3);
			ctx.lineTo(x, y+4);
			ctx.lineTo(x-TILE_SIZE/4, y+TILE_SIZE/3);
			ctx.closePath();
			ctx.fill();
		} else if (item.type == 1) {
			ctx.fillStyle = ITEM_COLORS[item.type];
			const { x, y } = tileToPixel(item.row, item.col, true);
			ctx.beginPath();
			ctx.arc(x, y, TILE_SIZE/3, 0, Math.PI * 2);
			ctx.fill();
		} else {
			const { x, y } = tileToPixel(item.row, item.col);
			const size = ITEM_SIZES[item.type];
			ctx.fillStyle = ITEM_COLORS[item.type];
			ctx.fillRect(
				x + TILE_SIZE / 2 - size / 2,
				y + TILE_SIZE / 2 - size / 2,
				size,
				size
			);
		}
	});
}