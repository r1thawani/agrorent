// src/pages/OwnerDashboard.jsx
// Owner Dashboard — sub-phase 4B.
// Pattern A: 100% inline style={{}}, no Tailwind classes.

import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { BOOKINGS, MESSAGES } from "../data/mockData";

const STATUS_BADGE = {
  confirmed: { bg: "#D4EDDA", text: "#0F3D1E", label: "Confirmed" },
  pending: { bg: "#FFE8D6", text: "#CC4A00", label: "Pending" },
  completed: { bg: "#F5F5F0", text: "#555555", label: "Completed" },
};

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.completed;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "20px",
        backgroundColor: s.bg,
        color: s.text,
      }}
    >
      {s.label}
    </span>
  );
}

// Owner-side booking requests are a separate mock dataset from the renter-side
// BOOKINGS list (these are pending requests awaiting accept/decline, modeled
// after the renter's outstanding requests on this owner's listings). This same
// shape will be reused and expanded in sub-phase 4E (BookingRequests.jsx).
const PENDING_REQUESTS = [
  {
    id: "r1",
    renter: "Kalinda Nkonde",
    renterPhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=88&h=88&fit=crop",
    equipment: "John Deere 5075E Tractor",
    dates: "15 Feb – 22 Feb 2025",
    value: 1750,
  },
  {
    id: "r2",
    renter: "Bwalya Mwape",
    renterPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=88&h=88&fit=crop",
    equipment: "4-Row Maize Planter",
    dates: "1 Mar – 5 Mar 2025",
    value: 600,
  },
  {
    id: "r3",
    renter: "Mutinta Siwale",
    renterPhoto: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=88&h=88&fit=crop",
    equipment: "3-Disc Plough",
    dates: "10 Mar – 12 Mar 2025",
    value: 240,
  },
];

export default function OwnerDashboard() {
  const [activeLink] = useState("/dashboard/owner");
  const confirmedBookings = BOOKINGS.filter((b) => b.status === "confirmed");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F5F5F0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "32px 24px",
          paddingTop: "88px",
          display: "flex",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        <Sidebar role="owner" activeLink={activeLink} userName="Chanda Mutale" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111" }}>
            Welcome back, Chanda
          </h1>

          {/* Stat Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            <StatCard label="Active listings" value="6" />
            <StatCard label="Pending requests" value="3" valueColor="#FF5C00" />
            <StatCard label="Confirmed bookings" value="8" />
            <StatCard label="Earnings this month" value="K14,250" valueColor="#FF5C00" />
          </div>

          {/* Pending Booking Requests */}
          <div style={{ marginTop: "28px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#111111",
                marginBottom: "12px",
              }}
            >
              Pending booking requests
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {PENDING_REQUESTS.map((r) => (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "0.5px solid #E0E8E3",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <img
                      src={r.renterPhoto}
                      alt={r.renter}
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>
                        {r.renter}
                      </div>
                      <div style={{ fontSize: "13px", color: "#555555" }}>{r.equipment}</div>
                      <div style={{ fontSize: "13px", color: "#555555" }}>{r.dates}</div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#FF5C00",
                          marginTop: "4px",
                        }}
                      >
                        K{r.value.toLocaleString()} total
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        style={{
                          padding: "9px 18px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#FFFFFF",
                          backgroundColor: "#1A5C2E",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Accept
                      </button>
                      <button
                        style={{
                          padding: "9px 18px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#555555",
                          backgroundColor: "transparent",
                          borderRadius: "8px",
                          border: "0.5px solid #CCCCCC",
                          cursor: "pointer",
                        }}
                      >
                        Decline
                      </button>
                      <Link
                        to="/messages"
                        style={{
                          fontSize: "12px",
                          color: "#1A5C2E",
                          textAlign: "center",
                          textDecoration: "none",
                        }}
                      >
                        Message renter
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Confirmed Bookings */}
          <div style={{ marginTop: "28px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#111111",
                marginBottom: "12px",
              }}
            >
              Upcoming confirmed bookings
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {confirmedBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    border: "0.5px solid #E0E8E3",
                  }}
                >
                  <img
                    src={b.equipmentImage}
                    alt={b.equipment}
                    style={{
                      width: "60px",
                      height: "48px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>
                      {b.equipment}
                    </div>
                    <div style={{ fontSize: "13px", color: "#555555" }}>
                      {b.startDate} → {b.endDate}
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                  <Link
                    to="/booking-requests"
                    style={{
                      fontSize: "13px",
                      color: "#1A5C2E",
                      flexShrink: 0,
                      textDecoration: "none",
                    }}
                  >
                    View details
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Messages */}
          <div style={{ marginTop: "28px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#111111",
                marginBottom: "12px",
              }}
            >
              Recent messages
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {MESSAGES.slice(0, 2).map((m) => (
                <Link
                  key={m.id}
                  to="/messages"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    border: "0.5px solid #E0E8E3",
                    textDecoration: "none",
                  }}
                >
                  <img
                    src={m.photo}
                    alt={m.person}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>
                      {m.person}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#555555",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.lastMessage}
                    </div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#555555", flexShrink: 0 }}>
                    {m.time}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
