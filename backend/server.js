const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const ROLES = ["Passenger", "Driver", "Admin"];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

const buildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

// ================= DATA =================
let users = [];
let trips = [];
let bookings = [];



// ================= AUTH =================
app.post("/signup", (req, res) => {
  const user = req.body;

  if (!user.username || !user.email || !user.password || !user.role) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  // role validation
  if (!ROLES.includes(user.role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Driver email validation
  if (user.role === "Driver" && !user.email.endsWith("@driver.vu")) {
    return res.status(400).json({ message: "Driver email must end with @driver.vu" });
  }

  // Password validation
  if (user.password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // Check if username or email already exists
  const usernameExists = users.find(u => u.username === user.username);
  const emailExists = users.find(u => u.email === user.email);

  if (usernameExists) {
    return res.status(400).json({ message: "Username already exists" });
  }

  if (emailExists) {
    return res.status(400).json({ message: "Email already registered" });
  }

  // Store complete user data
  users.push({
    ...user,
    id: Date.now(),
    createdAt: new Date().toISOString()
  });

  res.json({
    user: {
      username: user.username,
      email: user.email,
      role: user.role,
      contact: user.contact
    }
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  res.json({
    user: {
      username: user.username,
      email: user.email,
      role: user.role,
      contact: user.contact,
      
    }
  });
});

// ================= TRIPS (DRIVER SYSTEM) =================
app.post("/trips", (req, res) => {
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
    from: req.body.type === "bus" ? req.body.from : undefined,
    to: req.body.type === "bus" ? req.body.to : undefined,
    time: req.body.type === "bus" ? req.body.time : undefined,
    startTime: req.body.type !== "bus" ? req.body.startTime : undefined,
    endTime: req.body.type !== "bus" ? req.body.endTime : undefined,
    capacity: req.body.type === "bus" ? capacity : (req.body.capacity || 1),
    booked: 0,
    status: req.body.status || (req.body.type === "bus" ? "Available" : "On Service"),
    busSize: req.body.type === "bus" ? req.body.busSize : undefined,
    vehicleType: req.body.vehicleType,
    availability: req.body.type === "bus" ? undefined : req.body.availability,
    contact: req.body.contact,
    email: req.body.email,
    location: req.body.location
  };

  trips.push(trip);

  res.json({ success: true, trip });
});

app.put("/trips/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = trips.findIndex(t => t.id === id);

  if (index === -1)
    return res.status(404).json({ success: false, message: "Trip not found" });

  trips[index] = {
    ...trips[index],
    ...req.body
  };

  res.json({ success: true, trip: trips[index] });
});

app.delete("/trips/:id", (req, res) => {
  const id = Number(req.params.id);

  trips = trips.filter(t => t.id !== id);
  bookings = bookings.filter(b => b.tripId !== id);

  res.json({ success: true });
});

// ================= BOOKINGS (FINAL BOSS LOGIC) =================
app.post("/bookings", (req, res) => {
  const trip = trips.find(t => t.id === req.body.tripId);

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: "Trip not found"
    });
  }

  // For taxi/private availabilities, mark as booked immediately
  if (trip.type === "taxi" || trip.type === "private") {
    trip.status = "Booked";
  } else {
    // For bus trips, check capacity
    const passengers = req.body.passengers || 1;

    if (trip.booked + passengers > trip.capacity) {
      trip.status = "Full";
      return res.status(400).json({
        success: false,
        message: "Not enough seats available"
      });
    }

    // increase booking count
    trip.booked += req.body.passengers || 1;

    // 🔄 update status
    if (trip.booked >= trip.capacity) {
      trip.status = "Full";
    } else {
      trip.status = "Available";
    }
  }

  const booking = {
    id: Date.now(),
    ...req.body,
    status: req.body.status || "pending"
  };

  bookings.push(booking);

  res.json({
    success: true,
    booking,
    tripStatus: trip.status,
    remainingSeats: trip.capacity - trip.booked
  });
});

app.get("/bookings", (req, res) => {
  res.json(bookings);
});

app.put("/bookings/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  bookings[index] = { ...bookings[index], ...req.body };

  res.json({ success: true, booking: bookings[index] });
});

app.delete("/bookings/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  bookings.splice(index, 1);
  res.json({ success: true });
});

app.get("/booking", (req, res) => {
  res.json(bookings);
});

app.put("/booking/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  bookings[index] = { ...bookings[index], ...req.body };
  res.json({ success: true, booking: bookings[index] });
});

app.delete("/booking/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  bookings.splice(index, 1);
  res.json({ success: true });
});

// ================= ADMIN DASHBOARD =================
app.get("/admin/data", (req, res) => {
  res.json({
    users,
    trips,
    bookings
  });
});

app.get("/trips", (req, res) => {
  res.json(trips);
});

if (fs.existsSync(buildPath)) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// ================= SOCKET.IO =================
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("driverLocationUpdate", (data) => {
    const { tripId, location } = data;
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      trip.location = location;
      // Broadcast to everyone listening
      io.emit("tripLocationUpdated", { tripId, location });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// ================= TEST ROUTE =================
app.get("/api/test", (req, res) => {
  res.json({ message: "API working successfully!" });
});

app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});


// ================= SERVER =================
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

