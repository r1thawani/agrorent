// Booking status helpers shared by MyBookings, BookingRequests, the
// dashboards and the pay page. The database is the source of truth
// (migrations/003_request_then_pay.sql); these only decide what to show.

// Date ranges are inclusive "YYYY-MM-DD" strings, like the database check.
export function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA;
}

// The nightly/minutely job marks unpaid bookings expired within a minute;
// show them as expired straight away rather than waiting for it.
export function effectiveStatus(booking, now = new Date()) {
  if (booking.status === "accepted" && booking.payment_due_at && new Date(booking.payment_due_at) <= now) {
    return "expired";
  }
  return booking.status;
}

const RENTER = {
  pending:   { label: "Requested", tone: "orange", note: "Waiting for the owner to respond." },
  accepted:  { label: "Pay deposit", tone: "orange", note: "Accepted! Pay the deposit to confirm." },
  confirmed: { label: "Confirmed", tone: "green" },
  completed: { label: "Completed", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "red", note: "You cancelled this booking." },
  expired:   { label: "Cancelled", tone: "red", note: "The deposit wasn't paid in time." },
  declined:  { label: "Declined", tone: "red" },
};

const OWNER = {
  pending:   { label: "New request", tone: "orange" },
  accepted:  { label: "Awaiting payment", tone: "orange" },
  confirmed: { label: "Confirmed", tone: "green", note: "Deposit paid." },
  completed: { label: "Completed", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "red", note: "The renter cancelled." },
  expired:   { label: "Declined", tone: "red", note: "Deposit not paid in time." },
  declined:  { label: "Declined", tone: "red" },
};

const DECLINE_NOTES = {
  renter: {
    owner_declined: "The owner declined this request.",
    dates_taken: "Someone else booked these dates first.",
    listing_removed: "The owner removed this listing.",
  },
  owner: {
    owner_declined: "You declined this request.",
    dates_taken: "Declined automatically: these dates were booked by someone else.",
    listing_removed: "Declined when you removed the listing.",
  },
};

// { label, tone, note } for a booking, as the renter or the owner sees it.
export function describeStatus(booking, role, now = new Date()) {
  const status = effectiveStatus(booking, now);
  const table = role === "owner" ? OWNER : RENTER;
  const base = table[status] || { label: status, tone: "muted" };
  if (status === "declined") {
    return { ...base, note: DECLINE_NOTES[role === "owner" ? "owner" : "renter"][booking.status_reason] || base.note };
  }
  // A paid booking that was cancelled: the deposit goes back to the renter.
  if (status === "cancelled" && booking.paid_at) {
    const deposit = `K${Number(booking.down_payment || 0).toLocaleString("en-US")}`;
    return {
      ...base,
      note: role === "owner"
        ? `The renter cancelled. Their ${deposit} deposit is being refunded.`
        : `You cancelled. Your ${deposit} deposit will be refunded within 5 working days.`,
    };
  }
  return base;
}

export const TONE_CLASSES = {
  orange: "bg-orange-tint text-orange-dark",
  green: "bg-green-tint text-green-dark",
  red: "bg-red-tint text-red",
  muted: "bg-page text-ink-muted",
};

// "1:45" under an hour, "3h 20m" under a day, otherwise "2d 4h". "" when past.
export function timeLeft(dueIso, now = new Date()) {
  const ms = new Date(dueIso) - now;
  if (!(ms > 0)) return "";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

// Whether the owner may accept `request` right now, given all of their
// bookings. Mirrors the check in accept_booking(); the database has the
// final say. Returns "" if fine, otherwise the reason.
export function acceptBlocker(request, allBookings, now = new Date()) {
  const clash = allBookings.find((b) =>
    b.id !== request.id &&
    b.equipment_id === request.equipment_id &&
    rangesOverlap(request.start_date, request.end_date, b.start_date, b.end_date) &&
    (b.status === "confirmed" || effectiveStatus(b, now) === "accepted")
  );
  if (!clash) return "";
  if (clash.status === "confirmed") return "These dates are already booked and paid for.";
  return `You accepted another request for these dates. Waiting for that renter to pay (${timeLeft(clash.payment_due_at, now)} left).`;
}
