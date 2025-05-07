const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http'); // Import HTTP server
const { Server } = require('socket.io'); // Import socket.io

const { signUp, signIn, signOut, getSession } = require('./auth');
const { initializeGameServer } = require('./game/index'); // Import game server initialization

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Initialize socket.io with the HTTP server

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	session({
		secret: 'MarvelousSecretKeyThatNoOneKnows',
		resave: false,
		saveUninitialized: true,
		cookie: {
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		}
	})
)

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public', 'home.html'));
})

initializeGameServer(io); // Initialize the game server with socket.io

app.post('/signup', signUp);
app.post('/signin', signIn);
app.post('/signout', signOut);
app.get('/session', getSession);

server.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});