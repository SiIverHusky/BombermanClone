const TILE_SIZE = 16;

// Function to add a new player
function addPlayer(playerStates, username, roomCode) {
    const startPositions = [
        { row: 0, col: 0, color: "red" },
        { row: 10, col: 12, color: "blue" }
    ];

    const existingPlayers = Object.keys(playerStates).length;
    if (existingPlayers >= startPositions.length) {
        console.error("Cannot add more players. Maximum player limit reached.");
        return;
    }

    const startPosition = startPositions[existingPlayers];

    // Add the player to the playerStates object
    playerStates[username] = {
        username: username,
        row: startPosition.row,
        col: startPosition.col,
        color: startPosition.color,
        isDead: false,
        maxBombs: 3,
        bombRange: 3,
        coins: 0
    };


    console.log(`Player ${username} added at tile (${startPosition.row}, ${startPosition.col})`);
}

// Function to remove a player
function removePlayer(playerStates, username) {
    if (playerStates[username]) {
        delete playerStates[username];
        console.log(`Player ${username} removed.`);
    } else {
        console.error(`Player ${username} not found.`);
    }
}

module.exports = {
    addPlayer,
    removePlayer
};