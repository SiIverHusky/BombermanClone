const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const userDBPath = path.join(__dirname, 'database', 'users.json');

function read() {
    try {
        // Check if the file exists
        if (!fs.existsSync(userDBPath)) {
            // If the file doesn't exist, create it with an empty array
            fs.writeFileSync(userDBPath, JSON.stringify([], null, 2), 'utf8');
        }

        // Read and parse the file
        const data = fs.readFileSync(userDBPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading user database:', err);
        return [];
    }
}

function write(users) {
	try {
		fs.writeFileSync(userDBPath, JSON.stringify(users, null, 2), 'utf8');
	} catch (err) {
		console.error('Error writing user database:', err);
	}
}

async function signUp(req, res) {
	const { username, password } = req.body;

	try {
		const users = read();
		const existingUser = users.find(user => user.username === username);

		if (existingUser) {
			return res.status(400).json({ error: 'Username already exists' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		users.push({ username, password: hashedPassword });
		write(users);
		req.session.user = { username };
		res.status(201).json({ message: 'User created successfully' });
	} catch (err) {
		console.error('Error during sign-up:', err);
		res.status(500).json({ error: 'Internal server error' });
	}
}

async function signIn(req, res) {
	const { username, password } = req.body;

	try {
		const users = read();
		const user = users.find(user => user.username === username);

		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		req.session.user = { username };
		res.status(200).json({ message: 'Sign-in successful', username });
	} catch (err) {
		console.error('Error during sign-in:', err);
		res.status(500).json({ error: 'Internal server error' });
	}
}

function signOut(req, res) {
	req.session.destroy(err => {
		if (err) {
			return res.status(500).json({ error: 'Internal server error' });
		}
		res.status(200).json({ message: 'Sign-out successful' });
	});
}

async function getSession(req, res) {
	if (req.session.user) {
		res.status(200).json({ username: req.session.user.username });
	} else {
		res.status(200).json({ username: null });
	}
}

async function playerStats(req, res){
	//console.log(req.body);
	const username = req.query.username;
	
	
	try {
		const users = require("./database/ranking.json");
		console.log(username)
		const user = users.find(user => user.username === username);

		if (!user) {
			return res.status(200).json( { message: 'success', user: {
				"username": username,
				"wins": 0,
				"losses": 0,
				"draws": 0
			} });
		}
		

		res.status(200).json({ message: 'success', user: user });
	} catch (err) {
		console.error('Error fetching player statistics', err);
		res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = { signUp, signIn, signOut, getSession, playerStats };