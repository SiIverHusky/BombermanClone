# Development Checklist

## Client Responsibilities

- Render the game arena, players, bombs, and explosions.

- Handle user input (keyboard events) and update the player's state.

- Communicate with the server via WebSocket for real-time updates.

- Display game-related information (e.g., timer, scores, game over screen).

- Manage animations for player movements and actions.

## Data to Send to Server (Client)

- **Player Input**: Key presses (e.g., movement, bomb placement).

- **Player State**: Position, speed, and collision data.

- **Bomb Placement**: Coordinates of the placed bomb.

- **Player Hit**: Notify the server when a player is hit by an explosion.

## Data to Receive from Server (Client)

- **Game Initialization**: Initial game state (e.g., players, tilemap, items).

- **Player Updates**: Positions and states of all players.

- **Bomb Updates**: Bombs placed and their explosion states.

- **Item Updates**: Items available on the map.

- **Timer Updates**: Remaining game time.

- **Game Over Event**: Triggered when the game ends.

---

## Server Responsibilities

- Manage game state (e.g., players, bombs, items, tilemap).

- Handle real-time communication with clients via WebSocket.

--- - Validate and process player inputs.---

- Synchronize game state across all connected clients.

--- - Implement game logic (e.g., collisions, explosions, item effects).---

## Data to Receive from Client (Server)

- **Player Updates**: New player states.

- **Tile Updates**: Changes to the tilemap (if applicable).

- **Item Updates**: Changes to item states (if applicable).

- **Bomb Updates**: Bomb placement and explosion events.

## Data to Send to Client (Server)

- **Game Initialization**: Initial game state (e.g., players, tilemap, items).

- **Player Updates**: Positions and states of all players.

- **Bomb Updates**: Bombs placed and their explosion states.

- **Item Updates**: Items available on the map.

- **Timer Updates**: Remaining game time.

- **Game Over Event**: Notify clients when the game ends.
