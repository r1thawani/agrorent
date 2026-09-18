import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";
import { formatDateRange } from "../utils/formatDate";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_CLASSES = {
  confirmed: "bg-green-tint text-green-dark",
  pending:   "bg-orange-tint text-orange-dark",
  completed: "bg-page text-ink-muted",
  cancelled: "bg-red-tint text-red",
  declined:  "bg-red-tint text-red",
};

const STATUS_LABELS = {
  confirmed: "Confirmed", pending: "Pending", completed: "Completed",
  cancelled: "Cancelled", declined: "Declined",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full ${STATUS_CLASSES[status] || STATUS_CLASSES.pending}`}>
      {STATUS_LABELS[status] || "Pending"}
    </span>
  );
}

function BookingRow({ booking, onCancel }) {
  const photos = (booking.equipment?.equipment_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const image = photos[0]?.url || "";

  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-4 border border-border/50">
      <img src={image} alt={booking.equipment?.name}
        className="w-[72px] h-[60px] rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink">{booking.equipment?.name}</div>
        <div className="text-[13px] text-ink-muted my-0.5 mb-2">
          {formatDateRange(booking.start_date, booking.end_date)}
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="text-[15px] font-medium text-orange shrink-0">
        K{Number(booking.total_price).toLocaleString()}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Link to={`/listings/${booking.equipment_id}`} className="text-[13px] text-green no-underline">
          View details
        </Link>
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <button
            onClick={() => onCancel(booking.id)}
            className="text-[13px] text-red bg-transparent border-none p-0 cursor-pointer"
          >
            Cancel booking
          </button>
        )}
        {booking.status === "completed" && (
          <Link
            to={`/review/${booking.id}`}
            className="text-xs px-3 py-[5px] rounded-lg border-[1.5px] border-orange text-orange font-medium no-underline"
          >
            Leave a review
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) return;
    bookingService.getMyBookings(user.id)
      .then(setBookings)
      .catch(() => setLoadError("Could not load your bookings."))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCancel(id) {
    const original = bookings.find((b) => b.id === id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    try { await bookingService.cancel(id); }
    catch { setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: original?.status ?? "pending" } : b))); }
  }

  const filtered = activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab);

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6 items-start">
        <Sidebar activeLink="/my-bookings" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[26px] font-medium text-ink mb-5">My bookings</h1>

          <div className="flex gap-6 border-b border-border mb-5 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-sm pb-3 bg-transparent cursor-pointer border-none border-b-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-orange text-orange font-medium"
                    : "border-transparent text-ink-muted font-normal"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-10 text-ink-muted">Loading…</div>}
          {loadError && <div className="text-center py-10 text-red">{loadError}</div>}

          {!loading && !loadError && filtered.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center border border-border/50">
              <div className="text-[32px] mb-2">📋</div>
              <div className="text-sm text-ink-muted">
                No {activeTab === "all" ? "" : STATUS_LABELS[activeTab]?.toLowerCase() + " "}bookings
              </div>
            </div>
          )}

          {!loading && !loadError && filtered.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {filtered.map((b) => (
                <BookingRow key={b.id} booking={b} onCancel={handleCancel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
