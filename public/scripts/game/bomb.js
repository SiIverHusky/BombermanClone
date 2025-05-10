bombs = [];
explosions = [];

function placeBomb(player, tilemap) {
	playSound("place-bomb");
	const { row, col } = player.tilePos;
	if (tilemap[row][col] === TILE_EMPTY && player.bombCount > 0) {
		tilemap[row][col] = TILE_BOMB; // Place a bomb on the tile
		pushPlayerOffBomb(player, tilemap); // Push player off the bomb
		player.bombCount--;
		bombs.push({ row: row, col: col, timeToExplode: Date.now() + 3000, username: player.username, range: player.bombRange});
		console.log("Bombs: ", bombs)
		sendBombsUpdate(bombs);
		sendTilemapUpdate(tilemap);
		return true; // Bomb placed successfully
	}
	return false; // Bomb placement failed
}

function pushPlayerOffBomb(player, tilemap) {
	const direction = [
		{ row: -1, col: 0 }, // Up
		{ row: 1, col: 0 },   // Down
		{ row: 0, col: -1 }, // Left
		{ row: 0, col: 1 } // Right
	];

	let closestTile = null;
	let closestDirection = null;
	let closestDistance = Infinity;

	for (const { row: dRow, col: dCol } of direction) {
		const newRow = player.tilePos.row + dRow;
		const newCol = player.tilePos.col + dCol;

		if (isTileWalkable(newRow, newCol)) {
			const {x, y} = tileToPixel(newRow, newCol, true);
			const tileCenterX = x + TILE_SIZE / 2;
			const tileCenterY = y + TILE_SIZE / 2;

			const distance = Math.hypot(
				player.position.x - tileCenterX,
				player.position.y - tileCenterY
			);

			if (distance < closestDistance) {
				closestDistance = distance;
				closestDirection = { row: dRow, col: dCol };
				closestTile = { row: newRow, col: newCol };
			}
		}
	}
	if (closestTile) {
		player.position.x += closestDirection.col*(TILE_SIZE);
		player.position.y += closestDirection.row*(TILE_SIZE)
	}
}

function updateBombs() {
	const currentTime = Date.now();

	bombs.forEach((bomb, index) => {
		if (currentTime >= bomb.timeToExplode) {
			// console.log("Bomb exploded: ", bomb);
			explodeBomb(bomb);
			bombs.splice(index, 1); // Remove the bomb after explosion
			sendBombsUpdate(bombs);
			if (bomb.username === player1.username) {
				player1.bombCount++;
			} else {
				player2.bombCount++;
			}
		}
	});

	explosions.forEach((explosion, index) => {
		if (currentTime >= explosion.expiresAt) {
			explosions.splice(index, 1); // Remove the explosion after its duration
		}
	});
}

function createExplosion(bomb) {
	const directions = [
		{ row: -1, col: 0 }, // Up
		{ row: 1, col: 0 },   // Down
		{ row: 0, col: -1 }, // Left
		{ row: 0, col: 1 } // Right
	];

	explosions.push({
		row: bomb.row,
		col: bomb.col,
		expiresAt: Date.now() + 500
	});

	for (const { row: dRow, col: dCol } of directions) {
		// console.log("dRow: ", dRow, "dCol: ", dCol)
		// console.log("Bomb range: ", bomb.range)
		for (let i = 1; i <= bomb.range; i++) {
			const newRow = bomb.row + dRow * i;
			const newCol = bomb.col + dCol * i;
			// console.log("newRow: ", newRow, "newCol: ", newCol)

			if (newRow < 0 || newRow >= TILE_ROWS || newCol < 0 || newCol >= TILE_COLS) break;

			if (tilemap[newRow][newCol] === TILE_BLOCK) break; // Stop at indestructible blocks

			if (tilemap[newRow][newCol] === TILE_BRICK) {
				tilemap[newRow][newCol] = TILE_EMPTY;
				sendTilemapUpdate(tilemap); // Send the updated tilemap to the server
				
				explosions.push({
					row: newRow,
					col: newCol,
					expiresAt: Date.now() + 500
				});
				break; // Stop at destructible bricks
			}

			explosions.push({
				row: newRow,
				col: newCol,
				expiresAt: Date.now() + 500
			});
		}
	}
}


function hitPlayersDetection() {
	for (const explosion of explosions) {
		if (Date.now() < explosion.expiresAt) {
			const { row, col } = explosion;
			for (let player of [player1, player2]) {
				if (player.tilePos.row === row && player.tilePos.col === col && player.color !== "black") {
					player.alive = false; // Mark the player as dead
					console.log("Player hit by explosion: ", player.username);
					sendPlayerUpdate(player); // Send the updated player state to the server
				}
			}
		}
	}
}

function explodeBomb(bomb) {
	playSound("bomb-explodes");
	const { row, col } = bomb;
	tilemap[row][col] = TILE_EMPTY; // Remove the bomb from the tile
	sendTilemapUpdate(tilemap); // Send the updated tilemap to the server
	createExplosion(bomb);
}

function drawBombs() {
	for (const bomb of bombs) {
		const { x, y } = tileToPixel(bomb.row, bomb.col);
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	}
}

function drawExplosions() {
	for (const explosion of explosions) {
		const { x, y } = tileToPixel(explosion.row, explosion.col);
		ctx.fillStyle = "orange";
		ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);		
	}
}