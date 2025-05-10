// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define color palettes
const gray = '#808080'; // Indestructible blocks
const green = '#107830'; // Arena background

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define fixed arena dimensions (in pixels)
const scale = 4;
const arenaWidth = 13 * 16 * scale; // 13 tiles wide
const arenaHeight = 11 * 16 * scale; // 11 tiles tall
const arenaX = (canvas.width - arenaWidth) / 2; // Center horizontally
const arenaY = (canvas.height - arenaHeight) / 2; // Center vertically
const blockSize = 16*scale; // Size of each block in pixels (16 pixels * scale factor)
const gridSpacing = 16*scale; // Spacing between grid lines in pixels (16 pixels * scale factor)

function drawBounds() {
    ctx.fillStyle = gray;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFloor() {
    ctx.fillStyle = green;
    ctx.fillRect(arenaX, arenaY, arenaWidth, arenaHeight);
}

const blocks = [];

function drawGrid() {
    ctx.fillStyle = gray;
    for (let row = 0, y = arenaY + gridSpacing; y < arenaY + arenaHeight; row++, y += gridSpacing) {
        for (let col = 0, x = arenaX + gridSpacing; x < arenaX + arenaWidth; col++, x += gridSpacing) {
            // Only draw the block if the sum of row and column indices is even
            if (row % 2 === 0 && col % 2 === 0) {
                ctx.fillRect(x, y, blockSize, blockSize);
                blocks.push({x: x, y: y, width: blockSize, height: blockSize});
            }
        }
    }
}

const arenaBounds = {
	x: arenaX,
	y: arenaY,
	width: arenaWidth,
	height: arenaHeight
}