const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const { Pool } = require("pg");

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

const buildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DB_URI,
  ssl: { rejectUnauthorized: false }
});

// Create tables if they don't exist
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        contact VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trips (
        id BIGINT PRIMARY KEY,
        type VARCHAR(50),
        driver VARCHAR(255),
        from_location VARCHAR(255),
        to_location VARCHAR(255),
        time VARCHAR(255),
        start_time VARCHAR(255),
        end_time VARCHAR(255),
        capacity INT DEFAULT 0,
        booked INT DEFAULT 0,
        status VARCHAR(50),
        bus_size VARCHAR(50),
        vehicle_type VARCHAR(50),
        availability VARCHAR(255),
        contact VARCHAR(255),
        email VARCHAR(255),
        location VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id BIGINT PRIMARY KEY,
        trip_id BIGINT,
        status VARCHAR(50) DEFAULT 'pending',
        passengers INT DEFAULT 1,
        data JSONB
      );
    `);
    console.log("✅ Database connected and tables ready");
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
}

initDB();

// ================= AUTH =================
app.post("/signup", async (req, res) => {
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

  try {
    const id = Date.now();
    await pool.query(
      `INSERT INTO users (id, username, email, password, role, contact) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, user.username, user.email, user.password, user.role, user.contact || null]
    );

    res.json({ user: { username: user.username, email: user.email, role: user.role, contact: user.contact } });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE username = $1 AND password = $2`,
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const user = result.rows[0];
    res.json({ user: { username: user.username, email: user.email, role: user.role, contact: user.contact } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= TRIPS =================
app.post("/trips", async (req, res) => {
  const capacity = Math.max(0, Number(req.body.capacity) || 0);

  if (!req.body.type) {
    return res.status(400).json({ success: false, message: "Trip type is required" });
  }

  if (req.body.type === "bus" && !req.body.time) {
    return res.status(400).json({ success: false, message: "Bus trip time is required" });
  }

  if (req.body.type !== "bus" && (!req.body.startTime || !req.body.endTime)) {
    return res.status(400).json({ success: false, message: "Availability start and end time are required" });
  }

  const trip = {
    id: Date.now(),
    type: req.body.type,
    driver: req.body.driver || "Unknown",
    from: req.body.type === "bus" ? req.body.from : null,
    to: req.body.type === "bus" ? req.body.to : null,
    time: req.body.type === "bus" ? req.body.time : null,
    startTime: req.body.type !== "bus" ? req.body.startTime : null,
    endTime: req.body.type !== "bus" ? req.body.endTime : null,
    capacity: req.body.type === "bus" ? capacity : (req.body.capacity || 1),
    booked: 0,
    status: req.body.status || (req.body.type === "bus" ? "Available" : "On Service"),
    busSize: req.body.type === "bus" ? req.body.busSize : null,
    vehicleType: req.body.vehicleType,
    availability: req.body.type === "bus" ? null : req.body.availability,
    contact: req.body.contact,
    email: req.body.email,
    location: req.body.location
  };

  try {
    await pool.query(
      `INSERT INTO trips (id, type, driver, from_location, to_location, time, start_time, end_time, capacity, booked, status, bus_size, vehicle_type, availability, contact, email, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [trip.id, trip.type, trip.driver, trip.from, trip.to, trip.time, trip.startTime, trip.endTime,
       trip.capacity, trip.booked, trip.status, trip.busSize, trip.vehicleType, trip.availability,
       trip.contact, trip.email, trip.location]
    );
    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/trips", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM trips`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/trips/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(`SELECT * FROM trips WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Trip not found" });

    await pool.query(
      `UPDATE trips SET status=$1, booked=$2 WHERE id=$3`,
      [req.body.status || result.rows[0].status, req.body.booked ?? result.rows[0].booked, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete("/trips/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await pool.query(`DELETE FROM bookings WHERE trip_id = $1`, [id]);
    await pool.query(`DELETE FROM trips WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= BOOKINGS =================
app.post("/bookings", async (req, res) => {
  try {
    const tripResult = await pool.query(`SELECT * FROM trips WHERE id = $1`, [req.body.tripId]);
    if (tripResult.rows.length === 0) return res.status(404).json({ success: false, message: "Trip not found" });

    const trip = tripResult.rows[0];
    const passengers = req.body.passengers || 1;

    if (trip.type === "taxi" || trip.type === "private") {
      await pool.query(`UPDATE trips SET status='Booked' WHERE id=$1`, [trip.id]);
    } else {
      if (trip.booked + passengers > trip.capacity) {
        await pool.query(`UPDATE trips SET status='Full' WHERE id=$1`, [trip.id]);
        return res.status(400).json({ success: false, message: "Not enough seats available" });
      }
      const newBooked = trip.booked + passengers;
      const newStatus = newBooked >= trip.capacity ? "Full" : "Available";
      await pool.query(`UPDATE trips SET booked=$1, status=$2 WHERE id=$3`, [newBooked, newStatus, trip.id]);
    }

    const booking = { id: Date.now(), ...req.body, status: req.body.status || "pending" };
    await pool.query(
      `INSERT INTO bookings (id, trip_id, status, passengers, data) VALUES ($1, $2, $3, $4, $5)`,
      [booking.id, req.body.tripId, booking.status, passengers, JSON.stringify(req.body)]
    );

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM bookings`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/booking", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM bookings`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/bookings/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await pool.query(`DELETE FROM bookings WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= ADMIN DASHBOARD =================
app.get("/admin/data", async (req, res) => {
  try {
    const users = await pool.query(`SELECT * FROM users`);
    const trips = await pool.query(`SELECT * FROM trips`);
    const bookings = await pool.query(`SELECT * FROM bookings`);
    res.json({ users: users.rows, trips: trips.rows, bookings: bookings.rows });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= SOCKET.IO =================
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("driverLocationUpdate", async (data) => {
    const { tripId, location } = data;
    try {
      await pool.query(`UPDATE trips SET location=$1 WHERE id=$2`, [location, tripId]);
      io.emit("tripLocationUpdated", { tripId, location });
    } catch (err) {
      console.error("Location update error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// ================= TEST ROUTE =================
app.get("/api/test", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ message: "API working successfully!", database: "connected ✅" });
  } catch (err) {
    res.json({ message: "API working successfully!", database: "not connected ❌", error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

if (fs.existsSync(buildPath)) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// ================= SERVER =================
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});