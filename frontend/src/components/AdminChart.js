import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import "../styles/adminChart.css";

export default function AdminChart({ bookings = [] }) {
  const [filter, setFilter] = useState("all");

  // ✅ Filtered bookings (LIVE updates automatically)
  const filteredBookings = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.type === filter);
  }, [bookings, filter]);

  // ✅ Bar chart data (by type)
  const types = ["bus", "taxi", "private"];
  const barData = types.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: filteredBookings.filter((b) => b.type === type).length,
  }));

  // ✅ Line chart data (group by date)
  const lineData = Object.values(
    filteredBookings.reduce((acc, booking) => {
      const date = booking.date || "Unknown";

      if (!acc[date]) {
        acc[date] = { date, bookings: 0 };
      }

      acc[date].bookings += 1;
      return acc;
    }, {})
  );

  // ✅ Revenue (example: each booking has price)
  const totalRevenue = filteredBookings.reduce(
    (sum, b) => sum + (b.price || 0),
    0
  );

  return (
    <div className="chart-card">
      <h3 className="chart-title">System Overview</h3>

      {/* 🎯 FILTER */}
      <div className="chart-filter">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Services</option>
          <option value="bus">Bus</option>
          <option value="taxi">Taxi</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* 📊 SUMMARY */}
      <div className="chart-summary">
        <p>Total Bookings: {filteredBookings.length}</p>
        <p>Total Revenue: ${totalRevenue.toFixed(2)}</p>
      </div>

      {/* 📊 BAR CHART */}
      <h4>Bookings by Service</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* 📈 LINE CHART */}
      <h4 style={{ marginTop: "20px" }}>Booking Trends</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="bookings" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}