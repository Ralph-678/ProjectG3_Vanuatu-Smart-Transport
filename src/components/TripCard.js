import { useNavigate } from "react-router-dom";

export default function TripCard({ trip }) {
  const navigate = useNavigate();

  const handleBooking = () => {
    navigate(`/booking?type=${trip.type}&tripId=${trip.id}`);
  };

  return (
    <div className="trip-card">
      <h3>{trip.type.toUpperCase()} {trip.busSize && `- ${trip.busSize}`}</h3>
      
      {trip.type === "bus" ? (
        <>
          <p><strong>Route:</strong> {trip.from} → {trip.to}</p>
          <p><strong>Time:</strong> {new Date(trip.time).toLocaleString()}</p>
          <p><strong>Available Seats:</strong> {trip.capacity - (trip.booked || 0)}</p>
        </>
      ) : (
        <>
          <p><strong>Driver:</strong> {trip.driver}</p>
          <p><strong>Contact:</strong> {trip.contact}</p>
          <p><strong>Start:</strong> {trip.startTime ? new Date(trip.startTime).toLocaleString() : "N/A"}</p>
          <p><strong>End:</strong> {trip.endTime ? new Date(trip.endTime).toLocaleString() : "N/A"}</p>
          <p><strong>Status:</strong> {trip.status}</p>
          <p><strong>Availability:</strong> {trip.availability === "available" ? "Available for Service" : "Not Available"}</p>
        </>
      )}

      <button onClick={handleBooking}>
        Book Now
      </button>
    </div>
  );
}