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
    try { await bookingService.accept(id); }
    catch { setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pending" } : r))); }
  }

  async function declineRequest(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "declined" } : r)));
    try { await bookingService.decline(id); }
    catch { setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pending" } : r))); }
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-[88px] pb-8 flex flex-col lg:flex-row gap-6 items-start">
        <Sidebar activeLink="/dashboard" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-medium text-ink">Welcome back, {firstName}</h1>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <StatCard label="Your listings" value={listings.length} />
            <StatCard label="Pending requests" value={pendingRequests.length} valueColor="#FF5C00" />
            <StatCard label="Upcoming bookings" value={upcomingBookings.length} />
            <StatCard label="Total rentals completed" value={completedCount} />
          </div>

          {pendingRequests.length > 0 && (
            <div className="mt-7">
              <h2 className="text-base font-medium text-ink mb-3">Pending requests on your listings</h2>
              <div className="flex flex-col gap-2.5">
                {pendingRequests.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl p-4 border border-border/50 flex items-start gap-3">
                    <img src={r.renter?.photo_url} alt={r.renter?.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0 bg-page" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink">{r.renter?.name}</div>
                      <div className="text-[13px] text-ink-muted">{r.equipment?.name}</div>
                      <div className="text-[13px] text-ink-muted">{r.start_date} – {r.end_date}</div>
                      <div className="text-sm font-medium text-orange mt-1">K{Number(r.total_price).toLocaleString()} total</div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => acceptRequest(r.id)}
                        className="px-4 py-2 text-[13px] font-medium text-white bg-green rounded-lg border-none cursor-pointer">
                        Accept
                      </button>
                      <button onClick={() => declineRequest(r.id)}
                        className="px-4 py-2 text-[13px] font-medium text-ink-muted bg-transparent rounded-lg border border-border-muted cursor-pointer">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7">
            <h2 className="text-base font-medium text-ink mb-3">Your upcoming bookings</h2>
            {loading ? (
              <div className="text-center py-6 text-ink-muted">Loading…</div>
            ) : upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-sm text-ink-muted border border-border/50">
                No upcoming bookings
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {upcomingBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} linkTo="/my-bookings" />
                ))}
              </div>
            )}
          </div>

          <div className="mt-7">
            <h2 className="text-base font-medium text-ink mb-3">Recent messages</h2>
            {loading ? (
              <div className="text-center py-6 text-ink-muted">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-sm text-ink-muted border border-border/50">
                No messages yet
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {conversations.slice(0, 2).map((m) => (
                  <Link key={m.id} to="/messages"
                    className="bg-white rounded-xl p-3.5 flex items-center gap-3 border border-border/50 no-underline">
                    <img src={m.photo} alt={m.person}
                      className="w-9 h-9 rounded-full object-cover shrink-0 bg-page" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink">{m.person}</div>
                      <div className="text-[13px] text-ink-muted truncate">{m.lastMessage}</div>
                    </div>
                    <span className="text-xs text-ink-muted shrink-0">{m.time}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-7">
            <h2 className="text-base font-medium text-ink mb-3">Recent notifications</h2>
            <div className="flex flex-col gap-2">
              {notifications.length === 0 ? (
                <div className="text-sm text-ink-muted">No notifications yet</div>
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
