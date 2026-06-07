import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/navbar";

import Home from "./pages/HomePage";
import Booking from "./pages/Bookings";
import MyBookings from "./pages/MyBookings";
import Contact from "./pages/Contact";
import Admin from "./pages/admin";
import Driver from "./pages/driver";
import Passenger from "./pages/passenger";
import Auth from "./pages/Auth";
import Services from "./pages/Services";
import Taxi from "./pages/Services/Taxi";
import Bus from "./pages/Services/Bus";
import PrivateHire from "./pages/Services/PrivateHire";
import ServiceDetails from "./pages/Services/serviceDetails";

import "./index.css";

// ================= AUTH =================
function getUser() {
  return (
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))
  );
}

// ================= APP ROUTES =================
function AppRoutes({ user, setUser }) {
  const location = useLocation();
  const hideNavbar = location.pathname === "/auth";

  const logout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/auth" replace />;
  };

  const RoleRoute = ({ children, role }) => {
    if (!user) return <Navigate to="/auth" replace />;
    if (user.role !== role) return <Navigate to="/" replace />;
    return children;
  };

  const AuthRoute = ({ children }) => {
    if (!user) return children;

    if (user.role === "Driver") return <Navigate to="/driver" />;
    if (user.role === "Admin") return <Navigate to="/admin" />;
    if (user.role === "Passenger") return <Navigate to="/passenger" />;

    return <Navigate to="/" />;
  };

  return (
    <>
      {!hideNavbar && <Navbar user={user} logout={logout} />}

      <Routes>
        {/* AUTH */}
        <Route
          path="/auth"
          element={
            <AuthRoute>
              <Auth setUser={setUser} />
            </AuthRoute>
          }
        />

        {/* HOME */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* BOOKING */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

        {/* SERVICES */}
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/taxi"
          element={
            <ProtectedRoute>
              <Taxi />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/bus"
          element={
            <ProtectedRoute>
              <Bus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/private"
          element={
            <ProtectedRoute>
              <PrivateHire />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/details/:type"
          element={
            <ProtectedRoute>
              <ServiceDetails />
            </ProtectedRoute>
          }
        />

        {/* MY BOOKINGS */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* CONTACT */}
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />

        {/* DRIVER */}
        <Route
          path="/driver"
          element={
            <RoleRoute role="Driver">
              <Driver />
            </RoleRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <RoleRoute role="Admin">
              <Admin />
            </RoleRoute>
          }
        />

        {/* PASSENGER */}
        <Route
          path="/passenger"
          element={
            <ProtectedRoute>
              <Passenger />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </>
  );
}

// ================= MAIN APP =================
export default function App() {
  const [user, setUser] = useState(getUser());
   useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/test`)
      .then(res => res.json())
      .then(data => console.log("Backend says:", data))
      .catch(err => console.error("Error:", err));
  }, []);
  return (
    <BrowserRouter>
      <AppRoutes user={user} setUser={setUser} />
    </BrowserRouter>
  );
}