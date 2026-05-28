import { useState } from "react";
import { Link } from "react-router-dom";
import ServiceDropdown from "./ServiceDropdown";
import logo from "../images/logo.png";
import "../styles/navbarLogo.css";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";

export default function Navbar({ user, logout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo-link" onClick={closeMenu}>
          <div className="logo-container">
            <img src={logo} alt="TransportVU Logo" className="logo" />
          </div>
          <h2>Vanuatu Smart Transport</h2>
        </Link>
      </div>

      <div className="menu-icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <FiX size={28} color="#ffffff" /> : <FiMenu size={28} color="#ffffff" />}
      </div>

      <div className={`nav-links ${isMobileMenuOpen ? "active" : ""}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/booking" onClick={closeMenu}>Bookings</Link>

        <ServiceDropdown />

        {/* DRIVER ONLY */}
        {user?.role === "Driver" && (
          <Link to="/driver" onClick={closeMenu}>Driver Panel</Link>
        )}

        {/* PASSENGER ONLY */}
        {user?.role === "Passenger" && (
          <Link to="/passenger" onClick={closeMenu}>Passenger Panel</Link>
        )}

        {/* ADMIN ONLY */}
        {user?.role === "Admin" && (
          <Link to="/admin" onClick={closeMenu}>Admin</Link>
        )}

        <Link to="/contact" onClick={closeMenu}>Contact</Link>

        {/* LOGOUT */}
        {user && (
          <button onClick={() => { logout(); closeMenu(); }} className="logout-btn" title="Logout">
            <FiLogOut />
          </button>
        )}
      </div>
    </div>
  );
}