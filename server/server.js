// Import the necessary modules
require('dotenv').config({ path: '../.env' });
console.log("GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID);
console.log("GITHUB_CLIENT_SECRET:", process.env.GITHUB_CLIENT_SECRET);

const express = require('express');

const { Pool } = require('pg');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = 3001; // Port where your backend server will be listening

app.use(express.urlencoded({ extended: true })); // This line is required for parsing URL-encoded bodies (form data)
app.use(express.json()); // This line should be before your route definitions

// Create a new pool instance to manage your PostgreSQL connections
const pool = new Pool({
  user: 'postgres',             // Your PostgreSQL username
  host: 'localhost',            // Your database host
  database: 'myappdb',          // Your database name
  password: process.env.DB_PASSWORD,     // Your PostgreSQL password
  port: 5432,                   // Your database port, 5432 is the default for PostgreSQL
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

//Adding a workout to database
app.post('/api/workouts', async (req, res) => {
  // Extract workout details from the request body
  console.log(req.body);
  const { name, sets, reps, weight, workout_date } = req.body;
  const userId = req.session.user.id; // Assuming you store logged-in user's ID in session

  try {
    const result = await pool.query(
      'INSERT INTO workouts (user_id, name, sets, reps, weight, workout_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, sets, reps, weight, workout_date]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

//Getting a workout form dattabse
app.get('/api/workouts', async (req, res) => {
  const userId = req.session.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM workouts WHERE user_id = $1 ORDER BY workout_date DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


//How the table for username and password was created

/*CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
); */

//Workout table
/*CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  workout_date DATE NOT NULL,
  UNIQUE(user_id, name, workout_date)
);
*/