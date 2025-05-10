const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;

const floorColor = "#107830";
const playerSprite = "images/Sprites/player.png";
const tileSprite = "images/Sprites/tileset.png";


const tileDisplacement = {x: 254, y: 15};

const playerDisplacement = {
    "white": {x: 2, y: 46},
    "black": {x: 195, y: 46},
    "blue": {x: 2, y: 304},
    "red": {x: 195, y: 304}
}

const playerAnimation = {
    "size": {x: 16, y: 24},
    "walkDown": {x: 1, y: 1, frame: 3},
    "walkRight": {x: 1, y: 26, frame: 3},
    "walkUp": {x: 1, y: 51, frame: 3},
    "walkLeft": {x: 1, y: 76, frame: 3},
    "Knockout": {x: 1, y: 114, frame: 7},
    "Cheering": {x: 1, y: 152, frame: 7},
    "Warp": {x: 1, y: 206, frame: 9},
}

ctx.fillStyle = floorColor;
ctx.fillRect(0, 0, canvas.width, canvas.height);

const tileSize = 16;

const tileTypes = {
    1: { name: "brick", image: "assets/brick.png", x: 0, y: 0 },
    2: { name: "bombRange", image: "assets/bombRange.png", x: 0, y: 0 },
    3: { name: "bombCount", image: "assets/bombCount.png", x: 0, y: 0 },
    4: { name: "coinSmall", image: "assets/coinSmall.png", x: 0, y: 0 },
    5: { name: "coinBig", image: "assets/coinBig.png", x: 0, y: 0 }
};

const player = new Image();
player.src = "images/Sprites/player.png";