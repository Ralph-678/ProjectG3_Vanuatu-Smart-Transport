// ================= ENVIRONMENT SETUP =================
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '/etc/secrets/.env' : '.env'
});

const PORT = process.env.PORT || 5001;
const DB_URI = process.env.DB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// ================= MODULE IMPORTS =================
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

// ================= DATABASE CONNECTION =================
const pool = new Pool({ connectionString: DB_URI });

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Database connection error:", err));

// ================= EXPRESS SETUP =================
const ROLES = ["Passenger", "Driver", "Admin"];
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// ================= FRONTEND BUILD =================
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

// ================= DATA (TEMPORARY IN-MEMORY) =================
let users = [];
let trips = [];
let bookings = [];

// ================= AUTH =================
app.post("/signup", (req, res) => {
  const user = req.body;

  if (!user.username || !user.email || !user.password || !user.role) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  if (!ROLES.includes(user.role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (user.role === "Driver" && !user.email.endsWith("@driver.vu")) {
    return res.status(400).json({ message: "Driver email must end with @driver.vu" });
  }

  if (user.password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const usernameExists = users.find(u => u.username === user.username);
  const emailExists = users.find(u => u.email === user.email);

  if (usernameExists || emailExists) {
    return res.status(400).json({ message: "Username or email already exists" });
  }

  const newUser = {
    ...user,
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  users.push(newUser);

  // Generate JWT token
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

  res.json({
    user: {
      username: user.username,
      email: user.email,
      role: user.role,
      contact: user.contact
    },
    token
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ user, token });
});

// ================= TRIPS, BOOKINGS, ADMIN, SOCKET.IO =================
// (Keep your existing logic here — unchanged)

// ================= TEST ROUTE =================
app.get("/api/test", (req, res) => {
  res.json({ message: "API working successfully!" });
});

app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

// ================= SERVER =================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
