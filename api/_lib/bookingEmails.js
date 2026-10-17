// Text of the booking emails queued by the database (booking_events() in
// migrations/003_request_then_pay.sql). Pure function, unit-tested in
// bookingEmails.test.js.

import { escapeHtml } from "./text.js";

function kwacha(n) {
  return `K${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function day(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

// "10:00 on 17 Oct", in Zambia time.
function dueTime(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lusaka" });
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lusaka" });
  return `${time} on ${date}`;
}

const DECLINE_REASONS = {
  dates_taken: "Someone else booked and paid for those dates first.",
  listing_removed: "The owner removed this listing.",
};

// Returns { subject, lines, button: { label, path } } or null for an unknown kind.
function content(kind, d, bookingId) {
  const dates = `${day(d.start_date)} – ${day(d.end_date)}`;
  switch (kind) {
    case "request_received":
      return {
        subject: `New booking request for ${d.equipment}`,
        lines: [
          `${d.renter} wants to rent your ${d.equipment} for ${dates} (${kwacha(d.total)} total).`,
          "Accept or decline the request on AgroRent. If you accept, they'll have a limited time to pay the 25% deposit.",
        ],
        button: { label: "View request", path: "/booking-requests" },
      };
    case "request_accepted":
      return {
        subject: `Accepted: pay your deposit for ${d.equipment}`,
        lines: [
          `Good news! ${d.owner} accepted your request for ${d.equipment} (${dates}).`,
          `Pay the ${kwacha(d.deposit)} deposit by ${dueTime(d.payment_due_at)} (Zambia time) to confirm the booking. If it isn't paid by then, the booking is cancelled.`,
          `The remaining ${kwacha(d.balance)} is paid at pickup.`,
        ],
        button: { label: "Pay deposit", path: `/booking/${bookingId}/pay` },
      };
    case "request_declined":
      return {
        subject: `Your request for ${d.equipment} was declined`,
        lines: [
          `Your request for ${d.equipment} (${dates}) was declined.`,
          DECLINE_REASONS[d.reason] || `${d.owner} isn't able to take this booking.`,
          "No money was taken. You can look for other dates or equipment on AgroRent.",
        ],
        button: { label: "Browse equipment", path: "/listings" },
      };
    case "deposit_paid":
      return {
        subject: `Booking confirmed: ${d.equipment}, ${dates}`,
        lines: [
          `${d.renter} paid the ${kwacha(d.deposit)} deposit. Your ${d.equipment} is booked for ${dates}.`,
          `Collect the remaining ${kwacha(d.balance)} at pickup. Any other requests for these dates were declined automatically.`,
        ],
        button: { label: "View bookings", path: "/booking-requests" },
      };
    case "expired_owner":
      return {
        subject: `Request from ${d.renter} declined: deposit not paid`,
        lines: [
          `${d.renter} didn't pay the deposit for ${d.equipment} (${dates}) in time, so the request was declined automatically.`,
          "Those dates are free again, and you can accept another request for them.",
        ],
        button: { label: "View requests", path: "/booking-requests" },
      };
    case "expired_renter":
      return {
        subject: `Booking cancelled: ${d.equipment}`,
        lines: [
          `Your booking for ${d.equipment} (${dates}) was cancelled because the deposit wasn't paid in time.`,
          "No money was taken. If you still need it, you can send a new request.",
        ],
        button: { label: "Browse equipment", path: "/listings" },
      };
    case "renter_cancelled":
      return {
        subject: `${d.renter} cancelled their booking for ${d.equipment}`,
        lines: [`${d.renter} cancelled their booking for ${d.equipment} (${dates}). Those dates are free again.`],
        button: { label: "View requests", path: "/booking-requests" },
      };
    default:
      return null;
  }
}

export function renderBookingEmail(kind, data, { appUrl, bookingId }) {
  const c = content(kind, data || {}, bookingId);
  if (!c) return null;
  const link = `${appUrl}${c.button.path}`;
  const text = `${c.lines.join("\n\n")}\n\n${c.button.label}: ${link}\n\n— AgroRent`;
  const html = `${c.lines.map((l) => `<p>${escapeHtml(l)}</p>`).join("\n")}
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#FF5C00;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${escapeHtml(c.button.label)}</a></p>
<p style="color:#888;font-size:12px">AgroRent: rent the equipment, grow the harvest.</p>`;
  return { subject: c.subject, text, html };
}
