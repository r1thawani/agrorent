import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";
import { useNow } from "../hooks/useNow";
import { useNotifications } from "../context/NotificationContext";
import { formatDateRange } from "../utils/formatDate";
import { friendlyError } from "../utils/friendlyError";
import { describeStatus, effectiveStatus, timeLeft, TONE_CLASSES } from "../utils/bookingStatus";

// Tabs group bookings by what the renter needs to do.
const TABS = [
  { key: "all", label: "All" },
  { key: "pay", label: "To pay", statuses: ["accepted"] },
  { key: "requested", label: "Requested", statuses: ["pending"] },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
  { key: "closed", label: "Cancelled / declined", statuses: ["cancelled", "declined", "expired"] },
];

function ContactLine({ contact, who }) {
  if (!contact) return null;
  return (
    <div className="text-xs text-ink mt-1.5">
      {who}: {contact.name}
      {contact.phone ? (
        <> · <a href={`tel:${contact.phone}`} className="text-green no-underline select-all">{contact.phone}</a></>
      ) : (
        <span className="text-ink-muted"> · no phone number added yet, use Messages</span>
      )}
    </div>
  );
}

function BookingRow({ booking, now, onCancel, contact }) {
  const photos = (booking.equipment?.equipment_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const image = photos[0]?.url || "";
  const status = effectiveStatus(booking, now);
  const { label, tone, note } = describeStatus(booking, "renter", now);
  const today = now.toISOString().slice(0, 10);
  // A paid booking can be cancelled (with a deposit refund) until it starts.
  const canCancel = status === "pending" || status === "accepted" || (status === "confirmed" && booking.start_date > today);

  return (
    <div className={`bg-white rounded-xl p-4 flex flex-wrap sm:flex-nowrap items-center gap-4 border ${
      status === "accepted" ? "border-orange" : "border-border/50"
    }`}>
      <img src={image} alt={booking.equipment?.name}
        className="w-[72px] h-[60px] rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink">{booking.equipment?.name}</div>
        <div className="text-[13px] text-ink-muted my-0.5 mb-2">
          {formatDateRange(booking.start_date, booking.end_date)}
        </div>
        <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full ${TONE_CLASSES[tone]}`}>
          {label}
        </span>
        {note && <div className="text-xs text-ink-muted mt-1.5">{note}</div>}
        <ContactLine contact={contact} who="Owner" />
      </div>
      <div className="text-right shrink-0">
        <div className="text-[15px] font-medium text-orange">K{Number(booking.total_price).toLocaleString()}</div>
        <div className="text-[11px] text-ink-muted">deposit K{Number(booking.down_payment).toLocaleString()}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {status === "accepted" && (
          <Link to={`/booking/${booking.id}/pay`}
            className="text-[13px] px-3 py-1.5 rounded-lg bg-orange text-white font-medium no-underline text-center">
            Pay deposit · {timeLeft(booking.payment_due_at, now)}
          </Link>
        )}
        {(status === "confirmed" || status === "completed") && (
          <Link to={`/booking/${booking.id}/confirmation`} className="text-[13px] text-green font-medium no-underline">
            Booking details
          </Link>
        )}
        <Link to={`/listings/${booking.equipment_id}`} className="text-[13px] text-green no-underline">
          View listing
        </Link>
        {canCancel && (
          <button onClick={() => onCancel(booking)}
            className="text-[13px] text-red bg-transparent border-none p-0 cursor-pointer">
            {status === "pending" ? "Withdraw request" : "Cancel booking"}
          </button>
        )}
        {status === "completed" && (
          <Link to={`/review/${booking.id}`}
            className="text-xs px-3 py-[5px] rounded-lg border-[1.5px] border-orange text-orange font-medium no-underline">
            Leave a review
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const location = useLocation();
  const now = useNow(1000);
  const { refreshBadges, lastEventAt } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const flash = location.state?.flash;

  // Reload when a booking notification arrives (e.g. the owner accepts).
  useEffect(() => {
    if (!user) return;
    bookingService.getContacts().then(setContacts);
    bookingService.getMyBookings(user.id)
      .then(setBookings)
      .catch(() => setLoadError("Could not load your bookings."))
      .finally(() => setLoading(false));
  }, [user, lastEventAt]);

  const [notice, setNotice] = useState("");

  async function handleCancel(booking) {
    const id = booking.id;
    const paid = booking.status === "confirmed";
    const deposit = `K${Number(booking.down_payment).toLocaleString()}`;
    const question = paid
      ? `Cancel this booking? Your ${deposit} deposit will be refunded within 5 working days.`
      : "Cancel this request?";
    if (!window.confirm(question)) return;
    setActionError("");
    setNotice("");
    const original = bookings.find((b) => b.id === id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    try {
      const updated = await bookingService.cancel(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
      if (paid) setNotice(`Booking cancelled. Your ${deposit} deposit will be refunded within 5 working days, and we've emailed you the details.`);
      refreshBadges();
    } catch (err) {
      setBookings((prev) => prev.map((b) => (b.id === id ? original : b)));
      setActionError(friendlyError(err, "Could not cancel this booking."));
    }
  }

  const tab = TABS.find((t) => t.key === activeTab);
  const filtered = tab.statuses
    ? bookings.filter((b) => tab.statuses.includes(effectiveStatus(b, now)))
    : bookings;
  const toPay = bookings.filter((b) => effectiveStatus(b, now) === "accepted").length;

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6 items-start">
        <Sidebar activeLink="/my-bookings" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[26px] font-medium text-ink mb-5">My bookings</h1>

          {flash && (
            <div className="bg-green-tint text-green-dark text-sm rounded-lg px-4 py-3 mb-4">{flash}</div>
          )}
          {notice && (
            <div className="bg-green-tint text-green-dark text-sm rounded-lg px-4 py-3 mb-4">{notice}</div>
          )}
          {actionError && (
            <div className="bg-red-tint text-red text-sm rounded-lg px-4 py-3 mb-4">{actionError}</div>
          )}

          <div className="flex gap-6 border-b border-border mb-5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`text-sm pb-3 bg-transparent cursor-pointer border-none border-b-2 whitespace-nowrap ${
                  activeTab === t.key
                    ? "border-orange text-orange font-medium"
                    : "border-transparent text-ink-muted font-normal"
                }`}
              >
                {t.label}
                {t.key === "pay" && toPay > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red text-white text-[10px] font-medium">
                    {toPay}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-10 text-ink-muted">Loading…</div>}
          {loadError && <div className="text-center py-10 text-red">{loadError}</div>}

          {!loading && !loadError && filtered.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center border border-border/50">
              <div className="text-[32px] mb-2">📋</div>
              <div className="text-sm text-ink-muted">Nothing here yet</div>
            </div>
          )}

          {!loading && !loadError && filtered.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {filtered.map((b) => (
                <BookingRow key={b.id} booking={b} now={now} onCancel={handleCancel} contact={contacts[b.id]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
