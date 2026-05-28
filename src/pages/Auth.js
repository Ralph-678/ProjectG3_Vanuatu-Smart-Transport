import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import logo1 from "../images/logo2.png";

export default function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Passenger",
    contact: "",
  });

  const navigate = useNavigate();
  const BASE_URL = "http://localhost:5001";

  const submit = async () => {
    setError("");

    if (isLogin) {

      // LOGIN VALIDATION
      if (!form.username || !form.password) {
        setError("Please enter username and password");
        return;
      }
    } else {

      // SIGNUP VALIDATION
      if (!form.username || !form.email || !form.password || !form.confirmPassword) {
        setError("Please fill all required fields");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError("Please enter a valid email address");
        return;
      }

      // Driver email validation - must end with @driver.vu
      if (form.role === "Driver" && !form.email.endsWith("@driver.vu")) {
        setError("Driver email must end with @driver.vu");
        return;
      }
    }

    try {
      const url = isLogin ? "/login" : "/signup";

      let payload;
      if (isLogin) {
        payload = {
          username: form.username,
          password: form.password,
        };
      } else {
        payload = {
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          contact: form.contact,
        };
      }

      const res = await fetch(`${BASE_URL}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Request failed");
        return;
      }

      // Store user data
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("user", JSON.stringify(data.user));

      const role = data.user.role;

      // ROLE-BASED NAVIGATION
      if (role === "Driver") {
        navigate("/driver", { replace: true });
      } else if (role === "Admin") {
        navigate("/admin", { replace: true });
      } else if (role === "Passenger") {
        navigate("/passenger", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } catch (err) {
      console.error(err);
      setError("Network error: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* ✅ FIXED LOGO */}
        <div className="logo1-container">
          <img src={logo1} alt="App Logo" className="logo1"/>
        </div>
        <h1 className="auth-welcome">Vanuatu Smart Transport</h1>
        <h2>{isLogin ? "Login to your Account" : "Signup"}</h2>

        {error && <p className="auth-error">{error}</p>}

        {/* LOGIN FORM */}
        {isLogin ? (
          <>
          <input
              placeholder="Username"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
            />
        
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </>
        ) : (
          /* SIGNUP FORM */
          <>
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
            />

            {/* <input
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
            /> */}

            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <input
              placeholder="Contact Number"
              value={form.contact}
              onChange={(e) =>
                setForm({ ...form, contact: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />

            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="Passenger">Passenger</option>
              <option value="Driver">Driver</option>
              <option value="Admin">Admin</option>
            </select>

            {form.role === "Driver" && (
              <p style={{ fontSize: "12px", color: "#666", textAlign: "center" }}>
                Driver email must end with @driver.vu
              </p>
            )}
          </>
        )}

        <button type="button" onClick={submit}>
          {isLogin ? "Login" : "Signup"}
        </button>

        <p
          className="auth-switch"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setForm({
              username: "",
              email: "",
              password: "",
              confirmPassword: "",
              role: "Passenger",
              contact: "",
              fullName: ""
            });
          }}
        >
          Switch to {isLogin ? "Signup" : "Login"}
        </p>

      </div>
    </div>
  );
}