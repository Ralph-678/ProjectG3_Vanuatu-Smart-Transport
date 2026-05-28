import { useState, useCallback, useEffect } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import "../styles/Driver.css";
import { api } from "../api/APIBook";
import { io } from "socket.io-client";
import LiveMap from "../components/LiveMap";

const socket = io("http://localhost:5001");

export default function Driver() {

  // ✅ GET LOGGED USER (Initialize once to prevent infinite loops)
  const [currentUser] = useState(() => 
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))
  );

  // 👤 DRIVER PROFILE
  const [driver, setDriver] = useState({
    username: currentUser?.username || "",
    contact: currentUser?.contact || "",
    email: currentUser?.email || ""
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // 🚐 TRIP FORM
  const [trip, setTrip] = useState({
    type: "bus",
    from: "",
    to: "",
    time: "",
    startTime: "",
    endTime: "",
    capacity: 1,
    busSize: "Mini Bus",
    vehicleType: "Standard Taxi",
    availability: "available", // For taxi/private
    duration: "hourly"
  });

  // 📍 LOCATION
  const [location, setLocation] = useState({ lat: null, lng: null });

  // 🔔 NOTIFICATIONS
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg) => {
    setNotifications(prev => [{ id: Date.now(), msg }, ...prev]);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // DATA
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]); // ✅ NEW
  const [tripHistory, setTripHistory] = useState([]); // Trip history
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ LOAD TRIPS
  const loadTrips = useCallback(() => {
    setLoading(true);

    api.getTrips()
      .then(data => {
        const active = data.filter(
          t => t.driver === currentUser?.username && 
          (t.status === "Available" || t.status === "On Service")
        );
        const history = data.filter(
          t => t.driver === currentUser?.username && 
          (t.status === "Booked" || t.status === "Full" || t.status === "Completed")
        );
        setTrips(active);
        setTripHistory(history);
      })
      .catch(() => setMessage("Failed to load trips"))
      .finally(() => setLoading(false));
  }, [currentUser]);

  // ✅ LOAD BOOKINGS
  const loadBookings = useCallback(() => {
    api.getBookings()
      .then(data => setBookings(data))
      .catch(() => console.log("Failed to load bookings"));
  }, []);

  // ✅ LOAD ON MOUNT
  useEffect(() => {
    loadTrips();
    loadBookings();
  }, [loadTrips, loadBookings]);

  // 📍 GET LOCATION ON MOUNT AND WATCH
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        const newLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setLocation(newLoc);

        // Broadcast location to backend for active trips
        trips.forEach(t => {
          socket.emit("driverLocationUpdate", { tripId: t.id, location: newLoc });
        });
      }, (err) => {
        console.warn("Location tracking error:", err);
      }, { enableHighAccuracy: true });
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [trips]);

  // ✅ SAVE TRIP
  const saveTrip = async () => {
    if (!driver.username || !driver.contact) {
      return setMessage("Please fill all required fields");
    }

    if (trip.type === "bus") {
      if (!trip.from || !trip.to || !trip.time) {
        return setMessage("Please fill from, to and time for bus trips");
      }
    } else {
      if (!trip.startTime || !trip.endTime) {
        return setMessage("Please fill start and end time for availability");
      }
      if (new Date(trip.endTime) <= new Date(trip.startTime)) {
        return setMessage("End time must be after start time");
      }
    }

    // For bus, set capacity based on bus size
    let finalCapacity = trip.capacity;
    let finalVehicleType = trip.vehicleType;
    
    if (trip.type === "bus") {
      finalCapacity = trip.busSize === "Mini Bus" ? 12 : 20;
      finalVehicleType = trip.busSize;
    } else if (trip.type === "taxi") {
      finalCapacity = trip.vehicleType === "Standard Taxi" ? 4 : 6;
      finalVehicleType = trip.vehicleType;
    } else if (trip.type === "private") {
      if (trip.vehicleType === "Small Car") finalCapacity = 4;
      else if (trip.vehicleType === "SUV") finalCapacity = 6;
      else if (trip.vehicleType === "Van") finalCapacity = 10;
      finalVehicleType = trip.vehicleType;
    }

    try {
      const fullTrip = {
        type: trip.type,
        driver: driver.username,
        contact: driver.contact,
        email: driver.email,
        capacity: finalCapacity,
        booked: 0,
        status: trip.type === "bus" ? "Available" : (trip.availability === "available" ? "On Service" : "Not Available"),
        availability: trip.availability,
        location: location,
        vehicleType: finalVehicleType
      };

      if (trip.type === "bus") {
        fullTrip.from = trip.from;
        fullTrip.to = trip.to;
        fullTrip.time = trip.time;
        fullTrip.busSize = trip.busSize;
      } else {
        fullTrip.startTime = trip.startTime;
        fullTrip.endTime = trip.endTime;
        fullTrip.duration = trip.duration;
      }

      if (editingId) {
        await api.updateTrip(editingId, fullTrip);
        setMessage("Trip updated");
        addNotification("Trip updated");
      } else {
        await api.createTrip(fullTrip);
        setMessage(trip.type === "bus" ? "Trip created" : "Availability created");
        addNotification(trip.type === "bus" ? "New trip created" : "New availability created");
      }

      setTrip({ type: "bus", from: "", to: "", time: "", startTime: "", endTime: "", capacity: 1, busSize: "Mini Bus", availability: "available", duration: "hourly" });
      setEditingId(null);
      loadTrips();

    } catch (err) {
      console.error("Driver saveTrip error:", err);
      setMessage("Operation failed: " + (err.message || "Unknown error"));
    }
  };

  // EDIT
  const editTrip = (t) => {
    setTrip({
      type: t.type,
      from: t.from || "",
      to: t.to || "",
      time: t.time || "",
      startTime: t.startTime || "",
      endTime: t.endTime || "",
      capacity: t.capacity || 1,
      busSize: t.busSize || "Mini Bus",
      vehicleType: t.vehicleType || "Standard Taxi",
      availability: t.availability || "available",
      duration: t.duration || "hourly"
    });

    setDriver({
      username: t.driver || "",
      contact: t.contact || "",
      email: t.email || ""
    });

    setEditingId(t.id);
  };

  // DELETE
  const deleteTrip = async (id) => {
    try {
      await api.deleteTrip(id);
      setTrips(trips.filter(t => t.id !== id));
      setMessage("Trip deleted");
      addNotification("Trip deleted");
    } catch {
      setMessage("Delete failed");
    }
  };

  // ✅ CONFIRM BOOKING
  const confirmBooking = async (id) => {
    try {
      await api.updateBooking(id, { status: "confirmed" });
      addNotification("Booking confirmed");
      loadBookings();
    } catch {
      setMessage("Failed to confirm booking");
    }
  };

  const driverBookings = bookings.filter(b => {
    const trip = [...trips, ...tripHistory].find((t) => t.id === b.tripId);
    return trip?.driver === currentUser?.username;
  });

  return (
    <div className="driver-container">

      <div className="role-header">
        <h2 className="title">Driver Dashboard</h2>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle driver menu"
        >
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="role-menu">
          <button
            className={activeSection === "profile" ? "active" : ""}
            onClick={() => {
              setActiveSection("profile");
              setMenuOpen(false);
            }}
          >
            Profile
          </button>
          <button
            className={activeSection === "create" ? "active" : ""}
            onClick={() => {
              setActiveSection("create");
              setMenuOpen(false);
            }}
          >
            Create Trip
          </button>
          <button
            className={activeSection === "activeTrips" ? "active" : ""}
            onClick={() => {
              setActiveSection("activeTrips");
              setMenuOpen(false);
            }}
          >
            Active Trips
          </button>
          <button
            className={activeSection === "bookings" ? "active" : ""}
            onClick={() => {
              setActiveSection("bookings");
              setMenuOpen(false);
            }}
          >
            Booking History
          </button>
          <button
            className={activeSection === "history" ? "active" : ""}
            onClick={() => {
              setActiveSection("history");
              setMenuOpen(false);
            }}
          >
            Trip History
          </button>
        </div>
      )}

      {message && <div className="info">{message}</div>}

      {/* 🔄 LOADING */}
      {loading && <p>Loading trips...</p>}

      {/* NOTIFICATIONS */}
      {notifications.length > 0 && (
        <div className="notifications">
          <h3>Notifications</h3>
          {notifications.map(n => (
            <div key={n.id} className="notification">
              {n.msg}
              <button onClick={() => dismissNotification(n.id)}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {activeSection === "profile" && (
        <div className="driver-card form-card">
          <h3>Driver Profile</h3>

          <input value={driver.username} disabled />

          <input
            placeholder="Contact Number"
            value={driver.contact}
            onChange={(e) =>
              setDriver({ ...driver, contact: e.target.value })
            }
          />

          <input
            type="email"
            name="driver-email"
            autoComplete="off"
            placeholder="Email (optional)"
            value={driver.email}
            onChange={(e) =>
              setDriver({ ...driver, email: e.target.value })
            }
          />
        </div>
      )}

      {activeSection === "create" && (
        <div className="driver-card form-card">
          <h3>Trip Details</h3>

          <select
            value={trip.type}
            onChange={(e) => {
              const newType = e.target.value;
              let defaultVehicle = "Standard Taxi";
              if (newType === "bus") defaultVehicle = "Mini Bus";
              if (newType === "private") defaultVehicle = "Small Car";
              setTrip({ ...trip, type: newType, vehicleType: defaultVehicle });
            }}
          >
            <option value="bus">Bus</option>
            <option value="taxi">Taxi</option>
            <option value="private">Private</option>
          </select>

          {trip.type === "bus" && (
            <select
              value={trip.busSize}
              onChange={(e) =>
                setTrip({ ...trip, busSize: e.target.value })
              }
            >
              <option value="Mini Bus">Mini Bus (12 seats)</option>
              <option value="Full Bus">Full Bus (20 seats)</option>
            </select>
          )}

          {trip.type === "taxi" && (
            <select
              value={trip.vehicleType}
              onChange={(e) =>
                setTrip({ ...trip, vehicleType: e.target.value })
              }
            >
              <option value="Standard Taxi">Standard Taxi (4 seats)</option>
              <option value="Family Taxi">Family Taxi (6 seats)</option>
            </select>
          )}

          {trip.type === "private" && (
            <select
              value={trip.vehicleType}
              onChange={(e) =>
                setTrip({ ...trip, vehicleType: e.target.value })
              }
            >
              <option value="Small Car">Small Car (4 seats)</option>
              <option value="SUV">SUV (6 seats)</option>
              <option value="Van">Van (10 seats)</option>
            </select>
          )}

          {trip.type === "bus" ? (
            <>
              <input
                placeholder="From"
                value={trip.from}
                onChange={(e) =>
                  setTrip({ ...trip, from: e.target.value })
                }
              />

              <input
                placeholder="To"
                value={trip.to}
                onChange={(e) =>
                  setTrip({ ...trip, to: e.target.value })
                }
              />

              <input
                type="datetime-local"
                value={trip.time}
                onChange={(e) =>
                  setTrip({ ...trip, time: e.target.value })
                }
              />
            </>
          ) : (
            <>
              <select
                value={trip.availability}
                onChange={(e) =>
                  setTrip({ ...trip, availability: e.target.value })
                }
              >
                <option value="available">Available for Service</option>
                <option value="not_available">Not Available</option>
              </select>

              <select
                value={trip.duration}
                onChange={(e) =>
                  setTrip({ ...trip, duration: e.target.value })
                }
              >
                <option value="hourly">Hourly</option>
                <option value="daily">1 Day</option>
                <option value="weekly">1 Week</option>
              </select>

              <input
                type="datetime-local"
                value={trip.startTime}
                onChange={(e) =>
                  setTrip({ ...trip, startTime: e.target.value })
                }
              />

              <input
                type="datetime-local"
                value={trip.endTime}
                onChange={(e) =>
                  setTrip({ ...trip, endTime: e.target.value })
                }
              />
            </>
          )}

          {trip.type === "bus" && (
            <input
              type="number"
              min="1"
              value={trip.capacity}
              onChange={(e) =>
                setTrip({ ...trip, capacity: Number(e.target.value) })
              }
            />
          )}

          <button onClick={saveTrip}>
            {editingId ? "Update" : trip.type === "bus" ? "Create Trip" : "Create Availability"}
          </button>
        </div>
      )}

      {activeSection === "activeTrips" && (
        <div className="trip-grid">
          {trips.length === 0 ? (
            <p>No active trips yet</p>
          ) : (
            trips.map((t) => (
              <div key={t.id} className="trip-card">
                <h3>{t.type.toUpperCase()} {t.vehicleType ? `- ${t.vehicleType}` : (t.busSize ? `- ${t.busSize}` : '')}</h3>

                <p><strong>Driver:</strong> {t.driver}</p>
                <p><strong>Contact:</strong> {t.contact}</p>

                {t.type === "bus" ? (
                  <>
                    <p>{t.from} → {t.to}</p>
                    <p>Seats: {t.booked}/{t.capacity}</p>
                    <p><strong>Time:</strong> {new Date(t.time).toLocaleString()}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Availability:</strong> {t.availability === "available" ? "Available for Service" : "Not Available"}</p>
                    <p><strong>Duration:</strong> {t.duration === "daily" ? "1 Day" : t.duration === "weekly" ? "1 Week" : "Hourly"}</p>
                    <p><strong>Start:</strong> {t.startTime ? new Date(t.startTime).toLocaleString() : "N/A"}</p>
                    <p><strong>End:</strong> {t.endTime ? new Date(t.endTime).toLocaleString() : "N/A"}</p>
                    <p><strong>Status:</strong> {t.status}</p>
                  </>
                )}

                {location.lat && (
                  <>
                    <p>📍 {location.lat.toFixed(3)}, {location.lng.toFixed(3)}</p>
                    <LiveMap location={location} destinationText={`Destination: ${t.to || "Service Area"}`} />
                  </>
                )}

                <div className="booking-list">
                  <h4>Bookings</h4>
                  {bookings.filter((b) => b.tripId === t.id).length === 0 ? (
                    <p>No bookings</p>
                  ) : (
                    bookings.filter((b) => b.tripId === t.id).map((b) => (
                      <div key={b.id} className="booking-item">
                        <p><strong>Passenger:</strong> {b.user}</p>
                        <p>Status: {b.status || "pending"}</p>
                        {b.status !== "confirmed" && (
                          <button onClick={() => confirmBooking(b.id)}>Confirm</button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="actions">
                  <button onClick={() => editTrip(t)}>Edit</button>
                  <button className="delete" onClick={() => deleteTrip(t.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeSection === "bookings" && (
        <div className="driver-card">
          <h3>Booking History</h3>
          {driverBookings.length === 0 ? (
            <p>No bookings yet</p>
          ) : (
            driverBookings.map((b) => {
              const trip = [...trips, ...tripHistory].find((t) => t.id === b.tripId);
              return (
                <div key={b.id} className="booking-item">
                  <p><strong>Passenger:</strong> {b.user}</p>
                  <p><strong>Trip:</strong> {trip ? `${trip.type.toUpperCase()} ${trip.from || trip.startTime}` : b.tripId}</p>
                  <p><strong>Status:</strong> {b.status || "pending"}</p>
                  {b.status !== "confirmed" && (
                    <button onClick={() => confirmBooking(b.id)}>Confirm</button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeSection === "history" && (
        <div className="trip-grid">
          {tripHistory.length === 0 ? (
            <p>No trip history yet</p>
          ) : (
            tripHistory.map((t) => (
              <div key={t.id} className="trip-card history-card">
                <h3>{t.type.toUpperCase()} {t.vehicleType ? `- ${t.vehicleType}` : (t.busSize ? `- ${t.busSize}` : '')}</h3>
                <p><strong>Driver:</strong> {t.driver}</p>
                <p><strong>Contact:</strong> {t.contact}</p>
                {t.type === "bus" ? (
                  <>
                    <p>{t.from} → {t.to}</p>
                    <p><strong>Time:</strong> {new Date(t.time).toLocaleString()}</p>
                    <p>Seats: {t.booked}/{t.capacity}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Duration:</strong> {t.duration === "daily" ? "1 Day" : t.duration === "weekly" ? "1 Week" : "Hourly"}</p>
                    <p><strong>Start:</strong> {t.startTime ? new Date(t.startTime).toLocaleString() : "N/A"}</p>
                    <p><strong>End:</strong> {t.endTime ? new Date(t.endTime).toLocaleString() : "N/A"}</p>
                    <p><strong>Status:</strong> {t.status}</p>
                  </>
                )}
                {location.lat && (
                  <p>📍 {location.lat.toFixed(3)}, {location.lng.toFixed(3)}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}