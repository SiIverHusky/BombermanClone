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

// Function to draw the arena background
function drawArena() {
    // Draw the background
    ctx.fillStyle = green;
    ctx.fillRect(arenaX, arenaY, arenaWidth, arenaHeight);
}

// Function to draw the arena border (optional)
function drawArenaBorder() {
    ctx.strokeStyle = gray;
    ctx.lineWidth = 4;
    ctx.strokeRect(arenaX, arenaY, arenaWidth, arenaHeight);
}