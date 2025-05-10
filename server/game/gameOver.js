function updateGameLog(roomCode, players, winner) {

    const gameLog = require("../database/gameLog.json");
    gameLog.push({
        roomCode: roomCode,
        winner: winner,
        players: players,
        timestamp: new Date().toISOString()
    });
    //write on the json file
    const fs = require('fs');
    fs.writeFileSync('./server/database/gameLog.json', JSON.stringify(gameLog, null, 2));
}


function updateRanking(roomCode,players, winner) {

    const ranking = require("../database/ranking.json");
    players.forEach(player => {
        const playerData = ranking.find(p => p.username === player.username);
        if (playerData) {
            if (winner === null) {
                playerData.draws += 1;
            }
            else if (player.username === winner.username) {
                playerData.wins += 1;
            } 
            else {
                playerData.losses += 1;
            }
        } else {
            ranking.push({
                username: player.username,
                wins: player.id === winner && winner != null? 1 : 0,
                losses: player.id === winner && winner != null ? 0 : 1,
                draws: winner === null ? 1 : 0
            });
        }
    });

    // Save the updated ranking to the file
    const fs = require('fs');
    fs.writeFileSync('./server/database/ranking.json', JSON.stringify(ranking, null, 2));


}

module.exports = {
    updateGameLog,
    updateRanking
}