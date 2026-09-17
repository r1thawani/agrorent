import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";

const TABS = ["Pending", "Accepted", "Declined"];
const TAB_TO_STATUS = { Pending: "pending", Accepted: "confirmed", Declined: "declined" };

const STATUS_CLASSES = {
  pending:   "bg-orange-tint text-orange-dark",
  confirmed: "bg-green-tint text-green-dark",
  declined:  "bg-red-tint text-red",
};
const STATUS_LABELS = { pending: "Pending", confirmed: "Accepted", declined: "Declined" };

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full ${STATUS_CLASSES[status] || STATUS_CLASSES.pending}`}>
      {STATUS_LABELS[status] || "Pending"}
    </span>
  );
}

function RequestRow({ request, onAccept, onDecline }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border/50 flex items-start gap-3">
      <img src={request.renter?.photo_url} alt={request.renter?.name}
        className="w-11 h-11 rounded-full object-cover shrink-0 bg-page" />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink">{request.renter?.name}</div>
        <div className="text-[13px] text-ink-muted mt-0.5">
          wants to rent{" "}
          <Link to={`/listings/${request.equipment_id}`} className="font-medium text-green no-underline">
            {request.equipment?.name}
          </Link>
        </div>
        <div className="text-[13px] text-ink-muted">{request.start_date} → {request.end_date}</div>
        <div className="text-[15px] font-medium text-orange mt-1">
          K{Number(request.total_price).toLocaleString()} total
        </div>
      </div>
      <div className="shrink-0">
        {request.status === "pending" ? (
          <div className="flex flex-col gap-2">
            <button onClick={() => onAccept(request.id)}
              className="bg-green text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer">
              Accept
            </button>
            <button onClick={() => onDecline(request.id)}
              className="bg-transparent text-ink-muted border border-border-muted rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer">
              Decline
            </button>
            <Link to="/messages" className="text-xs text-center text-green no-underline">
              Message renter
            </Link>
          </div>
        ) : (
          <StatusBadge status={request.status} />
        )}
      </div>
    </div>
  );
}

export default function BookingRequests() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) return;
    bookingService.getRequestsForOwner(user.id)
      .then(setRequests)
      .catch(() => setLoadError("Could not load booking requests."))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = requests.filter((r) => r.status === TAB_TO_STATUS[activeTab]);

  async function accept(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r)));
    try { await bookingService.accept(id); }
    catch { setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pending" } : r))); }
  }

  async function decline(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "declined" } : r)));
    try { await bookingService.decline(id); }
    catch { setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pending" } : r))); }
  }

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6 items-start">
        <Sidebar activeLink="/booking-requests" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-medium text-ink mb-4">Booking requests</h1>

          <div className="flex gap-6 border-b border-border mb-5">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm pb-3 bg-transparent border-none cursor-pointer border-b-2 ${
                  activeTab === tab
                    ? "border-orange text-orange font-medium"
                    : "border-transparent text-ink-muted font-normal"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-10 text-ink-muted">Loading…</div>}
          {loadError && <div className="text-center py-10 text-red">{loadError}</div>}

          {!loading && !loadError && filtered.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-sm text-ink-muted border border-border/50">
              No {activeTab.toLowerCase()} requests
            </div>
          )}

          {!loading && !loadError && filtered.length > 0 && (
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <RequestRow key={r.id} request={r} onAccept={accept} onDecline={decline} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
