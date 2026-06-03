import { useEffect, useState } from "react";
import API_URL from '../config';

export default function MyBookings() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  // 🔥 Load bookings from backend
  const loadBookings = () => {
    fetch(`${API_URL}/booking`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setError("Failed to load bookings"));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // 🔥 Delete booking
  const deleteBooking = async (id) => {
    await fetch(`${API_URL}/booking/${id}`, {
      method: "DELETE"
    });

    loadBookings(); // refresh
  };

  
  const editBooking = async (booking) => {
    const newDestination = prompt("Enter new destination:", booking.to);

    if (!newDestination) return;

    await fetch(`${API_URL}/booking/${booking.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: newDestination })
    });

    loadBookings(); // refresh
  };

  return (
    <div className="container">
      <h2>My Bookings</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data.length === 0 && <p>No bookings yet</p>}

      {data.map((b) => (
        <div className="card" key={b.id}>
          <strong>{b.type?.toUpperCase()}</strong>
          <p>{b.from} → {b.to}</p>
          <p>Status: {b.status}</p>

          <button onClick={() => editBooking(b)}>
            Edit
          </button>

          <button onClick={() => deleteBooking(b.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}