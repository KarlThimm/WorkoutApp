// Import the necessary modules
require('dotenv').config({ path: '../.env' });
console.log("GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID);
console.log("GITHUB_CLIENT_SECRET:", process.env.GITHUB_CLIENT_SECRET);

const express = require('express');

const { Pool } = require('pg');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = 3001; // Port where your backend server will be listening

app.use(express.urlencoded({ extended: true })); // This line is required for parsing URL-encoded bodies (form data)

// Create a new pool instance to manage your PostgreSQL connections
const pool = new Pool({
  user: 'postgres',             // Your PostgreSQL username
  host: 'localhost',            // Your database host
  database: 'myappdb',          // Your database name
  password: process.env.DB_PASSWORD,     // Your PostgreSQL password
  port: 5432,                   // Your database port, 5432 is the default for PostgreSQL
});

// Define a GET route
app.get('/api/hello', async (req, res) => {
  try {
    // Query your database
    const { rows } = await pool.query('SELECT \'Hello, World!\' as message');
    // Send the query result back to the client
    res.json(rows[0]);
  } catch (err) {
    // Handle any errors
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET, // Replace 'your_secret' with a real secret key
  resave: false,
  saveUninitialized: true,
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport session setup
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  // User.findById(id, function(err, user) {
  //   done(err, user);
  // });
  // For simplicity, just pass the ID. Replace with your user retrieval logic.
  done(null, id);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert the user into the database
  try {
      await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);
      res.redirect('/index.html'); // Redirect to the login page after successful registration
  } catch (err) {
      console.error(err);
      res.send("Failed to register.");
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
      const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
      if (rows.length > 0) {
          const user = rows[0];

          if (await bcrypt.compare(password, user.password)) {
              // Passwords match
              // Implement session or token-based authentication here
              req.session.userId = user.id; // Example using express-session
              req.session.user = { id: user.id, username: user.username }; // Store user details in session
              res.redirect('/logged.html'); // Redirect to a protected dashboard page
          } else {
              // Passwords don't match
              res.send("Incorrect username or password.");
          }
      } else {
          res.send("Incorrect username or password.");
      }
  } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
  }
});


// Serve static files
app.use(express.static('public'));


  app.get('/logout', (req, res) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      //Destroy session
      req.session.destroy(() => {
        res.clearCookie('connect.sid', { path: '/'}); //Clear cookie
        res.redirect('/'); // Redirect to homepage or login page after logout
      });
    });
  });

//Displaying logged in user:
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).send('Unauthorized');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


//How the table for username and password was created

/*CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
); */