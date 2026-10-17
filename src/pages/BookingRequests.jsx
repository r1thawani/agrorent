import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";
import { useNow } from "../hooks/useNow";
import { useNotifications } from "../context/NotificationContext";
import Avatar from "../components/Avatar";
import { formatDateRange } from "../utils/formatDate";
import { friendlyError } from "../utils/friendlyError";
import { acceptBlocker, describeStatus, effectiveStatus, timeLeft, TONE_CLASSES } from "../utils/bookingStatus";

const TABS = [
  { key: "pending", label: "New requests", statuses: ["pending"] },
  { key: "accepted", label: "Awaiting payment", statuses: ["accepted"] },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed", "completed"] },
  { key: "closed", label: "Declined / cancelled", statuses: ["declined", "expired", "cancelled"] },
];

function RequestRow({ request, allBookings, now, busy, onAccept, onDecline }) {
  const status = effectiveStatus(request, now);
  const { label, tone, note } = describeStatus(request, "owner", now);
  const blocker = status === "pending" ? acceptBlocker(request, allBookings, now) : "";

  return (
    <div className="bg-white rounded-xl p-4 border border-border/50 flex flex-wrap sm:flex-nowrap items-start gap-3">
      <Avatar src={request.renter?.photo_url} name={request.renter?.name}
        className="w-11 h-11 text-[13px]" />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink">{request.renter?.name}</div>
        <div className="text-[13px] text-ink-muted mt-0.5">
          wants to rent{" "}
          <Link to={`/listings/${request.equipment_id}`} className="font-medium text-green no-underline">
            {request.equipment?.name}
          </Link>
        </div>
        <div className="text-[13px] text-ink-muted">{formatDateRange(request.start_date, request.end_date)}</div>
        <div className="text-[15px] font-medium text-orange mt-1">
          K{Number(request.subtotal).toLocaleString()} for you
          <span className="text-[12px] text-ink-muted font-normal"> · deposit K{Number(request.down_payment).toLocaleString()}</span>
        </div>
        {status === "accepted" && (
          <div className="text-xs text-orange-dark mt-1">
            Waiting for the renter to pay: {timeLeft(request.payment_due_at, now)} left
          </div>
        )}
        {note && status !== "accepted" && <div className="text-xs text-ink-muted mt-1">{note}</div>}
        {blocker && <div className="text-xs text-ink-muted mt-1">{blocker}</div>}
      </div>
      <div className="shrink-0 flex flex-col gap-2 items-stretch">
        {status === "pending" || status === "accepted" ? (
          <>
            {status === "pending" && (
              <button onClick={() => onAccept(request.id)} disabled={Boolean(blocker) || busy}
                className="bg-green text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                Accept
              </button>
            )}
            <button onClick={() => onDecline(request.id)} disabled={busy}
              className="bg-transparent text-ink-muted border border-border-muted rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer disabled:opacity-40">
              Decline
            </button>
            <Link to="/messages" className="text-xs text-center text-green no-underline">
              Message renter
            </Link>
          </>
        ) : (
          <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full ${TONE_CLASSES[tone]}`}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export default function BookingRequests() {
  const { user } = useAuth();
  const now = useNow(1000);
  const { refreshBadges, lastEventAt } = useNotifications();
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    () => bookingService.getRequestsForOwner(user.id).then(setRequests),
    [user]
  );

  // Reload when a booking notification arrives (new request, deposit paid...).
  useEffect(() => {
    if (!user) return;
    load()
      .catch(() => setLoadError("Could not load booking requests."))
      .finally(() => setLoading(false));
  }, [user, load, lastEventAt]);

  async function act(id, action) {
    setBusyId(id);
    setActionError("");
    try {
      await action(id);
    } catch (err) {
      setActionError(friendlyError(err, "That didn't work. Please try again."));
    } finally {
      await load().catch(() => {});
      refreshBadges();
      setBusyId(null);
    }
  }

  const tab = TABS.find((t) => t.key === activeTab);
  const filtered = requests.filter((r) => tab.statuses.includes(effectiveStatus(r, now)));
  const countFor = (t) => requests.filter((r) => t.statuses.includes(effectiveStatus(r, now))).length;

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6 items-start">
        <Sidebar activeLink="/booking-requests" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-medium text-ink mb-4">Booking requests</h1>

          {actionError && (
            <div className="bg-red-tint text-red text-sm rounded-lg px-4 py-3 mb-4">{actionError}</div>
          )}

          <div className="flex gap-6 border-b border-border mb-5 overflow-x-auto">
            {TABS.map((t) => {
              const n = t.key === "pending" || t.key === "accepted" ? countFor(t) : 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`text-sm pb-3 bg-transparent border-none cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === t.key
                      ? "border-orange text-orange font-medium"
                      : "border-transparent text-ink-muted font-normal"
                  }`}
                >
                  {t.label}
                  {n > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red text-white text-[10px] font-medium">
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading && <div className="text-center py-10 text-ink-muted">Loading…</div>}
          {loadError && <div className="text-center py-10 text-red">{loadError}</div>}

          {!loading && !loadError && filtered.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-sm text-ink-muted border border-border/50">
              Nothing here right now
            </div>
          )}

          {!loading && !loadError && filtered.length > 0 && (
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <RequestRow key={r.id} request={r} allBookings={requests} now={now}
                  busy={busyId === r.id}
                  onAccept={(id) => act(id, bookingService.accept)}
                  onDecline={(id) => act(id, bookingService.decline)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
