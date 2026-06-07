import { useState } from "react";
import "../styles/contact.css";
export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      setStatus("Please fill all fields");
      return;
    }

    // 🔥 For now just simulate send
    setStatus("Message sent successfully ✅");

    setForm({
      name: "",
      email: "",
      message: ""
    });
  };

  return (
    <div className="container">

      <div className="contact-card">

        <h3>Contact Us </h3>

        <p className="contact-subtext">
          Have questions or need help booking a trip? Reach out to us.
        </p>

        <div className="contact-grid">

          {/* ================= LEFT: INFO ================= */}
          <div className="contact-info">
            <h3>Company Info</h3>

            <p><strong>Email:</strong> support@transport.vu</p>
            <p><strong>Phone:</strong> +678 123 456</p>
            <p><strong>Location:</strong> Port Vila, Vanuatu</p>

            <p className="contact-note">
              We are available 7 days a week to assist with your transport needs.
            </p>
          </div>

          {/* ================= RIGHT: FORM ================= */}
          <form className="contact-form" onSubmit={handleSubmit}>

            <input
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
            />

            <textarea
              name="message"
              placeholder="Your Message"
              rows="5"
              value={form.message}
              onChange={handleChange}
            />

            <button type="submit">Send Message</button>

            {status && <p className="contact-status">{status}</p>}
          </form>

        </div>

      </div>

    </div>
  );
}