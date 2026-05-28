import { useState, useEffect } from "react";
import "../styles/Bookings.css";

export default function Booking() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [form, setForm] = useState({
    name: "",
    date: "",
    passengers: 1,
    payment: "cash"
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Get query params
  const urlParams = new URLSearchParams(window.location.search);
  const filterType = urlParams.get("type");
  const selectedTripId = urlParams.get("tripId");

  // Open booking form
  const openBooking = (trip) => {
    setSelectedTrip(trip);
    if (trip.type === "bus") {
      setForm({
        name: "",
        from: trip.from,
        to: trip.to,
        date: "",
        passengers: 1,
        payment: "cash"
      });
    } else {
      // For taxi/private
      setForm({
        name: "",
        pickupLocation: "",
        destination: "",
        date: "",
        passengers: 1,
        payment: "cash",
        specialRequests: ""
      });
    }
  };

  // Load trips
  useEffect(() => {
    fetch("http://localhost:5001/trips")
      .then(res => res.json())
      .then(data => {
        const now = new Date();
        let filtered = data;

        if (filterType) {
          filtered = filtered.filter(t => t.type === filterType);
        }

        filtered = filtered.filter(t => {
          const isFuture = t.type === "bus"
            ? (!isNaN(new Date(t.time)) && new Date(t.time) > now)
            : (t.endTime ? !isNaN(new Date(t.endTime)) && new Date(t.endTime) > now : false);
          const isAvailableStatus = t.status !== "Full" && t.status !== "Booked" && t.status !== "Not Available";
          return isFuture && isAvailableStatus;
        });

        setTrips(filtered);

        if (selectedTripId) {
          const tripToOpen = filtered.find(t => t.id === Number(selectedTripId));
          if (tripToOpen) {
            openBooking(tripToOpen);
          }
        }
      })
      .catch(() => setError("Failed to load trips"));
  }, [filterType, selectedTripId]);

  // Submit booking
  const confirmBooking = async () => {
    if (!form.name || !form.date) {
      return setError("Please fill all required fields");
    }

    if (selectedTrip.type !== "bus" && (!form.pickupLocation || !form.destination)) {
      return setError("Please fill pickup location and destination");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const bookingData = {
        tripId: selectedTrip.id,
        type: selectedTrip.type,
        user: form.name,
        date: form.date,
        passengers: form.passengers,
        payment: form.payment,
        status: "pending"
      };

      if (selectedTrip.type === "bus") {
        bookingData.from = form.from;
        bookingData.to = form.to;
      } else {
        bookingData.pickupLocation = form.pickupLocation;
        bookingData.destination = form.destination;
        bookingData.specialRequests = form.specialRequests;
      }

      const res = await fetch("http://localhost:5001/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });

      const data = await res.json();

      if (data.success) {
        if (selectedTrip.type === "bus") {
          setTrips(prevTrips => prevTrips.map(t =>
            t.id === selectedTrip.id
              ? {
                  ...t,
                  booked: (t.booked || 0) + Number(form.passengers),
                  status: data.tripStatus || t.status
                }
              : t
          ));
        } else {
          setTrips(prevTrips => prevTrips.filter(t => t.id !== selectedTrip.id));
        }

        setSuccess(`Booking confirmed! Payment method: ${form.payment}`);
        setSelectedTrip(null);
        setForm({ name: "", date: "", passengers: 1, payment: "cash" });
      } else {
        setError(data.message || "Booking failed");
      }

    } catch (err) {
      console.error(err);
      setError("Booking failed");
    }

    setLoading(false);
  };

  return (
    <div className="booking-container">

      <h2 className="title">
        {filterType ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Trips` : "Available Trips"}
      </h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* TRIPS */}
      <div className="trip-grid">
        {trips.length === 0 ? (
          <p>No available trips found</p>
        ) : (
          trips.map(trip => (
            <div key={trip.id} className="trip-card">

              <span className="badge">{trip.type}</span>

              {trip.type === "bus" ? (
                <>
                  <p>{trip.from} → {trip.to}</p>
                </>
              ) : (
                <>
                  <p>{trip.status === "On Service" ? "Taxi/Private available now" : "Service slot available"}</p>
                  <p><strong>Start:</strong> {trip.startTime ? new Date(trip.startTime).toLocaleString() : "N/A"}</p>
                  <p><strong>End:</strong> {trip.endTime ? new Date(trip.endTime).toLocaleString() : "N/A"}</p>
                </>
              )}


              <button className="book-btn"
                onClick={() => openBooking(trip)}>
                Book Now
              </button>

            </div>
          ))
        )}
      </div>

      {/*BOOKING MODAL */}
      {selectedTrip && (
        <div className="modal">

          <div className="modal-box">

            <h3>Booking Form - {selectedTrip.type.toUpperCase()}</h3>

            <p><strong>Driver:</strong> {selectedTrip.driver}</p>
            <p><strong>Contact:</strong> {selectedTrip.contact}</p>

            {selectedTrip.type === "bus" ? (
              <>
                <p><strong>Route:</strong> {selectedTrip.from} → {selectedTrip.to}</p>
                <p><strong>Time:</strong> {new Date(selectedTrip.time).toLocaleString()}</p>
                <p><strong>Available Seats:</strong> {selectedTrip.capacity - (selectedTrip.booked || 0)}</p>
              </>
            ) : (
              <>
                <p><strong>Start:</strong> {selectedTrip.startTime ? new Date(selectedTrip.startTime).toLocaleString() : "N/A"}</p>
                <p><strong>End:</strong> {selectedTrip.endTime ? new Date(selectedTrip.endTime).toLocaleString() : "N/A"}</p>
                <p><strong>Status:</strong> {selectedTrip.status}</p>
              </>
            )}

            <input
              placeholder="Passenger Name"
              value={form.name}
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
            />

            {selectedTrip.type !== "bus" && (
              <>
                <input
                  placeholder="Pickup Location"
                  value={form.pickupLocation}
                  onChange={e =>
                    setForm({ ...form, pickupLocation: e.target.value })
                  }
                />
                <input
                  placeholder="Destination"
                  value={form.destination}
                  onChange={e =>
                    setForm({ ...form, destination: e.target.value })
                  }
                />
                <textarea
                  placeholder="Special Requests (optional)"
                  value={form.specialRequests}
                  onChange={e =>
                    setForm({ ...form, specialRequests: e.target.value })
                  }
                  rows="3"
                />
              </>
            )}

            <input
              type="date"
              value={form.date}
              onChange={e =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              type="number"
              min="1"
              max={selectedTrip.type === "bus" ? (selectedTrip.capacity - (selectedTrip.booked || 0)) : "4"}
              value={form.passengers}
              onChange={e =>
                setForm({ ...form, passengers: e.target.value })
              }
            />

            <label htmlFor="booking-payment" className="payment-label">Payment Method</label>
            <select
              id="booking-payment"
              value={form.payment}
              onChange={e =>
                setForm({ ...form, payment: e.target.value })
              }
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Money</option>
            </select>

            <div className="modal-actions">
              <button
                onClick={confirmBooking}
                disabled={loading}
                className="confirm-btn"
              >
                {loading ? "Processing..." : "Confirm Booking"}
              </button>

              <button
                className="cancel-btn"
                onClick={() => setSelectedTrip(null)}
              >
                Cancel
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}