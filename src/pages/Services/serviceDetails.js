import { useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import { api } from "../../api/APIBook";

export default function ServiceDetails() {
  const { type } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isBooking = params.get("book");

  const user = JSON.parse(localStorage.getItem("user"));
  const [selected, setSelected] = useState(null);
  const [duration, setDuration] = useState("hourly");

  const options = {
    taxi: [
      { id: 1, name: "Standard Taxi", seats: 4, prices: { hourly: 1000, daily: 5000, weekly: 30000 } },
      { id: 2, name: "Family Taxi", seats: 6, prices: { hourly: 1500, daily: 7500, weekly: 45000 } }
    ],
    bus: [
      { id: 1, name: "Mini Bus", seats: 12, price: 200 },
      { id: 2, name: "Full Bus", seats: 20, price: 200 }
    ],
    private: [
      { id: 1, name: "Small Car", seats: 4, prices: { hourly: 1500, daily: 7500, weekly: 45000 } },
      { id: 2, name: "SUV", seats: 6, prices: { hourly: 2500, daily: 12000, weekly: 70000 } },
      { id: 3, name: "Van", seats: 10, prices: { hourly: 4000, daily: 20000, weekly: 120000 } }
    ]
  };

  const serviceOptions = options[type] || [];
  const hasDurationOptions = type === "taxi" || type === "private";

  const handleBooking = async () => {
    try {
      const finalPrice = selected.prices ? selected.prices[duration] : selected.price;
      const finalVehicle = selected.prices ? `${selected.name} (${duration})` : selected.name;

      await api.createBooking({
        type,
        vehicle: finalVehicle,
        price: finalPrice,
        user: user?.name,
        status: "pending"
      });

      alert("Booking Confirmed!");
    } catch (err) {
      console.error(err);
      alert("Booking failed");
    }
  };

  return (
    <div className="service-page">
      <h1>{type.toUpperCase()} Options</h1>

      {hasDurationOptions && (
        <div className="duration-selector" style={{ marginBottom: "20px", textAlign: "center" }}>
          <label style={{ marginRight: "10px", fontWeight: "bold" }}>Select Duration: </label>
          <select 
            value={duration} 
            onChange={(e) => setDuration(e.target.value)}
            style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">1 Day</option>
            <option value="weekly">1 Week</option>
          </select>
        </div>
      )}

      <div className="trip-grid">
        {serviceOptions.map(opt => {
          const displayPrice = opt.prices ? opt.prices[duration] : opt.price;
          return (
            <div
              key={opt.id}
              className={`trip-card ${selected?.id === opt.id ? "active" : ""}`}
              onClick={() => setSelected(opt)}
            >
              <h3>{opt.name}</h3>
              <p>Seats: {opt.seats}</p>
              <p>Price: {displayPrice} VUV {hasDurationOptions ? `(${duration})` : ""}</p>
            </div>
          );
        })}
      </div>

      {isBooking && selected && (
        <div style={{ marginTop: "30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px", textAlign: "center", color: "black" }}>
          <h2>Confirm Booking</h2>
          <p><strong>Service:</strong> {type}</p>
          <p><strong>Vehicle:</strong> {selected.name}</p>
          {hasDurationOptions && <p><strong>Duration:</strong> {duration}</p>}
          <p><strong>Price:</strong> {selected.prices ? selected.prices[duration] : selected.price} VUV</p>

          <button className="book-btn" onClick={handleBooking} style={{ marginTop: "15px", padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}>
            Confirm Booking
          </button>
        </div>
      )}
    </div>
  );
}