// FILE: agrorent/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import BookingCard from "../components/BookingCard";
import Notification from "../components/Notification";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { messageService } from "../services/messageService";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || "there").split(" ")[0];
  const { notifications, markAsRead } = useNotifications();

  const [listings, setListings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      equipmentService.getMine(user.id),
      bookingService.getMyBookings(user.id),
      bookingService.getRequestsForOwner(user.id),
      messageService.getConversations(user.id),
    ])
      .then(([l, b, r, c]) => {
        setListings(l);
        setMyBookings(b);
        setRequests(r);
        setConversations(c);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const upcomingBookings = myBookings.filter((b) => b.status === "confirmed" || b.status === "pending");
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const completedCount = myBookings.filter((b) => b.status === "completed").length;

  async function acceptRequest(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r)));
    try {
      await bookingService.accept(id);
    } catch {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pending" } : r)));
    }
  }

  async function declineRequest(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "declined" } : r)));
    try {
      await bookingService.decline(id);
    } catch {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pending" } : r)));
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", paddingTop: "88px", display: "flex", gap: "24px", alignItems: "flex-start" }}>
        <Sidebar activeLink="/dashboard" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111" }}>
            Welcome back, {firstName}
          </h1>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "20px" }}>
            <StatCard label="Your listings" value={listings.length} />
            <StatCard label="Pending requests" value={pendingRequests.length} valueColor="#FF5C00" />
            <StatCard label="Upcoming bookings" value={upcomingBookings.length} />
            <StatCard label="Total rentals completed" value={completedCount} />
          </div>

          {/* Pending requests on your listings */}
          {pendingRequests.length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "12px" }}>
                Pending requests on your listings
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingRequests.map((r) => (
                  <div key={r.id} style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "16px", border: "0.5px solid #E0E8E3", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <img src={r.renter?.photo_url} alt={r.renter?.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, backgroundColor: "#F5F5F0" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{r.renter?.name}</div>
                      <div style={{ fontSize: "13px", color: "#555555" }}>{r.equipment?.name}</div>
                      <div style={{ fontSize: "13px", color: "#555555" }}>{r.start_date} – {r.end_date}</div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#FF5C00", marginTop: "4px" }}>
                        K{Number(r.total_price).toLocaleString()} total
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                      <button onClick={() => acceptRequest(r.id)} style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 500, color: "#FFFFFF", backgroundColor: "#1A5C2E", borderRadius: "8px", border: "none", cursor: "pointer" }}>
                        Accept
                      </button>
                      <button onClick={() => declineRequest(r.id)} style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 500, color: "#555555", backgroundColor: "transparent", borderRadius: "8px", border: "0.5px solid #CCCCCC", cursor: "pointer" }}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your upcoming bookings */}
          <div style={{ marginTop: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "12px" }}>
              Your upcoming bookings
            </h2>
            {loading ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#555555" }}>Loading…</div>
            ) : upcomingBookings.length === 0 ? (
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "24px", textAlign: "center", fontSize: "14px", color: "#555555", border: "0.5px solid #E0E8E3" }}>
                No upcoming bookings
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {upcomingBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} linkTo="/my-bookings" />
                ))}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div style={{ marginTop: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "12px" }}>
              Recent messages
            </h2>
            {loading ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#555555" }}>Loading…</div>
            ) : conversations.length === 0 ? (
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "24px", textAlign: "center", fontSize: "14px", color: "#555555", border: "0.5px solid #E0E8E3" }}>
                No messages yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {conversations.slice(0, 2).map((m) => (
                  <Link key={m.id} to="/messages" style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", border: "0.5px solid #E0E8E3", textDecoration: "none" }}>
                    <img src={m.photo} alt={m.person} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, backgroundColor: "#F5F5F0" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{m.person}</div>
                      <div style={{ fontSize: "13px", color: "#555555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.lastMessage}</div>
                    </div>
                    <span style={{ fontSize: "12px", color: "#555555", flexShrink: 0 }}>{m.time}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div style={{ marginTop: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "12px" }}>
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