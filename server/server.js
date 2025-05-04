const express = require('express');
const session = require('express-session');
const path = require('path');

const { signUp, signIn, signOut, getSession } = require('./auth');

const { createRoom, joinRoom } = require('./room');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authSession = session({
	secret: 'MarvelousSecretKeyThatNoOneKnows',
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	}
})

app.use(
	authSession
);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public', 'home.html'));
})

app.post('/signup', signUp);
app.post('/signin', signIn);
app.post('/signout', signOut);
app.get('/session', getSession);

app.post('/create-room', createRoom);
app.post('/join-room', joinRoom);


/* Set up Web Socket server for room management */
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

io.use((socket, next) => {
	authSession(socket.request, {}, next);
});

const { setupRoomWebSocket } = require('./room');
const { setupGameWebSocket } = require('./game');

setupRoomWebSocket(io.of("/room"),authSession);
setupGameWebSocket(io.of("/game"),authSession);

// Modified to use server instead of app
server.listen(PORT, () => { 
	console.log(`Server is running on http://localhost:${PORT}`);
})