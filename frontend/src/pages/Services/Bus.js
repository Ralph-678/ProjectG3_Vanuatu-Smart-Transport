import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/APIBook";
import TripCard from "../../components/TripCard";
import busImg from "../../images/bus.jpg";
import "../../styles/service.css";

export default function Bus() {
  const [trips, setTrips] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate(true);

  useEffect(() => {
    api.getTrips().then(data => {
      const busTrips = data.filter(t => t.type === "bus");
      setTrips(busTrips);
    });
  }, []);

  return (
    <div className="service-page">

      {/* TOP CARD */}
      <div className="service-hero">
        <h1>Bus</h1>
        <img src={busImg} alt="Bus" />

        <div className="service-buttons">
          <button onClick={() => navigate("/services/details/bus")}className="view-btn">View More</button>
          <button className="book-btn" onClick={() => navigate("/booking?type=bus")}>Book Now</button>
        </div>
      </div>

      {/* 🔽 TRIPS LIST */}
      <h2>Available Bus Trips</h2>

      <div className="trip-grid">
        {trips.length === 0 ? (
          <p>No bus trips available</p>
        ) : (
          trips.map(trip => (
            <TripCard key={trip.id} trip={trip} user={user} />
          ))
        )}
      </div>
    </div>
  );
}