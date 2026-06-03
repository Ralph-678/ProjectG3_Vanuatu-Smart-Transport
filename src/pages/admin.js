import { useEffect, useState } from "react";
import { getAllData } from "../utils/indexDB";
import AdminChart from "../components/AdminChart";
import { api } from "../api/APIBook";
import { FiMenu, FiX } from "react-icons/fi";
import "../styles/admin.css";
import API_URL from '../config';

export default function Admin() {
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("stats");
  const [newTrip, setNewTrip] = useState({
    type: "bus",
    from: "",
    to: "",
    time: "",
    startTime: "",
    endTime: "",
    capacity: 12,
    busSize: "Mini Bus",
    availability: "available",
    driver: "",
    contact: "",
    email: ""
  });

  const loadAdminData = () => {
    fetch(`${API_URL}/admin/data`)
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setTrips(data.trips || []);
        setBookings(data.bookings || []);
      })
      .catch(() => {
        setError("Failed to load admin data");
        getAllData("bookings")
          .then(setBookings)
          .catch(() => {});
      });
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const driverUsers = users.filter((u) => u.role === "Driver");
  const passengerUsers = users.filter((u) => u.role === "Passenger");

  const confirmBooking = async (id) => {
    try {
      await api.updateBooking(id, { status: "confirmed" });
      loadAdminData();
    } catch {
      setError("Could not confirm booking");
    }
  };

  const deleteTrip = async (id) => {
    try {
      await api.deleteTrip(id);
      loadAdminData();
    } catch {
      setError("Could not delete trip");
    }
  };

  const deleteBooking = async (id) => {
    try {
      await api.deleteBooking(id);
      loadAdminData();
    } catch {
      setError("Could not delete booking");
    }
  };

  const saveNewTrip = async () => {
    try {
      await api.createTrip({
        ...newTrip,
        capacity: newTrip.type === "bus" ? newTrip.capacity : 1,
        booked: 0,
        status: newTrip.type === "bus" ? "Available" : "On Service"
      });
      setNewTrip({
        type: "bus",
        from: "",
        to: "",
        time: "",
        startTime: "",
        endTime: "",
        capacity: 12,
        busSize: "Mini Bus",
        availability: "available",
        driver: "",
        contact: "",
        email: ""
      });
      loadAdminData();
    } catch {
      setError("Could not add trip");
    }
  };

  return (
    <div className="admin-container">

      <div className="role-header">
        <h2>Admin Dashboard </h2>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle admin menu"
        >
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="role-menu">
          <button
            className={activeSection === "stats" ? "active" : ""}
            onClick={() => {
              setActiveSection("stats");
              setMenuOpen(false);
            }}
          >
            Stats
          </button>
          <button
            className={activeSection === "users" ? "active" : ""}
            onClick={() => {
              setActiveSection("users");
              setMenuOpen(false);
            }}
          >
            Users
          </button>
          <button
            className={activeSection === "trips" ? "active" : ""}
            onClick={() => {
              setActiveSection("trips");
              setMenuOpen(false);
            }}
          >
            Trips
          </button>
          <button
            className={activeSection === "bookings" ? "active" : ""}
            onClick={() => {
              setActiveSection("bookings");
              setMenuOpen(false);
            }}
          >
            Bookings
          </button>
          <button
            className={activeSection === "add" ? "active" : ""}
            onClick={() => {
              setActiveSection("add");
              setMenuOpen(false);
            }}
          >
            Add Trip
          </button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {activeSection === "stats" && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <h3>Users</h3>
              <p>{users.length}</p>
            </div>
            <div className="stat-card">
              <h3>Trips</h3>
              <p>{trips.length}</p>
            </div>
            <div className="stat-card">
              <h3>Bookings</h3>
              <p>{bookings.length}</p>
            </div>
          </div>

          <div className="chart-container">
            <AdminChart bookings={bookings} />
          </div>
        </>
      )}

      {activeSection === "users" && (
        <div className="table-section">
          <h3>Drivers</h3>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {driverUsers.map((u, i) => (
                <tr key={i}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 20 }}>Passengers</h3>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {passengerUsers.map((u, i) => (
                <tr key={i}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "trips" && (
        <div className="table-section">
          <h3>Trips (Driver Created)</h3>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Time / Window</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id}>
                  <td>{t.type}</td>
                  <td>{t.from || "—"}</td>
                  <td>{t.to || "—"}</td>
                  <td>
                    {t.type === "bus"
                      ? (t.time ? new Date(t.time).toLocaleString() : "N/A")
                      : (t.startTime && t.endTime
                          ? `${new Date(t.startTime).toLocaleString()} → ${new Date(t.endTime).toLocaleString()}`
                          : "N/A")}
                  </td>
                  <td>{t.status || "N/A"}</td>
                  <td>
                    <button className="delete" onClick={() => deleteTrip(t.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "bookings" && (
        <div className="table-section">
          <h3>Bookings</h3>
          <table>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>User</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.tripId}</td>
                  <td>{b.user || b.passenger || "N/A"}</td>
                  <td>{b.status}</td>
                  <td>
                    {b.status !== "confirmed" && (
                      <button onClick={() => confirmBooking(b.id)}>
                        Confirm
                      </button>
                    )}
                    <button className="delete" onClick={() => deleteBooking(b.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "add" && (
        <div className="table-section">
          <h3>Add Trip</h3>
          <div className="admin-form">
            <label>Type</label>
            <select
              value={newTrip.type}
              onChange={(e) => setNewTrip({ ...newTrip, type: e.target.value })}
            >
              <option value="bus">Bus</option>
              <option value="taxi">Taxi</option>
              <option value="private">Private</option>
            </select>

            {newTrip.type === "bus" ? (
              <>
                <label>From</label>
                <input
                  value={newTrip.from}
                  onChange={(e) => setNewTrip({ ...newTrip, from: e.target.value })}
                />
                <label>To</label>
                <input
                  value={newTrip.to}
                  onChange={(e) => setNewTrip({ ...newTrip, to: e.target.value })}
                />
                <label>Time</label>
                <input
                  type="datetime-local"
                  value={newTrip.time}
                  onChange={(e) => setNewTrip({ ...newTrip, time: e.target.value })}
                />
                <label>Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={newTrip.capacity}
                  onChange={(e) => setNewTrip({ ...newTrip, capacity: Number(e.target.value) })}
                />
              </>
            ) : (
              <>
                <label>Availability</label>
                <select
                  value={newTrip.availability}
                  onChange={(e) => setNewTrip({ ...newTrip, availability: e.target.value })}
                >
                  <option value="available">Available for Service</option>
                  <option value="not_available">Not Available</option>
                </select>
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={newTrip.startTime}
                  onChange={(e) => setNewTrip({ ...newTrip, startTime: e.target.value })}
                />
                <label>End Time</label>
                <input
                  type="datetime-local"
                  value={newTrip.endTime}
                  onChange={(e) => setNewTrip({ ...newTrip, endTime: e.target.value })}
                />
              </>
            )}

            <label>Driver Username</label>
            <input
              value={newTrip.driver}
              onChange={(e) => setNewTrip({ ...newTrip, driver: e.target.value })}
            />
            <label>Contact</label>
            <input
              value={newTrip.contact}
              onChange={(e) => setNewTrip({ ...newTrip, contact: e.target.value })}
            />
            <label>Email</label>
            <input
              value={newTrip.email}
              onChange={(e) => setNewTrip({ ...newTrip, email: e.target.value })}
            />

            <button onClick={saveNewTrip}>Create Trip</button>
          </div>
        </div>
      )}

    </div>
  );
}