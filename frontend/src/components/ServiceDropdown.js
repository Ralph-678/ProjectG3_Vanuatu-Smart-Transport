import { useState } from "react";
import { Link } from "react-router-dom";

export default function ServiceDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="dropdown"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="dropdown-title">Services ▾</span>

      {open && (
        <div className="dropdown-menu">
          <Link to="/services/taxi">Taxi</Link>
          <Link to="/services/bus">Bus</Link>
          <Link to="/services/private">Private Hire</Link>
        </div>
      )}
    </div>
  );
}