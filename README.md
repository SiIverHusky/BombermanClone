# I'ma Bomb U!
COMP4021 Project - A Bomberman Clone for the browser

Home task:
1. Joining and Creating a game (Client -> Server)
2. Statistics (Server -> Client)
3. Waiting Room (Server -> Client)

Game Tasks:
1. Setting up sprites and animations (Client)
2. Implementing player movement and controls (Client -> Server)
3. Simple messaging system (Client <-> Server)
4. Implement item pickups and power-ups (Server -> Client)
5. Implement brick placement (Server -> Client) 
6. Implement Game State (Server -> Client)
	a. Timer
	b. Coins
	c. Player Inventory
	d. In game or Game end
7. Implement Game Over and Restart (Server -> Client)

Game Over:
1. Show Game Stats (Server -> Client)
2. Update and show Player Statistics (Server -> Client)
3. Restart or Exit (Client -> Server)



##Websocket API (Server -> Client)

"error", { message }

"timerUpdate", { seconds }
update the time left in seconds

"gameOver", { message }

"updateGameState" { state }
"explodeBomb" { id }

~~"updatePos", { players: [ [ username1: { x:0 , y:0 } , username1: { x:20 , y:20 } ] }
client must update players' position (every 16ms)

"placeObject" { id: x8UevHc, type: "coin", x:30, y:35 }
type : "coin" or "item"

"removeObject" { id }

"placeBomb" { id: e7CvkuQ, x:30, y:35 }~~


## Websocket API (Client -> Server)

"updatePos", { x:30, y:20 }
send my position to server (every 16ms)

"placeBomb" { x:30, y:20 }

"useItem" { id: x8UevHc }

"collectItem" { id: x8UevHc }






