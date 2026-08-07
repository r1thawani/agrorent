// src/pages/Dashboard.jsx
// Renter Dashboard — sub-phase 4B.
// Pattern A: 100% inline style={{}}, no Tailwind classes, matching Home/Listings/
// ListingDetail/Login/Signup/ForgotPassword/ResetPassword.

import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, MessageSquare } from "lucide-react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { BOOKINGS, MESSAGES, NOTIFICATIONS } from "../data/mockData";

const STATUS_BADGE = {
  confirmed: { bg: "#D4EDDA", text: "#0F3D1E", label: "Confirmed" },
  pending: { bg: "#FFE8D6", text: "#CC4A00", label: "Pending" },
  active: { bg: "#FFE8D6", text: "#CC4A00", label: "Active" },
  completed: { bg: "#F5F5F0", text: "#555555", label: "Completed" },
  cancelled: { bg: "#FDECEA", text: "#A02020", label: "Cancelled" },
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

export default function Dashboard() {
  const [activeLink] = useState("/dashboard");
  const upcoming = BOOKINGS.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  );

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
        <Sidebar role="renter" activeLink={activeLink} userName="Mutinta Mwansa" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111" }}>
            Welcome back, Mutinta
          </h1>

          {/* Stat Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            <StatCard label="Active bookings" value={1} />
            <StatCard label="Upcoming bookings" value={upcoming.length} />
            <StatCard label="Total rentals completed" value={7} />
          </div>

          {/* Upcoming Bookings */}
          <div style={{ marginTop: "28px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#111111",
                marginBottom: "12px",
              }}
            >
              Upcoming bookings
            </h2>

            {upcoming.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  fontSize: "14px",
                  color: "#555555",
                  border: "0.5px solid #E0E8E3",
                }}
              >
                No upcoming bookings
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {upcoming.map((b) => (
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
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#111111",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
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
                      to="/my-bookings"
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
            )}
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

          {/* Recent Notifications */}
          <div style={{ marginTop: "28px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#111111",
                marginBottom: "12px",
              }}
            >
              Recent notifications
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {NOTIFICATIONS.slice(0, 3).map((n) => {
                const iconBg =
                  n.type === "confirmed" || n.type === "completed"
                    ? "#D4EDDA"
                    : n.type === "request"
                    ? "#FFE8D6"
                    : "#E0E8E3";
                return (
                  <div
                    key={n.id}
                    style={{
                      backgroundColor: n.read ? "#FFFFFF" : "#FFF8F5",
                      borderRadius: "12px",
                      padding: "14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      border: "0.5px solid #E0E8E3",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        backgroundColor: iconBg,
                      }}
                    >
                      {n.type === "confirmed" || n.type === "completed" ? (
                        <CheckCircle size={16} style={{ color: "#0F3D1E" }} />
                      ) : n.type === "request" ? (
                        <Clock size={16} style={{ color: "#FF5C00" }} />
                      ) : (
                        <MessageSquare size={16} style={{ color: "#555555" }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", color: "#111111", lineHeight: 1.4 }}>
                        {n.text}
                      </div>
                      <div style={{ fontSize: "12px", color: "#555555", marginTop: "4px" }}>
                        {n.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
