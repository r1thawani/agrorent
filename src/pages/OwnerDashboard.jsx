// FILE: agrorent/src/pages/OwnerDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import BookingCard from "../components/BookingCard";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { messageService } from "../services/messageService";
import { useAuth } from "../hooks/useAuth";

export default function OwnerDashboard() {
  const [activeLink] = useState("/dashboard/owner");
  const { user } = useAuth();
  const firstName = (user?.name || "there").split(" ")[0];

  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      equipmentService.getMine(user.id),
      bookingService.getRequestsForOwner(user.id),
      messageService.getConversations(user.id),
    ])
      .then(([l, b, c]) => {
        setListings(l);
        setBookings(b);
        setConversations(c);
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function accept(id) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)));
    try {
      await bookingService.accept(id);
    } catch {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "pending" } : b)));
    }
  }

  async function decline(id) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "declined" } : b)));
    try {
      await bookingService.decline(id);
    } catch {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "pending" } : b)));
    }
  }

  const pendingRequests = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const earningsThisMonth = bookings
    .filter((b) => {
      if (b.status !== "confirmed" && b.status !== "completed") return false;
      const d = new Date(b.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + Number(b.total_price), 0);

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
        <Sidebar role="owner" activeLink={activeLink} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111" }}>
            Welcome back, {firstName}
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
            <StatCard label="Active listings" value={listings.length} />
            <StatCard label="Pending requests" value={pendingRequests.length} valueColor="#FF5C00" />
            <StatCard label="Confirmed bookings" value={confirmedBookings.length} />
            <StatCard label="Earnings this month" value={`K${earningsThisMonth.toLocaleString()}`} valueColor="#FF5C00" />
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
            {loading ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#555555" }}>Loading…</div>
            ) : pendingRequests.length === 0 ? (
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
                No pending requests
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingRequests.map((r) => (
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
                        src={r.renter?.photo_url}
                        alt={r.renter?.name}
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                          backgroundColor: "#F5F5F0",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>
                          {r.renter?.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "#555555" }}>{r.equipment?.name}</div>
                        <div style={{ fontSize: "13px", color: "#555555" }}>
                          {r.start_date} – {r.end_date}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#FF5C00",
                            marginTop: "4px",
                          }}
                        >
                          K{Number(r.total_price).toLocaleString()} total
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
                          onClick={() => accept(r.id)}
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
                          onClick={() => decline(r.id)}
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
            )}
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
            {loading ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#555555" }}>Loading…</div>
            ) : confirmedBookings.length === 0 ? (
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
                No confirmed bookings yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {confirmedBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} linkTo="/booking-requests" />
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
        </div>
      </div>
    </div>
  );
}