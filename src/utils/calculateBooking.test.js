import { describe, expect, it } from "vitest";
import { calculateBooking } from "./calculateBooking";

describe("calculateBooking", () => {
  it("computes subtotal as priceDay x days", () => {
    const { subtotal } = calculateBooking(500, 3);
    expect(subtotal).toBe(1500);
  });

  it("charges a 5% service fee, rounded to the nearest Kwacha", () => {
    const { fee } = calculateBooking(500, 3); // subtotal 1500 -> fee 75
    expect(fee).toBe(75);
  });

  it("rounds the fee instead of truncating it", () => {
    // subtotal 333 * 0.05 = 16.65 -> rounds to 17, not 16
    const { fee } = calculateBooking(333, 1);
    expect(fee).toBe(17);
  });

  it("totals subtotal + fee", () => {
    const { subtotal, fee, total } = calculateBooking(500, 3);
    expect(total).toBe(subtotal + fee);
  });

  it("takes a 25% down payment, rounded, and leaves the rest as balance", () => {
    const { total, downPayment, balance } = calculateBooking(500, 3);
    expect(downPayment).toBe(Math.round(total * 0.25));
    expect(balance).toBe(total - downPayment);
    expect(downPayment + balance).toBe(total);
  });

  it("returns all zeros for a zero-day booking", () => {
    expect(calculateBooking(500, 0)).toEqual({
      subtotal: 0,
      fee: 0,
      total: 0,
      downPayment: 0,
      balance: 0,
    });
  });

  it("matches a known figure end to end (K500/day x 7 days)", () => {
    // subtotal 3500, fee 175 (5%), total 3675, downPayment 919 (round(3675*0.25)=918.75->919)
    expect(calculateBooking(500, 7)).toEqual({
      subtotal: 3500,
      fee: 175,
      total: 3675,
      downPayment: 919,
      balance: 2756,
    });
  });
});
