// FILE: agrorent/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import BookingCard from "../components/BookingCard";
import Notification from "../components/Notification";
import { bookingService } from "../services/bookingService";
import { messageService } from "../services/messageService";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const [activeLink] = useState("/dashboard");
  const { user } = useAuth();
  const firstName = (user?.name || "there").split(" ")[0];
  const { notifications, markAsRead } = useNotifications();

  const [bookings, setBookings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      bookingService.getMyBookings(user.id),
      messageService.getConversations(user.id),
    ])
      .then(([b, c]) => {
        setBookings(b);
        setConversations(c);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "pending");
  const activeCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

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
        <Sidebar role="renter" activeLink={activeLink} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111" }}>
            Welcome back, {firstName}
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
            <StatCard label="Active bookings" value={activeCount} />
            <StatCard label="Upcoming bookings" value={upcoming.length} />
            <StatCard label="Total rentals completed" value={completedCount} />
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

            {loading ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#555555" }}>Loading…</div>
            ) : upcoming.length === 0 ? (
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
                  <BookingCard key={b.id} booking={b} linkTo="/my-bookings" />
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
            {loading ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#555555" }}>Loading…</div>
            ) : conversations.length === 0 ? (
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
                No messages yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {conversations.slice(0, 2).map((m) => (
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
                        backgroundColor: "#F5F5F0",
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
            )}
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
              {notifications.length === 0 ? (
                <div style={{ fontSize: "14px", color: "#555555" }}>No notifications yet</div>
              ) : (
                notifications.slice(0, 3).map((n) => (
                  <Notification key={n.id} notification={n} onClick={() => markAsRead(n.id)} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}