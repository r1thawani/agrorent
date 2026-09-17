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
    try { await bookingService.accept(id); }
    catch { setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "pending" } : b))); }
  }

  async function decline(id) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "declined" } : b)));
    try { await bookingService.decline(id); }
    catch { setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "pending" } : b))); }
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
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6 items-start">
        <Sidebar role="owner" activeLink="/dashboard/owner" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-medium text-ink">Welcome back, {firstName}</h1>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <StatCard label="Active listings" value={listings.length} />
            <StatCard label="Pending requests" value={pendingRequests.length} valueColor="#FF5C00" />
            <StatCard label="Confirmed bookings" value={confirmedBookings.length} />
            <StatCard label="Earnings this month" value={`K${earningsThisMonth.toLocaleString()}`} valueColor="#FF5C00" />
          </div>

          <div className="mt-7">
            <h2 className="text-base font-medium text-ink mb-3">Pending booking requests</h2>
            {loading ? (
              <div className="text-center py-6 text-ink-muted">Loading…</div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-sm text-ink-muted border border-border/50">
                No pending requests
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pendingRequests.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl p-4 border border-border/50">
                    <div className="flex items-start gap-3">
                      <img src={r.renter?.photo_url} alt={r.renter?.name}
                        className="w-11 h-11 rounded-full object-cover shrink-0 bg-page" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink">{r.renter?.name}</div>
                        <div className="text-[13px] text-ink-muted">{r.equipment?.name}</div>
                        <div className="text-[13px] text-ink-muted">{r.start_date} – {r.end_date}</div>
                        <div className="text-sm font-medium text-orange mt-1">
                          K{Number(r.total_price).toLocaleString()} total
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => accept(r.id)}
                          className="px-[18px] py-2 text-[13px] font-medium text-white bg-green rounded-lg border-none cursor-pointer">
                          Accept
                        </button>
                        <button onClick={() => decline(r.id)}
                          className="px-[18px] py-2 text-[13px] font-medium text-ink-muted bg-transparent border border-border-muted rounded-lg cursor-pointer">
                          Decline
                        </button>
                        <Link to="/messages"
                          className="text-xs text-center text-green no-underline">
                          Message renter
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-7">
            <h2 className="text-base font-medium text-ink mb-3">Upcoming confirmed bookings</h2>
            {loading ? (
              <div className="text-center py-6 text-ink-muted">Loading…</div>
            ) : confirmedBookings.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-sm text-ink-muted border border-border/50">
                No confirmed bookings yet
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {confirmedBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} linkTo="/booking-requests" />
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
        </div>
      </div>
    </div>
  );
}
