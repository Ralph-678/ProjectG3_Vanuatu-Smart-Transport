import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/APIBook";
import TripCard from "../../components/TripCard";
import taxiImg from "../../images/Taxi.jpg";
import "../../styles/service.css";

export default function Taxi() {
  const [trips, setTrips] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    api.getTrips().then(data => {
      const taxiTrips = data.filter(t => t.type === "taxi");
      setTrips(taxiTrips);
    });
  }, []);

  return (
    <div className="service-page">

      {/* TOP CARD (LIKE YOUR SNAPSHOT) */}
      <div className="service-hero">
        <h1>Taxi</h1>
        <img src={taxiImg} alt="Taxi" />

        <div className="service-buttons">
          <button onClick={() => navigate("/services/details/taxi")} className="view-btn">View More</button>
          <button className="book-btn" onClick={() => navigate("/booking?type=taxi")}>Book Now</button>
        </div>
      </div>

      {/* TRIPS LIST */}
      <h2>Available Taxi Trips</h2>

      <div className="trip-grid">
        {trips.length === 0 ? (
          <p>No taxi trips available</p>
        ) : (
          trips.map(trip => (
            <TripCard key={trip.id} trip={trip} user={user} />
          ))
        )}
      </div>
    </div>
  );
}