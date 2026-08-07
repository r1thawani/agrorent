import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { BOOKINGS } from "../data/mockData";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

// Matches the status badge table in Section 5 of the design system exactly
// (same colors StatCard/Sidebar/etc. already use elsewhere).
const STATUS_STYLES = {
  confirmed: { bg: "#D4EDDA", color: "#0F3D1E", label: "Confirmed" },
  pending: { bg: "#FFE8D6", color: "#CC4A00", label: "Pending" },
  completed: { bg: "#F5F5F0", color: "#555555", label: "Completed" },
  cancelled: { bg: "#FDECEA", color: "#A02020", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "20px",
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

// Local sub-component, not extracted to components/ — same convention as
// ListingRow inside MyListings.jsx (4C): only extract once a second page
// needs the same row visual. BookingRequests.jsx (4E) is owner-side and
// will need a different row shape (accept/decline actions), so this stays local.
function BookingRow({ booking, onCancel }) {
  const dateRange = `${booking.startDate} → ${booking.endDate}`;
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        border: "0.5px solid #E0E8E3",
      }}
    >
      <img
        src={booking.equipmentImage}
        alt={booking.equipment}
        style={{ width: "72px", height: "60px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "15px", fontWeight: 500, color: "#111111" }}>{booking.equipment}</div>
        <div style={{ fontSize: "13px", color: "#555555", margin: "2px 0 6px" }}>{dateRange}</div>
        <StatusBadge status={booking.status} />
      </div>
      <div style={{ fontSize: "15px", fontWeight: 500, color: "#FF5C00", flexShrink: 0 }}>
        K{booking.totalPrice.toLocaleString()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
        <Link to={`/listings/${booking.equipmentId}`} style={{ fontSize: "13px", color: "#1A5C2E", textDecoration: "none" }}>
          View details
        </Link>
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <button
            onClick={() => onCancel(booking.id)}
            style={{ fontSize: "13px", color: "#A02020", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            Cancel booking
          </button>
        )}
        {booking.status === "completed" && (
          <Link
            to={`/review/${booking.id}`}
            style={{
              fontSize: "12px",
              padding: "5px 12px",
              borderRadius: "8px",
              border: "1.5px solid #FF5C00",
              color: "#FF5C00",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Leave a review
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MyBookings() {
  // Local copy of BOOKINGS so "Cancel booking" can update status without a backend.
  const [bookings, setBookings] = useState(BOOKINGS);
  const [activeTab, setActiveTab] = useState("all");

  function handleCancel(id) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
  }

  const filtered = activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F0" }}>
      <Sidebar role="renter" activeLink="/my-bookings" />
      <div style={{ flex: 1, padding: "32px", paddingTop: "88px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>My bookings</h1>

        <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #E0E8E3", marginBottom: "20px" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontSize: "14px",
                paddingBottom: "12px",
                background: "none",
                cursor: "pointer",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #FF5C00" : "2px solid transparent",
                color: activeTab === tab.key ? "#FF5C00" : "#555555",
                fontWeight: activeTab === tab.key ? 500 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
              border: "0.5px solid #E0E8E3",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
            <div style={{ fontSize: "14px", color: "#555555" }}>
              No {activeTab === "all" ? "" : STATUS_STYLES[activeTab]?.label.toLowerCase() + " "}bookings
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((b) => (
              <BookingRow key={b.id} booking={b} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
