import { describe, it, expect } from "vitest";
import { renderBookingEmail } from "./bookingEmails";

const data = {
  equipment: "John Deere Tractor",
  renter: "Grace",
  owner: "Chanda",
  start_date: "2026-10-22",
  end_date: "2026-10-29",
  total: "3675.00",
  deposit: "919.00",
  balance: "2756.00",
  payment_due_at: "2026-10-17T08:00:00Z",
  reason: null,
};
const opts = { appUrl: "https://agrorent.example", bookingId: "abc" };

describe("renderBookingEmail", () => {
  it("tells the owner about a new request, with a link to Booking Requests", () => {
    const e = renderBookingEmail("request_received", data, opts);
    expect(e.subject).toBe("New booking request for John Deere Tractor");
    expect(e.text).toContain("Grace wants to rent your John Deere Tractor for 22 Oct 2026 – 29 Oct 2026 (K3,675 total)");
    expect(e.text).toContain("https://agrorent.example/booking-requests");
  });

  it("gives the renter the deposit, the deadline in Zambia time, and a pay link", () => {
    const e = renderBookingEmail("request_accepted", data, opts);
    expect(e.text).toContain("Pay the K919 deposit by 10:00 on 17 Oct (Zambia time)");
    expect(e.text).toContain("https://agrorent.example/booking/abc/pay");
  });

  it("explains why a request was declined", () => {
    expect(renderBookingEmail("request_declined", { ...data, reason: "dates_taken" }, opts).text)
      .toContain("Someone else booked and paid for those dates first.");
    expect(renderBookingEmail("request_declined", { ...data, reason: "owner_declined" }, opts).text)
      .toContain("Chanda isn't able to take this booking.");
  });

  it("sends different expiry emails to owner and renter", () => {
    expect(renderBookingEmail("expired_owner", data, opts).subject).toBe("Request from Grace declined: deposit not paid");
    expect(renderBookingEmail("expired_renter", data, opts).subject).toBe("Booking cancelled: John Deere Tractor");
  });

  it("tells the renter their deposit refund is on its way", () => {
    const e = renderBookingEmail("refund_pending", data, opts);
    expect(e.subject).toBe("Booking cancelled: your K919 deposit will be refunded");
    expect(e.text).toContain("refunded to you within 5 working days");
  });

  it("escapes names in the HTML version", () => {
    const e = renderBookingEmail("request_received", { ...data, renter: "<b>x</b>" }, opts);
    expect(e.html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(e.html).not.toContain("<b>x</b>");
  });

  it("returns null for an unknown kind", () => {
    expect(renderBookingEmail("nope", data, opts)).toBe(null);
  });
});
