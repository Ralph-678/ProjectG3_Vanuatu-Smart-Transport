import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import busImg from "../images/bus.jpg";
import hireImg from "../images/Private-Hire.jpg";
import taxiImg from "../images/Taxi.jpg"


export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const services = [
    { name: "Taxi", img: taxiImg },
    { name: "Bus", img: busImg },
    { name: "Private Hire", img: hireImg },
   
  ];

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home">

      {/* HERO */}
      <div className="hero-image">

        <div className="hero-content">
          <h1>Book Transport Easily</h1>
          <p>Fast • Reliable • Anywhere in Vanuatu</p>
        </div>
      </div>

      {/* ABOUT */}
      <section className="about">
        <h2>About</h2>
        <p>
          TransportVU is a smart transport booking system that helps users in Vanuatu
          easily find and book taxis, buses, and public transport. Our platform is
          designed to make travel simple, fast, and reliable—all in one place.
        </p>
      </section>
      {/* SERVICES */}
      <section className="services">
        <h3>Our Services</h3>
         {/* SEARCH */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search transport..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

        <div className="service-grid">
          {filtered.map((s, i) => (
            <div className="service-card" key={i}>
              <h3>{s.name}</h3>
              <img src={s.img} alt={s.name} />
              <div className="action-buttons">
  <div className="book-now">
    <button onClick={() => navigate("/services")}>View More</button>
  </div>

  <div className="book-now">
    <button onClick={() => navigate("/booking")}>Book Now</button>
  </div>
</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} TransportVU</p>
        <p>Smart Transport for Vanuatu</p>
      </footer>

    </div>
  );
}