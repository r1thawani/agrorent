import { describe, it, expect } from "vitest";
import { rangesOverlap, effectiveStatus, describeStatus, timeLeft, acceptBlocker } from "./bookingStatus";

const NOW = new Date("2026-10-17T10:00:00Z");
const inMinutes = (m) => new Date(NOW.getTime() + m * 60000).toISOString();

describe("rangesOverlap", () => {
  it("treats touching end/start dates as overlapping, like the database", () => {
    expect(rangesOverlap("2026-10-20", "2026-10-25", "2026-10-25", "2026-10-28")).toBe(true);
    expect(rangesOverlap("2026-10-20", "2026-10-24", "2026-10-25", "2026-10-28")).toBe(false);
  });
});

describe("effectiveStatus", () => {
  it("shows an accepted booking past its deadline as expired", () => {
    expect(effectiveStatus({ status: "accepted", payment_due_at: inMinutes(-1) }, NOW)).toBe("expired");
    expect(effectiveStatus({ status: "accepted", payment_due_at: inMinutes(1) }, NOW)).toBe("accepted");
    expect(effectiveStatus({ status: "pending" }, NOW)).toBe("pending");
  });
});

describe("describeStatus", () => {
  it("shows an expired booking as Cancelled to the renter and Declined to the owner", () => {
    const b = { status: "expired" };
    expect(describeStatus(b, "renter", NOW).label).toBe("Cancelled");
    expect(describeStatus(b, "owner", NOW).label).toBe("Declined");
  });

  it("explains why a request was declined", () => {
    const b = { status: "declined", status_reason: "dates_taken" };
    expect(describeStatus(b, "renter", NOW).note).toBe("Someone else booked these dates first.");
  });
});

describe("describeStatus for a cancelled paid booking", () => {
  const b = { status: "cancelled", paid_at: "2026-10-17T09:00:00Z", down_payment: "919.00" };

  it("tells the renter the deposit will be refunded", () => {
    expect(describeStatus(b, "renter", NOW).note).toBe("You cancelled. Your K919 deposit will be refunded within 5 working days.");
  });

  it("tells the owner the deposit is going back to the renter", () => {
    expect(describeStatus(b, "owner", NOW).note).toBe("The renter cancelled. Their K919 deposit is being refunded.");
  });

  it("says nothing about refunds when no deposit was paid", () => {
    expect(describeStatus({ status: "cancelled" }, "renter", NOW).note).toBe("You cancelled this booking.");
  });
});

describe("timeLeft", () => {
  it("counts down in minutes:seconds under an hour", () => {
    expect(timeLeft(inMinutes(1.75), NOW)).toBe("1:45");
  });
  it("uses hours and days for longer periods", () => {
    expect(timeLeft(inMinutes(200), NOW)).toBe("3h 20m");
    expect(timeLeft(inMinutes(60 * 24 * 2 + 60 * 4), NOW)).toBe("2d 4h");
  });
  it("is empty once the time has passed", () => {
    expect(timeLeft(inMinutes(-1), NOW)).toBe("");
  });
});

describe("acceptBlocker", () => {
  const base = { equipment_id: "e1", start_date: "2026-10-20", end_date: "2026-10-25" };
  const request = { ...base, id: "r", status: "pending" };

  it("allows accepting when nothing else holds the dates", () => {
    const other = { ...base, id: "o", status: "pending" };
    expect(acceptBlocker(request, [request, other], NOW)).toBe("");
  });

  it("blocks while another overlapping request is accepted and still within its time to pay", () => {
    const other = { ...base, id: "o", status: "accepted", payment_due_at: inMinutes(2) };
    expect(acceptBlocker(request, [request, other], NOW)).toMatch(/Waiting for that renter to pay \(2:00 left\)/);
  });

  it("stops blocking once that renter's time has run out", () => {
    const other = { ...base, id: "o", status: "accepted", payment_due_at: inMinutes(-1) };
    expect(acceptBlocker(request, [request, other], NOW)).toBe("");
  });

  it("blocks dates that are already paid for, but not other equipment or other dates", () => {
    const paid = { ...base, id: "p", status: "confirmed" };
    expect(acceptBlocker(request, [paid], NOW)).toBe("These dates are already booked and paid for.");
    expect(acceptBlocker(request, [{ ...paid, equipment_id: "e2" }], NOW)).toBe("");
    expect(acceptBlocker(request, [{ ...paid, start_date: "2026-11-01", end_date: "2026-11-03" }], NOW)).toBe("");
  });
});
