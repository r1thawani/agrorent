import { describe, it, expect } from "vitest";
import { ownerEarning, earningStatus, summarizeEarnings, lastMonths } from "./earnings";

const TODAY = "2026-10-16";

function booking(overrides) {
  // K500/day x 7 days: subtotal 3500, fee 175, total 3675, deposit 919, balance 2756
  return {
    id: "b",
    status: "confirmed",
    start_date: "2026-10-20",
    end_date: "2026-10-27",
    subtotal: 3500,
    service_fee: 175,
    total_price: 3675,
    balance_due: 2756,
    ...overrides,
  };
}

describe("ownerEarning", () => {
  it("is the subtotal, not the total that includes AgroRent's 5% fee", () => {
    expect(ownerEarning(booking())).toBe(3500);
  });

  it("falls back to total minus fee when subtotal is missing", () => {
    expect(ownerEarning(booking({ subtotal: null }))).toBe(3500);
  });

  it("reads numeric strings as returned by Postgres", () => {
    expect(ownerEarning(booking({ subtotal: "3500.00" }))).toBe(3500);
  });
});

describe("earningStatus", () => {
  it("ignores pending, declined and cancelled bookings", () => {
    for (const status of ["pending", "declined", "cancelled"]) {
      expect(earningStatus(booking({ status }), TODAY)).toBe(null);
    }
  });

  it("treats a confirmed booking that has ended as completed", () => {
    expect(earningStatus(booking({ start_date: "2026-10-01", end_date: "2026-10-15" }), TODAY)).toBe("completed");
  });

  it("treats a confirmed booking ending today or later as upcoming", () => {
    expect(earningStatus(booking({ start_date: "2026-10-10", end_date: TODAY }), TODAY)).toBe("upcoming");
  });
});

describe("summarizeEarnings", () => {
  const months = lastMonths(TODAY).map((m) => m.key);
  const bookings = [
    booking({ id: "done", status: "completed", start_date: "2026-09-01", end_date: "2026-09-08" }),
    booking({ id: "ended", start_date: "2026-10-01", end_date: "2026-10-08" }),
    booking({ id: "ongoing", start_date: "2026-10-14", end_date: "2026-10-21" }),
    booking({ id: "future", start_date: "2026-11-02", end_date: "2026-11-09" }),
    booking({ id: "pending", status: "pending" }),
    booking({ id: "cancelled", status: "cancelled" }),
  ];
  const s = summarizeEarnings(bookings, TODAY, months);

  it("splits earned (ended) from upcoming (not ended) rentals", () => {
    expect(s.earned).toBe(7000);
    expect(s.upcoming).toBe(7000);
  });

  it("only counts the pickup balance for rentals that haven't started", () => {
    expect(s.toCollectAtPickup).toBe(2756);
  });

  it("groups by the month the rental starts, not when it was requested", () => {
    expect(s.byMonth["2026-09"]).toBe(3500);
    expect(s.byMonth["2026-10"]).toBe(7000);
    expect(s.thisMonth).toBe(7000);
  });

  it("lists only the bookings that earn money", () => {
    expect(s.earning.map((b) => b.id)).toEqual(["done", "ended", "ongoing", "future"]);
  });
});

describe("lastMonths", () => {
  it("returns the last 8 months oldest first, crossing the year boundary", () => {
    const m = lastMonths("2026-02-10");
    expect(m).toHaveLength(8);
    expect(m[0].key).toBe("2025-07");
    expect(m[7]).toEqual({ key: "2026-02", label: "Feb" });
  });
});
