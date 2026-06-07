import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/APIBook";
import TripCard from "../../components/TripCard";
import hireImg from "../../images/Private-Hire.jpg";
import "../../styles/service.css";

export default function PrivateHire() {
  const [trips, setTrips] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    api.getTrips().then(data => {
      const privateTrips = data.filter(t => t.type === "private");
      setTrips(privateTrips);
    });
  }, []);

  return (
    <div className="service-page">

      {/* TOP CARD (LIKE YOUR SNAPSHOT) */}
      <div className="service-hero">
        <h1>Private Hire</h1>
        <img src={hireImg} alt="Private" />

        <div className="service-buttons">
         <button onClick={() => navigate("/services/details/private")} className="view-btn">View More</button>
        <button className="book-btn" onClick={() => navigate("/booking?type=private")}>Book Now</button>
        </div>
      </div>

      {/* TRIPS LIST */}
      <h2>Available Private Hire Trips</h2>

      <div className="trip-grid">
        {trips.length === 0 ? (
          <p>No Private Hire trips available</p>
        ) : (
          trips.map(trip => (
            <TripCard key={trip.id} trip={trip} user={user} />
          ))
        )}
      </div>
    </div>
  );
}